import { Instance, Direction, monotone, GraphNode, GraphNodeKind, createScopeResolver, Jump, TransferResult, utils, runString } from "monotone";
import * as ts from "typescript";
import * as types from "./types";
import { createNodeTypeStorage, createSymbolTypeStorage, TypeStorage, TypeStore } from "./typestorage";
import { curry, isFunctionLike, unreachable, identifierIsExpression } from "./utils";

export interface Output {
	types: string[];
	lastType: types.Type | undefined;
}

interface Environment {
	reachable: boolean;
	thisType: types.Type;
	symbolTypes: TypeStore<number>;
	nodeTypes: TypeStore<ts.Node>;
	returnType: types.Type;
}
enum SpecialContext {
	Toplevel,
	// Context for a node that has too many contexts
	Bounded
}
type Context = { node: ts.Node | undefined, context: Context } | SpecialContext;

export function lastType(source: string) {
	const type = runString(typeChecker(), true, source).lastType;
	if (type === undefined) return "<no types>";
	return type.show();
}

const contextSensitive = true;
const maxContextsPerNode = 20;

export function typeChecker(): Instance<Output> {
	return monotone<Environment, Context, Output, ts.Node>((files, checker) => {
		const scopeResolver = createScopeResolver(checker);

		const rootTypes = new Map<string, types.Type>();
		for (const file of files) {
			initRootTypes(file);
		}

		const typeHost: types.TypeHost = {
			instantiateCache: new WeakMap(),
			rootType,
			globalObject:   rootObjectType("Object"),
			globalArray:    rootObjectType("Array"),
			globalBoolean:  rootObjectType("Boolean"),
			globalNumber:   rootObjectType("Number"),
			globalString:   rootObjectType("String"),
			globalFunction: rootObjectType("Function")
		};

		const typesEqual = curry(types.typesEqual, typeHost);
		const isSubtype = curry(types.isSubtype, typeHost);
		const propertyType = curry(types.propertyType, typeHost);
		const typeLiteralMap = curry(types.typeLiteralMap, typeHost);
		const union = curry(types.union, typeHost);
		const intersect = curry(types.intersect, typeHost);
		const narrowTypeAfterCondition = curry(types.narrowTypeAfterCondition, typeHost);
		const filterUnion = curry(types.filterUnion, typeHost);
		const mapUnion = curry(types.mapUnion, typeHost);
		const toNumber = curry(types.toNumber, typeHost);
		const typesOverlap = curry(types.typesOverlap, typeHost);
		const fromTsType = curry(types.fromTsType, typeHost);
		const instantiate = curry(types.instantiateObject, typeHost);
		const functionSignatureMatches = curry(types.functionSignatureMatches, typeHost);

		const storageRootSymbol: TypeStorage<number> = createSymbolTypeStorage(typeHost, () => types.primitiveNever);
		const rootSymbols = files.reduce<TypeStore<number>>((types, file) => initScope(file, types, storageRootSymbol), storageRootSymbol.createEmpty());
		const storageSymbol: TypeStorage<number> = createSymbolTypeStorage(typeHost, symbolId => storageRootSymbol.get(rootSymbols, symbolId));
		const storageNode = createNodeTypeStorage(typeHost, () => types.primitiveNever);

		const contextMap = utils.Map2D<ts.Node | undefined, Context, Context>();

		const bottom: Environment = {
			reachable: false,
			thisType: types.primitiveNever,
			symbolTypes: storageSymbol.createEmpty(),
			nodeTypes: storageNode.createEmpty(),
			returnType: types.primitiveNever
		};
		const bottomReachable: Environment = {
			reachable: true,
			thisType: types.primitiveNever,
			symbolTypes: storageSymbol.createEmpty(),
			nodeTypes: storageNode.createEmpty(),
			returnType: types.primitiveNever
		};

		return {
			direction: Direction.Forward,
			bottom,
			entry,
			join,
			equal,
			kinds: [GraphNodeKind.Begin, GraphNodeKind.End, GraphNodeKind.GuardTrue, GraphNodeKind.GuardFalse],
			isEntry,
			initialContexts,
			filter: (_node: ts.Node): _node is ts.Node => true,
			transfer,
			transferMerge,
			result
		};

		function Context(node: ts.Node | undefined, context: Context) {
			if (!contextSensitive) {
				node = undefined;
				context = SpecialContext.Bounded;
			} else if (typeof context !== "number" && contextMap.sizeForKey(node) >= maxContextsPerNode) {
				context = SpecialContext.Bounded;
			}
			return contextMap.getOrCreate(node, context, { node, context });
		}

		function equal(a: Environment, b: Environment) {
			if (a.reachable !== b.reachable) return false;
			if (!a.reachable) return true;
			return typesEqual(a.thisType, b.thisType)
				&& storageNode.equal(a.nodeTypes, b.nodeTypes)
				&& storageSymbol.equal(a.symbolTypes, b.symbolTypes)
				&& typesEqual(a.returnType, b.returnType);
		}
		
		function isEntry(location: GraphNode<ts.Node>) {
			if (location.kind !== GraphNodeKind.Begin) return false;
			const parent = location.node.parent;
			if (!parent) return true;
			return false;
		}
		function initialContexts(location: GraphNode<ts.Node>) {
			if (isToplevel(location.node)) return [SpecialContext.Toplevel];
			return [];
		}
		function isToplevel(node: ts.Node) {
			let current: ts.Node | undefined = node.parent;
			while (current !== undefined) {
				switch (current.kind) {
					case ts.SyntaxKind.FunctionDeclaration:
					case ts.SyntaxKind.FunctionExpression:
					case ts.SyntaxKind.ModuleDeclaration:
					case ts.SyntaxKind.ArrowFunction:
					case ts.SyntaxKind.ClassDeclaration:
					case ts.SyntaxKind.ClassExpression:
					case ts.SyntaxKind.GetAccessor:
					case ts.SyntaxKind.MethodDeclaration:
					case ts.SyntaxKind.MethodDeclaration:
						return false;
				}
				current = current.parent;
			}
			return true;
		}
		function entry(): Environment {
			return bottomReachable; // initScope(node, bottomReachable);
		}
		function join(a: Environment, b: Environment): Environment {
			if (a.reachable && b.reachable) {
				return {
					reachable: true,
					thisType: union([a.thisType, b.thisType]),
					symbolTypes: storageSymbol.createStore(new Map(), [a.symbolTypes, b.symbolTypes]),
					nodeTypes: storageNode.createStore(new Map(), [a.nodeTypes, b.nodeTypes]),
					returnType: union([a.returnType, b.returnType])
				};
			}
			if (a.reachable) return a;
			if (b.reachable) return b;
			return bottom;
		}
		
		function result(get: (node: ts.Node, kind: GraphNodeKind, context: Context, out: boolean) => Environment, contexts: (node: ts.Node, kind: GraphNodeKind) => Iterable<Context>): Output {
			const result: string[] = [];
			let output: string[] = [];
			let lastType: types.Type | undefined;
			let file: ts.SourceFile;
			let lines: string[];
			let currentLine: number;
			
			let f: ts.SourceFile;
			for (f of files) {
				if (f.isDeclarationFile) continue;
				file = f;
				lines = file.text.split(/\r?\n/);
				currentLine = 0;
				visit(file);
				result.push(output.join('\n'));
				while (currentLine < lines.length - 1) {
					output.push(lines[currentLine]);
					currentLine++;
				}
			}

			return {
				types: result,
				lastType
			};
			
			function visit(node: ts.Node) {
				ts.forEachChild(node, visit);

				if (shouldPrint(node)) {
					const { line } = file.getLineAndCharacterOfPosition(node.pos + 1);
					while (currentLine <= line) {
						output.push(lines[currentLine]);
						currentLine++;
					}

					const t: types.Type[] = [];
					let countReachable = 0;
					for (const context of contexts(node, GraphNodeKind.End)) {
						const env = get(node, GraphNodeKind.End, context, true);
						t.push(typeOf(node, env));
						if (env.reachable) {
							countReachable++;
						}
					}

					lastType = union(t);
					output.push(">" + node.getText(f) + ": " + lastType.show() + "; " + countReachable + "/" + t.length);
				}
			}
			function shouldPrint(node: ts.Node) {
				if (node.kind === ts.SyntaxKind.Identifier && identifierIsExpression(node as ts.Identifier)) return true;
				if (node.kind === ts.SyntaxKind.CallExpression) return true;
				if (node.kind === ts.SyntaxKind.PropertyAccessExpression) return true;
				return false;
			}
		}

		function envSetThisType(thisType: types.Type, env: Environment): Environment {
			return {
				reachable: env.reachable,
				thisType,
				nodeTypes: env.nodeTypes,
				symbolTypes: env.symbolTypes,
				returnType: env.returnType
			};
		}
		function envSetNode(node: ts.Node, type: types.Type, env: Environment): Environment {
			return {
				reachable: env.reachable,
				thisType: env.thisType,
				nodeTypes: storageNode.createSingleton(node, type, [env.nodeTypes]),
				symbolTypes: env.symbolTypes,
				returnType: env.returnType
			};
		}
		function envSetSymbol(id: number | undefined, type: types.Type, env: Environment): Environment {
			if (id === undefined) return env;
			return {
				reachable: env.reachable,
				thisType: env.thisType,
				nodeTypes: env.nodeTypes,
				symbolTypes: storageSymbol.createSingleton(id, type, [env.symbolTypes]),
				returnType: env.returnType
			};
		}
		function envSetReturnType(returnType: types.Type, env: Environment): Environment {
			return {
				reachable: env.reachable,
				thisType: env.thisType,
				nodeTypes: env.nodeTypes,
				symbolTypes: env.symbolTypes,
				returnType
			};
		}

		function transfer(node: ts.Node, kind: GraphNodeKind, context: Context, env: Environment): TransferResult<Context, Environment> {
			if (!env.reachable) return TransferResult<Context, Environment>(env);

			if (kind === GraphNodeKind.Begin) {
				switch (node.kind) {
					case ts.SyntaxKind.Block:
					case ts.SyntaxKind.ModuleBlock:
						const symbolTypes = initScope(node, env.symbolTypes);
						return TransferResult<Context, Environment>({
							reachable: env.reachable,
							thisType: env.thisType,
							nodeTypes: env.nodeTypes,
							symbolTypes,
							returnType: env.returnType
						});
				}
			}
			if (kind === GraphNodeKind.End) {
				switch (node.kind) {
					case ts.SyntaxKind.Identifier:
					case ts.SyntaxKind.ThisKeyword:
						env = transferIdentifierOrThisKeyword(node, env);
						break;
					case ts.SyntaxKind.VariableDeclaration:
						env = transferVariableDeclaration(node as ts.VariableDeclaration, env);
						break;
					case ts.SyntaxKind.PrefixUnaryExpression:
					case ts.SyntaxKind.PostfixUnaryExpression:
						env = transferUnaryExpression(node as ts.PrefixUnaryExpression | ts.PostfixUnaryExpression, env);
						break;
					case ts.SyntaxKind.BinaryExpression:
						env = transferBinaryExpression(node as ts.BinaryExpression, env);
						break;
					case ts.SyntaxKind.ExpressionStatement: // TODO: More statements
						env = transferStatement(node, env);
						break;
					case ts.SyntaxKind.ReturnStatement:
						env = transferReturnStatement(node as ts.ReturnStatement, env);
						break;
					case ts.SyntaxKind.CallExpression:
					case ts.SyntaxKind.NewExpression:
						// TODO: Call expression that is a guard
						return transferCallOrNewExpression(node as ts.CallExpression | ts.NewExpression, context, env);
				}
			}
			if (kind === GraphNodeKind.GuardTrue) env = transferGuard(node, true, env);
			if (kind === GraphNodeKind.GuardFalse) env = transferGuard(node, false, env);
			return TransferResult<Context, Environment>(env);
		}
		function transferMerge(node: ts.Node, _kind: GraphNodeKind, from: ts.Node, _fromKind: GraphNodeKind, beforeEnv: Environment, jumpEnv: Environment): Environment {
			if (!jumpEnv.reachable) {
				return beforeEnv;
			}
			if (node.kind === ts.SyntaxKind.CallExpression || node.kind === ts.SyntaxKind.NewExpression) {
				let resultType = jumpEnv.returnType;
				if (from.kind !== ts.SyntaxKind.ReturnStatement) {
					resultType = types.primitiveUndefined;
				}
				if (node.kind === ts.SyntaxKind.NewExpression) {
					resultType = mapUnion(resultType, t => t === types.primitiveUndefined ? jumpEnv.thisType : t);
				}
				let newEnv = envSetNode(node, resultType, beforeEnv);
				newEnv = join(newEnv, jumpEnv);
				return envSetReturnType(types.primitiveNever, newEnv);
			} else {
				throw new Error("Invalid target for transfer merge function: " + ts.SyntaxKind[node.kind]);
			}
		}

		// Transfer functions
		function transferIdentifierOrThisKeyword(node: ts.Node, env: Environment) {
			const scopeId = scopeResolver.get(node);
			if (scopeId === undefined) return env;
			const type = storageSymbol.get(env.symbolTypes, scopeId);
			if (type === types.primitiveNever) return env;
			return envSetNode(node, type, env);
		}
		function transferUnaryExpression(node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression, env: Environment) {
			const scopeId = scopeResolver.get(node.operand);
			if (scopeId === undefined) return env;
			const type = typeOf(node.operand, env);
			switch (node.operator) {
				case ts.SyntaxKind.PlusPlusToken:
					return envSetSymbol(scopeId, typeLiteralMap(type, types.primitiveNumber, value => +value + 1), env);
				case ts.SyntaxKind.MinusMinusToken:
					return envSetSymbol(scopeId, typeLiteralMap(type, types.primitiveNumber, value => +value - 1), env);
				default:
					return env;
			}
		}
		function transferBinaryExpression(node: ts.BinaryExpression, env: Environment) {
			if (node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
				return transferAssignment(node, env);
			}
			return env;
		}
		function transferVariableDeclaration(node: ts.VariableDeclaration, env: Environment) {
			const reference = getNarrowingReference(node.name, env);
			if (reference === undefined) return env;
			return applyNarrowing(reference, node.initializer ? typeOf(node.initializer, env) : types.primitiveUndefined, env, true);
		}
		function transferReturnStatement(node: ts.ReturnStatement, env: Environment) {
			return envSetReturnType(node.expression === undefined ? types.primitiveUndefined : typeOf(node.expression, env), env);
		}
		function transferCallOrNewExpression(node: ts.CallExpression | ts.NewExpression, context: Context, env: Environment) {
			const functionType = typeOf(node.expression, env);
			const results: types.Type[] = [];
			const jumps: Jump<Context, Environment>[] = [];
			const isNew = node.kind === ts.SyntaxKind.NewExpression;
			let thisType: types.Type = types.primitiveUndefined;
			if (isNew) {
				thisType = propertyType(functionType, "prototype") || typeHost.globalObject;
			} else if (node.parent!.kind === ts.SyntaxKind.PropertyAccessExpression || node.parent!.kind === ts.SyntaxKind.ElementAccessExpression) {
				thisType = typeOf((node.parent! as ts.PropertyAccessExpression | ts.ElementAccessExpression).expression, env);
			}

			const args = node.arguments.map(arg => {
				if (arg.kind === ts.SyntaxKind.SpreadElementExpression) {
					return {
						spread: true,
						type: typeOf((arg as ts.SpreadElementExpression).expression, env)
					};
				} else {
					return {
						spread: false,
						type: typeOf(arg, env)
					};
				}
			});

			for (const part of types.unionParts(functionType)) {
				for (const type of types.intersectionParts(part)) {
					if (type instanceof types.FunctionSignature && type.isConstructor === isNew) {
						const match = functionSignatureMatches(type, thisType, args);
						if (match) results.push(types.limitFor(match.returnType, match));
					} else if (type instanceof types.FunctionReference) {
						let callEnv = envSetThisType(thisType, env);
						let rest: ts.ParameterDeclaration | undefined;
						for (let i = 0; i < node.arguments.length; i++) {
							const argument = rest || type.declaration.parameters[i];
							if (argument === undefined) break;
							if (argument.dotDotDotToken) rest = argument;

							callEnv = envSetSymbol(scopeResolver.get(argument.name), typeOf(node.arguments[i], env), callEnv);
						}
						for (let i = node.arguments.length; i < type.declaration.parameters.length; i++) {
							const argument = rest || type.declaration.parameters[i];
							callEnv = envSetSymbol(scopeResolver.get(argument.name), argument.dotDotDotToken ? instantiate(typeHost.globalArray.resolve(), types.primitiveNever) : types.primitiveUndefined, callEnv);
						}
						const jumpContext = Context(node, context);
						jumps.push(new Jump(type.declaration, jumpContext, callEnv));
					}
				}
			}
			return TransferResult(envSetNode(node, union(results), env), jumps);
		}
		function transferAssignment(node: ts.BinaryExpression, env: Environment): Environment {
			const reference = getNarrowingReference(node.left, env);
			if (reference === undefined) return env;
			// The value of the assignment expression is the same as the new value of the LHS.
			// So we can reuse the logic of `typeOfBinaryExpression` to calculate the type.
			const type = typeOfBinaryExpression(node, env);
			return applyNarrowing(reference, type, env, true);
		}
		function transferStatement(_node: ts.Node, env: Environment): Environment {
			return {
				reachable: env.reachable,
				thisType: env.thisType,
				symbolTypes: env.symbolTypes,
				nodeTypes: storageNode.createEmpty(),
				returnType: env.returnType
			};
		}

		// Narrowing transfer functions
		function transferGuard(node: ts.Node, trueBranch: boolean, env: Environment): Environment {
			const ref = getNarrowingReference(node, env);
			const type = typeOf(node as ts.Expression, env);
			const newType = narrowTypeAfterCondition(type, trueBranch);
			
			if (ref) {
				if (typesEqual(type, newType)) return env;
				return applyNarrowing(ref, type, env);
			}
			if (newType === types.primitiveNever) return bottom;

			switch (node.kind) {
				case ts.SyntaxKind.BinaryExpression:
					return transferGuardBinaryExpression(node as ts.BinaryExpression, trueBranch, env);
			}
			return env;
		}
		function transferGuardBinaryExpression(node: ts.BinaryExpression, trueBranch: boolean, env: Environment) {
			const leftType = typeOf(node.left, env);
			const rightType = typeOf(node.right, env);
			const left = getNarrowingReference(node.left, env);
			const right = getNarrowingReference(node.right, env);
			
			let kind: ts.SyntaxKind | undefined = node.operatorToken.kind;
			if (!trueBranch) kind = types.binaryOperatorInverse(kind);
			if (kind === undefined) return env;
			
			// RHS is evaluated after LHS, so an assignment in the RHS should block narrowing of LHS
			if (left && !isAssignedWithin(node.right, left, env)) {
				const narrowed = narrowBinaryExpression(leftType, rightType, kind);
				env = applyNarrowing(left, narrowed, env);
			}

			if (right) {
				const flippedKind = types.binaryOperatorFlip(kind);
				if (flippedKind !== undefined) {
					const narrowed = narrowBinaryExpression(rightType, leftType, flippedKind);
					env = applyNarrowing(right, narrowed, env);
				}
			}

			let isEqual = false;
			let isNotEqual = false;
			switch (kind) {
				case ts.SyntaxKind.EqualsEqualsToken:
				case ts.SyntaxKind.EqualsEqualsEqualsToken:
					isEqual = true;
					break;
				case ts.SyntaxKind.ExclamationEqualsToken:
				case ts.SyntaxKind.ExclamationEqualsEqualsToken:
					isNotEqual = true;
					break;
			}
			if (isEqual || isNotEqual) {
				if (node.left.kind === ts.SyntaxKind.TypeOfExpression) {
					if (!isAssignedWithin(node.right, getNarrowingReference((node.left as ts.TypeOfExpression).expression, env), env)) {
						env = transferTypeOfExpression(node.left as ts.TypeOfExpression, rightType, isEqual, env);
					}
				}
				if (node.right.kind === ts.SyntaxKind.TypeOfExpression) {
					env = transferTypeOfExpression(node.right as ts.TypeOfExpression, leftType, isEqual, env);
				}
			}

			return env;
		}
		function transferTypeOfExpression(node: ts.TypeOfExpression, to: types.Type, trueBranch: boolean, env: Environment) {
			const ref = getNarrowingReference(node.expression, env);
			if (!ref) return env;

			const type = typeOf(node.expression, env);

			const newType = typeLiteralMap(to, type, compare => {
				if (typeof compare !== "string") return type;
				return narrowTypeOf(type, compare, trueBranch);
			});
			if (typesEqual(type, newType)) return env;
			return applyNarrowing(ref, newType, env);
		}

		// Narrowing functions
		function narrowBinaryExpression(type: types.Type, other: types.Type, kind: ts.SyntaxKind) {
			switch (kind) {
				case ts.SyntaxKind.EqualsEqualsEqualsToken:
					return narrowEqual(type, other);
				case ts.SyntaxKind.ExclamationEqualsEqualsToken:
					return narrowNotEqual(type, other);
				case ts.SyntaxKind.LessThanToken:
				case ts.SyntaxKind.LessThanEqualsToken:
				case ts.SyntaxKind.GreaterThanToken:
				case ts.SyntaxKind.GreaterThanEqualsToken:
					return narrowComparison(type, other, kind);
			}
			return type;
		}
		function narrowEqual(left: types.Type, right: types.Type) {
			return intersect([left, right]);
		}
		function narrowNotEqual(type: types.Type, to: types.Type) {
			if (to instanceof types.LiteralType || to === types.primitiveNull || to === types.primitiveUndefined) {
				return filterUnion(type, t => !typesEqual(t, to));
			}
			return type;
		}
		function narrowComparison(type: types.Type, to: types.Type, operator: ts.SyntaxKind): types.Type {
			if (to === types.primitiveNull) {
				return narrowComparison(type, types.literalNumberZero, operator);
			}
			let compare: (a: number, b: number) => boolean;
			let max: number;
			switch (operator) {
				case ts.SyntaxKind.LessThanToken:
					compare = (a, b) => a < b;
					max = -Infinity;
					break;
				case ts.SyntaxKind.LessThanEqualsToken:
					compare = (a, b) => a <= b;
					max = -Infinity;
					break;
				case ts.SyntaxKind.GreaterThanToken:
					compare = (a, b) => a > b;
					max = Infinity;
					break;
				case ts.SyntaxKind.GreaterThanEqualsToken:
					compare = (a, b) => a >= b;
					max = Infinity;
					break;
				default:
					throw new Error("Illegal comparison operator");
			}
			for (const part of types.unionParts(to)) {
				if (part instanceof types.LiteralType) {
					const value = +part.value;
					if (!compare(value, max)) {
						max = value;
					}
				} else {
					return type; // Cannot narrow
				}
			}
			const narrowed = filterUnion(type, part => {
				if (part instanceof types.LiteralType) {
					const value = +part.value;
					return compare(value, max);
				} else {
					return true;
				}
			});
			return narrowed;
		}
		function narrowTypeOf(type: types.Type, compare: string, trueBranch: boolean) {
			if (trueBranch) {
				return filterUnion(type, t => {
					const typeOfs = types.typeOfType(t);
					return typeOfs.length === 1 && typeOfs[0] === compare;
				});
			} else {
				return filterUnion(type, t => {
					const typeOfs = types.typeOfType(t);
					return typeOfs.length >= 2 || typeOfs[0] !== compare;
				});
			}
		}
		function narrowProperty(type: types.Type, property: types.PropertyName, narrowedPropertyType: types.Type, override = false) {
			return mapUnion(type, t => {
				const propType = propertyType(t, property) || types.primitiveAny;
				if (typesEqual(propType, narrowedPropertyType)) {
					return t;
				}
				const intersected = override ? narrowedPropertyType : intersect([propType, narrowedPropertyType]);
				if (intersected === types.primitiveNever) return types.primitiveNever;
				if (t instanceof types.ObjectType) {
					return new types.ObjectType(
						new Map([[property, intersected]]),
						t,
						t.name,
						t.instantiatedTypeParameters,
						t.typeParameters,
						t.maxDepth
					);
				}
				return types.primitiveNever;
			});
		}

		function getNarrowingReference(node: ts.Node, env: Environment): types.NarrowingReference | undefined {
			let parentExpression: ts.Expression | undefined;
			let propertyName: types.PropertyName | undefined;
			switch (node.kind) {
				case ts.SyntaxKind.ThisKeyword:
				case ts.SyntaxKind.Identifier:
					return {
						expression: node,
						property: []
					};
				case ts.SyntaxKind.PropertyAccessExpression:
					parentExpression = (node as ts.PropertyAccessExpression).expression;
					propertyName = (node as ts.PropertyAccessExpression).name.text;
					break;
				case ts.SyntaxKind.ElementAccessExpression:
					const propertyNames = types.propertyNamesForType(typeOf((node as ts.ElementAccessExpression).expression, env));
					if (propertyNames !== undefined && propertyNames.length === 1) {
						parentExpression = (node as ts.ElementAccessExpression).expression;
						[propertyName] = propertyNames;
					}
					break;
				case ts.SyntaxKind.ParenthesizedExpression:
					return getNarrowingReference((node as ts.ParenthesizedExpression).expression, env);
				case ts.SyntaxKind.BinaryExpression:
					if ((node as ts.BinaryExpression).operatorToken.kind === ts.SyntaxKind.CommaToken) {
						return getNarrowingReference((node as ts.BinaryExpression).right, env);
					}
					if ((node as ts.BinaryExpression).operatorToken.kind >= ts.SyntaxKind.FirstAssignment
						&& (node as ts.BinaryExpression).operatorToken.kind <= ts.SyntaxKind.LastAssignment) {

						return getNarrowingReference((node as ts.BinaryExpression).left, env);
					}
					return undefined;
			}
			if (parentExpression !== undefined && propertyName !== undefined && !(propertyName instanceof types.Indexer)) {
				const parent = getNarrowingReference(parentExpression, env);
				if (parent) {
					return {
						expression: parent.expression,
						property: [...parent.property, propertyName]
					}
				}
			}
			return undefined;
		}
		function getNarrowingReferenceType(reference: types.NarrowingReference, env: Environment) {
			let type = typeOf(reference.expression, env);
			for (const property of reference.property) {
				type = propertyType(type, property) || types.primitiveAny;
				if (type === types.primitiveAny) return types.primitiveAny;
			}
			return type;
		}
		function applyNarrowing(reference: types.NarrowingReference, type: types.Type, env: Environment, override = false): Environment {
			if (reference.property.length === 0) {
				// Narrowing to `never` means that the code is unreachable
				if (type === types.primitiveNever && !override) return bottom;
				return envSetSymbol(scopeResolver.get(reference.expression), type, env);
			}
			const parentReference: types.NarrowingReference = {
				expression: reference.expression,
				property: reference.property.slice(0, reference.property.length - 1)
			};
			const parentType = getNarrowingReferenceType(parentReference, env);
			const narrowedParentType = narrowProperty(parentType, reference.property[reference.property.length - 1], type, override);
			return applyNarrowing(parentReference, narrowedParentType, env, override);
		}
		function primaryIdOfReference(reference: types.NarrowingReference) {
			return scopeResolver.get(reference.expression);
		}
		function isAssignedWithin(node: ts.Node, reference: types.NarrowingReference | undefined, env: Environment) {
			if (reference === undefined) return false;
			return visit(node) || false;
			function visit(n: ts.Node): boolean {
				if (n.kind === ts.SyntaxKind.BinaryExpression) {
					const operator = (n as ts.BinaryExpression).operatorToken.kind;
					if (operator >= ts.SyntaxKind.FirstAssignment && operator <= ts.SyntaxKind.LastAssignment) {
						const left = (n as ts.BinaryExpression).left;
						const leftReference = getNarrowingReference(left, env);
						if (isSubReference(leftReference, reference)) {
							return true;
						}
					}
				}
				return ts.forEachChild(n, visit);
			}
		}
		function isSubReference(a: types.NarrowingReference | undefined, b: types.NarrowingReference | undefined) {
			if (a === undefined || b === undefined) return false;
			if (primaryIdOfReference(a) !== primaryIdOfReference(b)) return false;
			if (a.property.length > b.property.length) return false;
			for (let i = 0; i < a.property.length; i++) {
				if (!types.propertyNamesEqual(a.property[i], b.property[i])) return false;
			}
			return true;
		}

		function typeOf(node: ts.Node, env: Environment): types.Type {
			switch (node.kind) {
				case ts.SyntaxKind.CallExpression:
				case ts.SyntaxKind.NewExpression:
				case ts.SyntaxKind.Identifier:
				case ts.SyntaxKind.ThisKeyword:
					return storageNode.get(env.nodeTypes, node);
				
				case ts.SyntaxKind.ParenthesizedExpression:
					return typeOf((node as ts.ParenthesizedExpression).expression, env);
				case ts.SyntaxKind.PrefixUnaryExpression:
					return typeOfPrefixUnaryExpression(node as ts.PrefixUnaryExpression, env);
				case ts.SyntaxKind.PostfixUnaryExpression:
					return typeOfPostfixUnaryExpression(node as ts.PostfixUnaryExpression, env);
				case ts.SyntaxKind.BinaryExpression:
					return typeOfBinaryExpression(node as ts.BinaryExpression, env);
				case ts.SyntaxKind.ConditionalExpression:
					return typeOfConditionalExpression(node as ts.ConditionalExpression, env);
				case ts.SyntaxKind.VoidExpression:
					return types.primitiveUndefined;
				case ts.SyntaxKind.TemplateExpression:
					return types.primitiveString;
				case ts.SyntaxKind.OmittedExpression:
					return types.primitiveAny;
				case ts.SyntaxKind.TypeOfExpression:
					return typeOfTypeOfExpression(node as ts.TypeOfExpression, env);
				case ts.SyntaxKind.PropertyAccessExpression:
					return typeOfPropertyAccess(node as ts.PropertyAccessExpression, env);

				// Casts
				case ts.SyntaxKind.NonNullExpression:
					return types.narrowNonNull(typeHost, typeOf((node as ts.NonNullExpression).expression, env));
				case ts.SyntaxKind.AsExpression:
				case ts.SyntaxKind.TypeAssertionExpression:
					return fromTsType((node as ts.TypeAssertion).type);
				
				// Literals / keywords
				case ts.SyntaxKind.TrueKeyword:
					return types.literalTrue;
				case ts.SyntaxKind.FalseKeyword:
					return types.literalFalse;
				case ts.SyntaxKind.NumericLiteral:
					return types.LiteralType.create(JSON.parse(node.getText()));
				case ts.SyntaxKind.StringLiteral:
					return types.LiteralType.create((node as ts.StringLiteral).text);
				case ts.SyntaxKind.NullKeyword:
					return types.primitiveNull;
				case ts.SyntaxKind.ObjectLiteralExpression:
					return typeOfObjectLiteral(node as ts.ObjectLiteralExpression, env);
				case ts.SyntaxKind.ArrayLiteralExpression:
					return typeOfArrayLiteral(node as ts.ArrayLiteralExpression, env);

				case ts.SyntaxKind.ArrowFunction:
				case ts.SyntaxKind.FunctionExpression:
					return typeOfFunctionLikeDeclaration(node as ts.FunctionLikeDeclaration);

				default:
					console.log("Unknown expression kind:", ts.SyntaxKind[node.kind]);
					return types.primitiveAny;
			}
		}
		function typeOfPrefixUnaryExpression(node: ts.PrefixUnaryExpression, env: Environment) {
			const type = typeOf(node.operand, env);
			switch (node.operator) {
				case ts.SyntaxKind.PlusToken:
				case ts.SyntaxKind.MinusToken:
				case ts.SyntaxKind.TildeToken:
					return types.primitiveNumber;
				case ts.SyntaxKind.PlusPlusToken:
					return typeLiteralMap(type, types.primitiveNumber, value => +value + 1);
				case ts.SyntaxKind.MinusMinusToken:
					return typeLiteralMap(type, types.primitiveNumber, value => +value - 1);
				case ts.SyntaxKind.ExclamationToken:
					return types.primitiveBoolean;
				default:
					return unreachable(node.operator, "Unexpected binary operator");
			}
		}
		function typeOfPostfixUnaryExpression(node: ts.PostfixUnaryExpression, env: Environment) {
			const type = typeOf(node.operand, env);
			switch (node.operator) {
				case ts.SyntaxKind.PlusPlusToken:
				case ts.SyntaxKind.MinusMinusToken:
					return typeLiteralMap(type, types.primitiveNumber, value => +value);
				default:
					return unreachable(node.operator, "Unexpected postfix unary operator");
			}
		}
		function typeOfBinaryExpression(node: ts.BinaryExpression, env: Environment) {
			const operator = node.operatorToken.kind;
			switch (operator) {
				case ts.SyntaxKind.EqualsToken:
				case ts.SyntaxKind.CommaToken:
					return typeOf(node.right, env);
			}
			return typeOfBinaryExpressionHelper(operator, node.left, node.right, env);
		}
		function typeOfBinaryExpressionHelper(operator: ts.SyntaxKind, left: ts.Expression, right: ts.Expression, env: Environment) {
			const leftType = typeOf(left, env);
			const rightType = typeOf(right, env);

			const leftNumberType = toNumber(leftType);
			const rightNumberType = toNumber(rightType);
			if (leftNumberType !== types.primitiveNumber && rightNumberType !== types.primitiveNumber) {
				const f = types.binaryOperatorNumberFunction(operator);
				if (f !== undefined) {
					const result: types.Type[] = [];
					for (const l of types.unionParts(leftNumberType)) {
						if (!(l instanceof types.LiteralType)) throw new Error("Should only have literal types after toNumber()");
						for (const r of types.unionParts(rightNumberType)) {
							if (!(r instanceof types.LiteralType)) throw new Error("Should only have literal types after toNumber()");
							result.push(types.LiteralType.create(f(+l.value, +r.value)));
						}
					}
					return union(result);
				}
			}
			
			switch (operator) {
				// Number operators
				case ts.SyntaxKind.MinusToken:
				case ts.SyntaxKind.AsteriskToken:
				case ts.SyntaxKind.SlashToken:
				case ts.SyntaxKind.PercentToken:
				case ts.SyntaxKind.BarToken:
				case ts.SyntaxKind.AmpersandToken:
				case ts.SyntaxKind.CaretToken:
				case ts.SyntaxKind.LessThanLessThanToken:
				case ts.SyntaxKind.GreaterThanGreaterThanToken:
				case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
				// Number assignment operators
				case ts.SyntaxKind.MinusEqualsToken:
				case ts.SyntaxKind.AsteriskEqualsToken:
				case ts.SyntaxKind.SlashEqualsToken:
				case ts.SyntaxKind.PercentEqualsToken:
				case ts.SyntaxKind.BarEqualsToken:
				case ts.SyntaxKind.AmpersandEqualsToken:
				case ts.SyntaxKind.CaretEqualsToken:
				case ts.SyntaxKind.LessThanLessThanEqualsToken:
				case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
				case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
					return types.primitiveNumber;
				// Comparison operators
				case ts.SyntaxKind.EqualsEqualsEqualsToken:
					if (!typesOverlap(leftType, rightType)) return types.literalFalse;
					if (leftType instanceof types.LiteralType && rightType instanceof types.LiteralType && leftType.value === rightType.value) {
						return types.literalTrue;
					}
					return types.primitiveBoolean;
				case ts.SyntaxKind.ExclamationEqualsEqualsToken:
					if (!typesOverlap(leftType, rightType)) return types.literalTrue;
					if (leftType instanceof types.LiteralType && rightType instanceof types.LiteralType && leftType.value === rightType.value) {
						return types.literalFalse;
					}
					return types.primitiveBoolean;
				case ts.SyntaxKind.EqualsEqualsToken:
				case ts.SyntaxKind.ExclamationEqualsToken:
				case ts.SyntaxKind.LessThanToken:
				case ts.SyntaxKind.LessThanEqualsToken:
				case ts.SyntaxKind.GreaterThanEqualsToken:
				case ts.SyntaxKind.GreaterThanToken:
					return types.primitiveBoolean;
				case ts.SyntaxKind.PlusToken:
					return typeOfBinaryPlus(left, right, env);
				case ts.SyntaxKind.AmpersandAmpersandToken:
					return typeOfBinaryLogicalOperator(left, right, true, env);
				case ts.SyntaxKind.BarBarToken:
					return typeOfBinaryLogicalOperator(left, right, false, env);
				default:
					throw new Error("Unexpected binary operator: " + ts.SyntaxKind[operator]);
			}
		}
		function typeOfBinaryPlus(left: ts.Expression, right: ts.Expression, env: Environment): types.Type {
			const typeLeft = typeOf(left, env);
			if (typeLeft === types.primitiveNever) return types.primitiveNever;
			const typeRight = typeOf(right, env);
			if (typeRight === types.primitiveNever) return types.primitiveNever;
			if (isSubtype(typeLeft, types.primitiveString)) return types.primitiveString;
			if (isSubtype(typeRight, types.primitiveString)) return types.primitiveString;
			
			if (isSubtype(types.primitiveString, typeLeft) || isSubtype(types.primitiveString, typeRight)) return types.unionStringNumber;
			return types.primitiveNumber;
		}
		function typeOfBinaryLogicalOperator(left: ts.Expression, right: ts.Expression, isAnd: boolean, env: Environment) {
			const typeLeft = typeOf(left, env);
			if (narrowTypeAfterCondition(typeLeft, isAnd) === types.primitiveNever) {
				// `right` is not reachable
				return typeLeft;
			}
			const typeRight = typeOf(right, env);
			return union([
				narrowTypeAfterCondition(typeLeft, !isAnd),
				typeRight
			]);
		}
		function typeOfConditionalExpression(expression: ts.ConditionalExpression, env: Environment) {
			const typeCondition = typeOf(expression.condition, env);
			const trueReachable = narrowTypeAfterCondition(typeCondition, true) !== types.primitiveNever;
			const falseReachable = narrowTypeAfterCondition(typeCondition, false) !== types.primitiveNever;
			return union([
				trueReachable ? typeOf(expression.whenTrue, env) : types.primitiveNever,
				falseReachable ? typeOf(expression.whenFalse, env) : types.primitiveNever
			]);
		}
		function typeOfTypeOfExpression(expression: ts.TypeOfExpression, env: Environment) {
			return union(
				types.typeOfType(typeOf(expression.expression, env)).map(types.LiteralType.create)
			);
		}
		function typeOfFunctionLikeDeclaration(node: ts.FunctionLikeDeclaration): types.FunctionType {
			const signature = fromTsType(node) as types.FunctionSignature;
			if (node.body === undefined) return signature;
			return new types.FunctionReference(node, signature);
		}
		function typeOfObjectLiteral(node: ts.ObjectLiteralExpression, env: Environment) {
			const members = new Map<types.PropertyName, types.Type>();
			for (const property of node.properties) {
				if (property.kind === ts.SyntaxKind.PropertyAssignment) {
					const name = (property as ts.PropertyAssignment).name;
					let propertyName: types.PropertyName;
					if (name.kind === ts.SyntaxKind.Identifier) {
						propertyName = (name as ts.Identifier).text;
					} else {
						return types.primitiveAny;
					}
					members.set(propertyName, typeOf((property as ts.PropertyAssignment).initializer, env));
				} else {
					return types.primitiveAny;
				}
			}
			return new types.ObjectType(members);
		}
		function typeOfArrayLiteral(node: ts.ArrayLiteralExpression, env: Environment) {
			const t: types.Type[] = [];
			for (const element of node.elements) {
				let expression = element;
				const spread = element.kind === ts.SyntaxKind.SpreadElementExpression;
				if (spread) {
					expression = (element as ts.SpreadElementExpression).expression;
				}
				let elementType: types.Type | undefined = typeOf(expression, env);
				if (spread) {
					elementType = propertyType(elementType, types.indexerNumber);
				}
				if (elementType === undefined) return createArrayType(types.primitiveAny);
				t.push(elementType);
			}
			return createArrayType(union(t));
		}
		function createArrayType(elementType: types.Type) {
			return types.instantiateObject(typeHost, typeHost.globalArray.resolve(), elementType);
		}
		function typeOfPropertyAccess(node: ts.PropertyAccessExpression, env: Environment) {
			return propertyType(typeOf(node.expression, env), node.name.text) || types.primitiveAny;
		}

		function initRootTypes(file: ts.SourceFile) {
			ts.forEachChild(file, init);

			function init(node: ts.Node) {
				switch (node.kind) {
					case ts.SyntaxKind.InterfaceDeclaration:
					case ts.SyntaxKind.ClassDeclaration:
						initClassOrInterface(node as ts.ClassDeclaration | ts.InterfaceDeclaration);
						break;
					case ts.SyntaxKind.TypeAliasDeclaration:
						initTypeAlias(node as ts.TypeAliasDeclaration);
						break;
				}
			}
			function initClassOrInterface(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
				if (node.name === undefined) return;
				const name = node.name.text;
				rootTypes.set(name, new types.LazyType(() => {
					let extendsType: types.Type | undefined;
					const extendsTypes = findExtendsClauseTypes(node.heritageClauses);
					const typeParameters = node.typeParameters === undefined ? []
						: node.typeParameters.map(param => new types.TypeParameter(
							param.constraint && fromTsType(param.constraint),
							param.name.text
						));

					if (extendsTypes !== undefined) {
						if (node.kind === ts.SyntaxKind.ClassDeclaration) {
							if (extendsTypes.length !== 1) {
								console.log("Classes may only extend one class");
							} else {
								extendsType = types.fromTsType(typeHost, extendsTypes[0], typeParameters);
							}
						} else {
							if (extendsTypes.length === 1) {
								extendsType = types.fromTsType(typeHost, extendsTypes[0], typeParameters);
							} else {
								// TODO: Extends multiple types
								console.log("Extending multiple types is not yet supported");
							}
						}
					}

					if (extendsType !== undefined) {
						extendsType = types.resolve(extendsType);
						
						if (!(extendsType instanceof types.ObjectType)) {
							console.log("Classes and interfaces may only extend object types");
							extendsType = undefined;
						}
					}

					const members = new Map<types.PropertyName, types.Type>();
					for (const m of node.members) {
						// MethodDeclaration
						// ConstructorDeclaration
						// GetAccessorDeclaration
						// SetAccessorDeclaration
						// IndexSignatureDeclaration
						// PropertyDeclaration
						const nameType = getMemberDeclarationType(m, typeParameters);
						if (nameType === undefined) continue;
						const [name, type] = nameType;
						members.set(name, types.limitDepth(type, types.defaultMaxDepth - 1));
					}

					return new types.ObjectType(members, extendsType, name, [], typeParameters);
				}));
			}
			function findExtendsClauseTypes(clauses?: ts.HeritageClause[]) {
				if (clauses === undefined) return undefined;
				for (const clause of clauses) {
					if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
						return clause.types;
					}
				}
				return undefined;
			}
			function getMemberDeclarationType(node: ts.ClassElement | ts.TypeElement, typeParameters: types.TypeParameter[]): [types.PropertyName, types.Type] | undefined {
				if (node.kind === ts.SyntaxKind.MethodDeclaration) {
					const name = (node as ts.MethodDeclaration).name;
					return [types.propertyNameToKey(name), new types.LazyType(() => types.fromTsType(typeHost, node as ts.MethodDeclaration, typeParameters))];
				} else if (node.kind === ts.SyntaxKind.PropertyDeclaration || node.kind === ts.SyntaxKind.PropertySignature) {
					const { name, type, questionToken } = node as ts.PropertyDeclaration | ts.PropertySignature;
					let t: types.Type = type === undefined ? types.primitiveAny : new types.LazyType(() => types.fromTsType(typeHost, type, typeParameters));
					if (questionToken) {
						t = union([t, types.primitiveUndefined]);
					}
					return [types.propertyNameToKey(name), t];
				} else if (node.kind === ts.SyntaxKind.IndexSignature) {
					const indexer = types.fromTsIndexer(typeHost, node as ts.IndexSignatureDeclaration);
					const { type } = node as ts.IndexSignatureDeclaration;
					return [indexer, type === undefined ? types.primitiveAny : new types.LazyType(() => types.fromTsType(typeHost, type, typeParameters))];
				}
				return undefined;
			}
			function initTypeAlias(node: ts.TypeAliasDeclaration) {
				if (node.typeParameters) {
					console.log("Generics in a type alias are not supported");
				}
				rootTypes.set(node.name.text, new types.LazyType(() => fromTsType(node.type)));
			}
		}
		function rootType(name: string) {
			return rootTypes.get(name);
		}
		function rootObjectType(name: string) {
			const type = rootType(name);
			if (!(type instanceof types.LazyType)) {
				console.log("Root type should be lazy type");
			}
			return type as types.LazyType<types.ObjectType>;
		}

		function initScope(scope: ts.Node, symbolTypes: TypeStore<number>, storage = storageSymbol) {
			let parent = scope.parent;
			if (parent && scope.kind === ts.SyntaxKind.Block && isFunctionLike(parent)) {
				parent = parent.parent;
			}
			const parentSymbols = parent ? checker.getSymbolsInScope(parent, ts.SymbolFlags.Value) : [];
			for (const symbol of checker.getSymbolsInScope(scope, ts.SymbolFlags.Value)) {
				if (parentSymbols.indexOf(symbol) !== -1) continue;
				let type: types.Type;
				if (symbol.flags & ts.SymbolFlags.Variable) {
					// Variable
					type = types.primitiveUndefined;
				} else if (symbol.flags & ts.SymbolFlags.Function) {
					// Function
					const declaration = symbol.valueDeclaration as ts.FunctionLikeDeclaration;
					type = fromTsType(declaration) as types.FunctionSignature;
					if (declaration.body !== undefined) {
						// Function has implementation, not an ambient declaration
						type = new types.FunctionReference(declaration, fromTsType(declaration) as types.FunctionSignature);
					}
				} else {
					// Unsupported declaration
					type = types.primitiveAny;
				}
				symbolTypes = storage.createSingleton(scopeResolver.getSymbol(symbol), type, [symbolTypes]);
			}
			return symbolTypes;
		}
	});
}
