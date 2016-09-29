import * as ts from "typescript";
import { all, some, mapMap } from "./utils";

export interface TypeHost {
	instantiateCache: InstantiationCache;
	globalObject: ObjectType;
	globalArray: ObjectType;
	globalNumber: ObjectType;
	globalString: ObjectType;
	globalBoolean: ObjectType;
	globalSymbol: ObjectType;
	globalFunction: ObjectType;
}

export enum IndexerKind {
	String,
	Number
}
export class Indexer {
	constructor(
		public name: string,
		public kind: IndexerKind
	) {}
}
export const indexerString = new Indexer("index", IndexerKind.String);
export const indexerNumber = new Indexer("index", IndexerKind.Number)
export type PropertyName = string | number | Indexer;

export function primitiveForIndexer(indexer: Indexer) {
	if (indexer.kind === IndexerKind.String) {
		return primitiveString;
	} else {
		return primitiveNumber;
	}
}

export abstract class TypeBase {
	abstract show(): string;
	depth = 0;
}
export type NonUnionIntersectionType = PrimitiveType | EnumType | ObjectType | LiteralType | TypeParameter | FunctionType;
export type NonUnionType = NonUnionIntersectionType | IntersectionType;
export type Type = NonUnionType | UnionType;
export enum PrimitiveKind {
	Void,
	Undefined,
	Null,
	String,
	Number,
	Boolean,
	Symbol,
	Any
}
export class PrimitiveType extends TypeBase {
	constructor(public kind: PrimitiveKind) {
		super();
	}

	show() {
		switch (this.kind) {
			case PrimitiveKind.Void:
				return "void";
			case PrimitiveKind.Undefined:
				return "undefined";
			case PrimitiveKind.Null:
				return "null";
			case PrimitiveKind.String:
				return "string";
			case PrimitiveKind.Number:
				return "number";
			case PrimitiveKind.Boolean:
				return "boolean";
			case PrimitiveKind.Symbol:
				return "symbol";
			case PrimitiveKind.Any:
				return "any";
			default:
				throw new Error("Unreachable");
		}
	}
}
export class EnumType extends TypeBase {
	name: string;
	members: [string, number][];
	
	show() {
		return this.name;
	}
}
export class UnionType extends TypeBase {
	constructor(public unionParts: NonUnionType[]) {
		super();
		for (const part of unionParts) {
			if (part.depth > this.depth) {
				this.depth = part.depth;
			}
		}
	}

	show(): string {
		if (this.unionParts.length === 0) return "never";
		return this.unionParts.map(type => type.show()).join(" | ");
	}
}
export class IntersectionType extends TypeBase {
	constructor(public intersectionParts: NonUnionIntersectionType[]) {
		super();
		for (const part of intersectionParts) {
			if (part.depth > this.depth) {
				this.depth = part.depth;
			}
		}
	}

	show(): string {
		return this.intersectionParts.map(type => type.show()).join(" | ");
	}
}
export class ObjectType extends TypeBase {
	size: number;

	// We do not have optional properties, but we type them as T | undefined instead.
	constructor(public members: Map<PropertyName, Type>, public extendsType?: ObjectType, public name?: string, public instantiatedTypeParameters: Type[] = [], public typeParameters: TypeParameter[] = []) {
		super();
		for (const member of members.values()) {
			if (member.depth >= this.depth) {
				this.depth = member.depth + 1;
			}
		}
		this.size = members.size;
		if (extendsType !== undefined) {
			this.size += extendsType.size;
		}
	}

	show() {
		let output = "{ ";
		let first = true;
		let current: ObjectType | undefined = this;
		let seen = new Set<PropertyName>();
		while (current !== undefined) {
			for (const [key, value] of current.members) {
				if (seen.has(key)) break;
				seen.add(key);
				if (!first) output += ", ";
				first = false;
				if (typeof key === "string") {
					output += `"${ key }"`;
				} else if (typeof key === "number") {
					output += key;
				} else if (key instanceof Indexer) {
					output += `[${ key.name }: ${ primitiveForIndexer(key).show() }]`;
				}
				output += ": ";
				output += value.show();
			}
			current = current.extendsType;
		}
		return output + " }";
	}
}
export class LiteralType extends TypeBase {
	constructor(public value: string | number | boolean) {
		super();
	}
	
	static create(value: string | number | boolean) {
		if (value === "") return literalStringEmpty;
		if (value === 0) return literalNumberZero;
		if (value === true) return literalTrue;
		if (value === false) return literalFalse;
		if (typeof value === "number" && Number.isNaN(value)) return literalNumberNaN;
		return new LiteralType(value);
	}
	
	show() {
		if (typeof this.value === "number") return this.value.toString();
		return JSON.stringify(this.value);
	}
}
export class TypeParameter extends TypeBase {
	original: TypeParameter;
	constructor(
		public base: Type,
		public name: string,
		original?: TypeParameter
	) {
		super();
		if (original === undefined) {
			this.original = this;
		} else {
			this.original = original;
		}
		this.depth = base.depth;
	}
	
	show() {
		return this.name;
	}
}

export type FunctionType = FunctionReference | FunctionSignature;
export class FunctionReference extends TypeBase {
	constructor(
		public declaration: ts.FunctionLikeDeclaration,
		public signature: FunctionSignature
	) {
		super();
		this.depth = this.signature.depth;
	}

	show() {
		let name: string;
		if (this.declaration.name) {
			switch (this.declaration.name.kind) {
				case ts.SyntaxKind.Identifier:
					name = (this.declaration.name as ts.Identifier).text;
					break;
				case ts.SyntaxKind.StringLiteral:
					name = (this.declaration.name as ts.StringLiteral).text;
					break;
				default:
					name = "(unnamed)";
			}
		} else {
			name = "(unnamed)";
		}
		return name + "~" + this.signature.show();
	}
}
export class FunctionSignature extends TypeBase {
	constructor(
		public isConstructor: boolean,
		public thisType: Type,
		public typeParameters: TypeParameter[],
		public args: FunctionArgument[],
		public returnType: Type
	) {
		super();
		this.depth = Math.max(
			thisType.depth,
			returnType.depth,
			...typeParameters.map(t => t.depth),
			...args.map(arg => arg.type.depth)
		);
	}

	show(): string {
		return `${ this.isConstructor ? "new " : "" }(${ this.args.map(arg => arg.show()).join(", ") }) => ${ this.returnType.show() }`;
	}
}
export class FunctionArgument {
	constructor(
		public name: string,
		public type: Type,
		public optional: boolean,
		public rest: boolean
	) {}

	show() {
		let result = this.name;
		if (this.optional) {
			result += "?";
		}
		if (this.rest) {
			result = "..." + result;
		}
		return result + ": " + this.type.show();
	}
}

export const primitiveNever = new UnionType([]);
export const primitiveVoid = new PrimitiveType(PrimitiveKind.Void);
export const primitiveUndefined = new PrimitiveType(PrimitiveKind.Undefined);
export const primitiveNull = new PrimitiveType(PrimitiveKind.Null);
export const primitiveString = new PrimitiveType(PrimitiveKind.String);
export const primitiveNumber = new PrimitiveType(PrimitiveKind.Number);
export const primitiveBoolean = new PrimitiveType(PrimitiveKind.Boolean);
export const primitiveSymbol = new PrimitiveType(PrimitiveKind.Symbol);
export const primitiveAny = new PrimitiveType(PrimitiveKind.Any);

export const literalStringEmpty = new LiteralType("");
export const literalNumberZero = new LiteralType(0);
export const literalNumberNaN = new LiteralType(NaN);
export const literalTrue = new LiteralType(true);
export const literalFalse = new LiteralType(false);

export const unionStringNumber = new UnionType([primitiveString, primitiveNumber]);

export function isNever(s: Type) {
	return s instanceof UnionType && s.unionParts.length === 0;
}
export function typesEqual(host: TypeHost, s: Type, t: Type) {
	const eq = isSubtype(host, s, t) && isSubtype(host, t, s);
	return eq;
}
export function isSubtype(host: TypeHost, s: Type, t: Type): boolean {
	if (s === t) return true;
	
	if (s === primitiveNever) return true;
	if (t === primitiveAny) return true;
	if (s instanceof EnumType && t === primitiveNumber) return true;
	if (s instanceof LiteralType) {
		if (t instanceof LiteralType) {
			return s.value === t.value;
		}
		if (typeof s.value === "string" && t === primitiveString) return true;
		if (typeof s.value === "number" && t === primitiveNumber) return true;
		if (typeof s.value === "boolean" && t === primitiveBoolean) return true;
	}
	if (s instanceof UnionType) {
		if (s.unionParts.length === 0 && isNever(t)) return true;
		return all(s.unionParts, part => isSubtype(host, part, t));
	}
	if (s instanceof IntersectionType) {
		return some(s.intersectionParts, part => isSubtype(host, part, t));
	}
	if (t instanceof UnionType) {
		if (t.unionParts.length === 0 && isNever(s)) return true;
		return some(t.unionParts, part => isSubtype(host, s, part));
	}
	if (t instanceof IntersectionType) {
		return all(t.intersectionParts, part => isSubtype(host, s, part));
	}
	if (s instanceof TypeParameter) {
		if (t instanceof TypeParameter) return s.original === t.original;
		return isSubtype(host, s.base, t);
	}
	if (t instanceof ObjectType) {
		for (const [property, tPropertyType] of properties(t)) {
			const sPropertyType = propertyType(host, s, property) || primitiveUndefined;
			if (!isSubtype(host, sPropertyType, tPropertyType)) return false;
		}
		return true;
	}

	// Functions
	if (s instanceof FunctionReference && t instanceof FunctionReference) {
		return s.declaration === t.declaration;
	}
	if (s instanceof FunctionSignature && t instanceof FunctionSignature) {
		if (s.isConstructor !== t.isConstructor) return false;
		if (!isSubtype(host, s.returnType, t.returnType)) return false;
		if (s.args.length !== t.args.length) return false;
		for (let i = 0; i < s.args.length; i++) {
			const sArg = s.args[i];
			const tArg = t.args[i];
			if (sArg.optional && !tArg.optional) {
				// (x) => any is subtype of (x?) => any, but
				// (x?) => any is not a subtype of (x) => any
				return false;
			}
			if (sArg.rest !== tArg.rest) return false;
			if (!isSubtype(host, tArg.type, sArg.type)) return false;
		}
		return true;
	}

	return false;
}

export function unionParts(type: Type): NonUnionType[] {
	if (type instanceof UnionType) return type.unionParts;
	return [type];
}
export function intersectionParts(type: NonUnionType): NonUnionIntersectionType[] {
	if (type instanceof IntersectionType) return type.intersectionParts;
	return [type];
}

export function union(host: TypeHost, xs: Iterable<Type>, canWiden: boolean = true): Type {
	let result: NonUnionType[] = [];
	
	for (const x of xs) {
		for (const part of unionParts(x)) {
			if (result.length !== 0 && isSubtype(host, part, new UnionType(result))) continue;
			result = [
				...result.filter(type => !isSubtype(host, type, part)),
				part
			];
		}
	}
	
	// TODO: Use better solution to satisfy ascending chain condition
	if (result.length >= 30) {
		if (canWiden) return union(host, result.map(widenLiterals), false);
		return primitiveAny;
	}
	
	if (result.indexOf(literalTrue) >= 0 && result.indexOf(literalFalse) >= 0) {
		result = [
			...result.filter(type => type !== literalTrue && type !== literalFalse),
			primitiveBoolean
		];
	}
	
	if (result.length === 0) return primitiveNever;
	if (result.length === 1) return result[0];
	return new UnionType(result);
}
export function intersect(host: TypeHost, xs: Iterable<Type>): Type {
	let nonUnionParts: NonUnionIntersectionType[] | undefined = [];
	const otherParts: NonUnionIntersectionType[][][] = [];
	for (const x of xs) {
		const parts = unionParts(x);
		if (parts.length === 1) {
			nonUnionParts = simplifyIntersect(host, nonUnionParts, intersectionParts(parts[0]));
			if (nonUnionParts === undefined) return primitiveNever;
		} else {
			otherParts.push(parts.map(intersectionParts));
		}
	}

	return union(host, create(nonUnionParts, 0).map(parts => {
		if (parts.length === 0) return primitiveNever;
		if (parts.length === 1) return parts[0];
		return new IntersectionType(parts);
	}));

	function create(base: NonUnionIntersectionType[], index: number): NonUnionIntersectionType[][] {
		if (index >= otherParts.length) return [base];
		let result: NonUnionIntersectionType[][] = [];
		for (const part of otherParts[index]) {
			const next = simplifyIntersect(host, base, part);
			if (next !== undefined) result.push(...create(next, index + 1));
		}
		return result;
	}
}
function simplifyIntersect(host: TypeHost, left: NonUnionIntersectionType[], right: NonUnionIntersectionType[]) {
	let result = [...left];
	for (const part of right) {
		if (result.length !== 0 && isSubtype(host, new IntersectionType(result), part)) continue;
		for (const type of result) {
			if (isIllegalIntersection(host, type, part)) {
				return undefined;
			}
		}
		result = [
			...result.filter(type => !isSubtype(host, part, type)),
			part
		];
	}
	return result;
}
function isIllegalIntersection(host: TypeHost, left: NonUnionIntersectionType, right: NonUnionIntersectionType) {
	if (left instanceof PrimitiveType && right instanceof PrimitiveType) {
		return left.kind !== right.kind;
	}
	if (left instanceof LiteralType && right instanceof LiteralType) {
		return left.value !== right.value;
	}
	if (right instanceof LiteralType) {
		[left, right] = [right, left];
	}
	if (left instanceof LiteralType) {
		if (right instanceof PrimitiveType) {
			return !typesEqual(host, widenLiterals(left), right);
		}
		return true;
	}
	return false;
}
export function typesOverlap(host: TypeHost, left: Type, right: Type) {
	// Check that the intersection of both types is not empty.
	// primitiveAny represents an empty intersection type.
	return intersect(host, [left, right]) !== primitiveNever;
}

export function typeMap(host: TypeHost, type: Type, cb: (t: NonUnionType) => Type): Type {
	if (type instanceof UnionType) {
		return union(host, type.unionParts.map(cb));
	} else {
		return cb(type);
	}
}
export function typeLiteralMap(host: TypeHost, type: Type, fallback: Type, cb: (value: string | number | boolean) => string | number | boolean | Type): Type {
	return typeMap(host, type, t => {
		if (!(t instanceof LiteralType)) return fallback;
		const value = cb(t.value);
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			return LiteralType.create(value);
		}
		return value;
	});
}

function widenLiterals(type: Type) {
	if (type instanceof LiteralType) {
		if (typeof type.value === "string") return primitiveString;
		if (typeof type.value === "number") return primitiveNumber;
		if (typeof type.value === "boolean") return primitiveBoolean;
		throw new Error("Illegal literal value");
	}
	return type;
}
export function widenObject(type: ObjectType): Type {
	if (type.depth >= 30) return primitiveAny;
	if (type.size >= 20) return primitiveAny;
	return type;
}

export function toNumber(host: TypeHost, type: Type) {
	return typeLiteralMap(host, type, primitiveNumber, value => +value);
}

export function narrowTypeAfterCondition(host: TypeHost, type: Type, trueBranch: boolean): Type {
	const ifTrue = trueBranch ? type : primitiveNever;
	const ifFalse = trueBranch ? primitiveNever : type;
	if (type instanceof PrimitiveType) {
		switch (type.kind) {
			case PrimitiveKind.Null:
			case PrimitiveKind.Undefined:
			case PrimitiveKind.Void:
				return ifFalse;
			case PrimitiveKind.String:
				return trueBranch ? type : literalStringEmpty;
			case PrimitiveKind.Number:
				return trueBranch ? type : literalNumberZero;
			case PrimitiveKind.Symbol:
				return ifTrue;
			default:
				return type;
		}
	}
	if (type instanceof ObjectType) {
		return ifTrue;
	}
	if (type instanceof LiteralType) {
		if (type.value === "" || type.value === 0 || type.value === false) {
			return ifFalse;
		} else {
			return ifTrue;
		}
	}
	if (type instanceof UnionType) {
		return union(host, type.unionParts.map(t => narrowTypeAfterCondition(host, t, trueBranch)));
	}
	
	// Intersection type, enum type or type parameter
	// TODO: Can we handle intersection types?
	return type;
}
export function narrowNonNull(host: TypeHost, type: Type) {
	if (!(type instanceof UnionType)) return type;
	return union(host, type.unionParts.filter(t => t !== primitiveNull && t !== primitiveUndefined));
}

const allTypeOfs = ["undefined", "object", "string", "number", "boolean", "symbol", "function"];
export function typeOfType(type: Type): string[] {
	if (type instanceof LiteralType) {
		return [typeof type.value];
	} else if (type instanceof PrimitiveType) {
		switch (type.kind) {
			case PrimitiveKind.Void:
			case PrimitiveKind.Undefined:
				return ["undefined"];
			case PrimitiveKind.Null:
				return ["object"];
			case PrimitiveKind.String:
				return ["string"];
			case PrimitiveKind.Number:
				return ["number"];
			case PrimitiveKind.Boolean:
				return ["boolean"];
			case PrimitiveKind.Symbol:
				return ["symbol"];
			case PrimitiveKind.Any:
				return allTypeOfs;
		}
	} else if (type instanceof EnumType) {
		return ["number"];
	} else if (type instanceof ObjectType) {
		return allTypeOfs;
	} else if (type instanceof UnionType) {
		return typeOfTypes(type.unionParts);
	} else if (type instanceof IntersectionType) {
		return typeOfTypes(type.intersectionParts);
	}
	return allTypeOfs;
}
export function typeOfTypes(types: Type[]): string[] {
	const result: string[] = [];
	for (const type of types) {
		const typeOfs = typeOfType(type);
		for (const typeOf of typeOfs) {
			if (result.indexOf(typeOf) === -1) result.push(typeOf);
		}
	}
	return result;
}

export function filterUnion(host: TypeHost, type: Type, filter: (type: NonUnionType) => boolean): Type {
	if (type instanceof UnionType) {
		return union(host, type.unionParts.filter(t => filter(t)));
	}
	if (filter(type)) {
		return type;
	}
	return primitiveNever;
}
export function mapUnion(host: TypeHost, type: Type, callback: (type: NonUnionType) => Type): Type {
	if (type instanceof UnionType) {
		return union(host, type.unionParts.map(callback));
	}
	return callback(type);
}

export function indexerForPropertyName(name: PropertyName) {
	if (typeof name === "string") {
		return indexerString;
	}
	if (typeof name === "number") {
		return indexerNumber;
	}
	return undefined;
}
export function* properties(type: ObjectType): IterableIterator<[PropertyName, Type]> {
	let current: ObjectType | undefined = type;
	const seen = new Set<PropertyName>();
	while (current !== undefined) {
		for (const [property, propertyType] of current.members) {
			if (!seen.has(property)) {
				seen.add(property);
				yield [property, propertyType];
			}
		}
		current = current.extendsType;
	}
}
export function propertyType(host: TypeHost, type: Type, propertyName: PropertyName): Type | undefined {
	type = widenLiterals(type);
	if (type instanceof PrimitiveType) {
		switch (type.kind) {
			case PrimitiveKind.Any:
				return primitiveAny;
			case PrimitiveKind.Boolean:
				type = host.globalBoolean;
				break;
			case PrimitiveKind.Number:
				type = host.globalNumber;
				break;
			case PrimitiveKind.String:
				type = host.globalString;
				break;
			case PrimitiveKind.Symbol:
				type = host.globalSymbol;
				break;
			default:
				// undefined, null or void
				return primitiveNever;
		}
	} else if (type instanceof EnumType) {
		type = host.globalNumber;
	} else if (type instanceof FunctionReference || type instanceof FunctionSignature) {
		type = host.globalFunction;
	} else if (type instanceof TypeParameter) {
		return propertyType(host, type.base, propertyName);
	} else if (type instanceof UnionType) {
		return union(host, type.unionParts.map(
			t => propertyType(host, t, propertyName) || primitiveAny
		));
	} else if (type instanceof IntersectionType) {
		return intersect(host, type.intersectionParts.map(
			t => propertyType(host, t, propertyName) || primitiveAny
		));
	}

	const propType = getProperty(type, propertyName);
	if (propType !== undefined) return propType;

	const indexer = indexerForPropertyName(propertyName);
	if (indexer !== undefined) {
		const indexerType = getProperty(type, indexer);
		if (indexerType !== undefined) return union(host, [indexerType, primitiveUndefined]);
	}

	// Unknown property
	return undefined;
	
	function getProperty(t: ObjectType | undefined, property: PropertyName) {
		while (t !== undefined) {
			const prop = t.members.get(property);
			if (prop !== undefined) return prop;
			t = t.extendsType;
		}
		return undefined;
	}
}

export function mapType(host: TypeHost, type: Type, callback: (t: Type) => Type | undefined) {
	return map(type);

	function mapObjectType(t: ObjectType) {
		let extendsType: Type | undefined = undefined;
		if (t.extendsType) {
			extendsType = map(t.extendsType);
			if (!(extendsType instanceof ObjectType)) {
				throw new Error("mapType: extendsType of object should be mapped to an ObjectType");
			}
		}
		return new ObjectType(
			mapMap(t.members, map),
			extendsType,
			t.name,
			t.instantiatedTypeParameters.map(map),
			t.typeParameters.map(mapTypeParameter)
		);
	}
	function map(type: Type): Type {
		const mapped = callback(type);
		if (mapped !== undefined) return mapped;

		if (type instanceof ObjectType) {
			return mapObjectType(type);
		} else if (type instanceof PrimitiveType || type instanceof EnumType || type instanceof LiteralType || type instanceof FunctionReference) {
			return type;
		} else if (type instanceof UnionType) {
			return mapUnion(host, type, map);
		} else if (type instanceof IntersectionType) {
			return intersect(host, intersectionParts(type).map(map));
		} else if (type instanceof TypeParameter) {
			return mapTypeParameter(type);
		} else {
			return new FunctionSignature(type.isConstructor, map(type.thisType), type.typeParameters.map(mapTypeParameter) as TypeParameter[], type.args.map(mapFunctionArgument), map(type.returnType));
		}
	}
	function mapFunctionArgument(argument: FunctionArgument) {
		return new FunctionArgument(argument.name, map(argument.type), argument.optional, argument.rest);
	}
	function mapTypeParameter(param: TypeParameter) {
		const base = map(param.base);
		if (base === undefined) return param;
		return new TypeParameter(base, param.name, param.original);
	}
}
export type InstantiationCache = WeakMap<ObjectType, WeakMap<Type, ObjectType>>;
export function instantiateObject(host: TypeHost, type: ObjectType, parameterType: Type) {
	if (type.typeParameters.length === 0) {
		return type;
	}
	let cacheForObject = host.instantiateCache.get(type);
	if (cacheForObject) {
		const instantiated = cacheForObject.get(parameterType);
		if (instantiated) return instantiated;
	} else {
		cacheForObject = new WeakMap();
		host.instantiateCache.set(type, cacheForObject);
	}

	const param = type.typeParameters[0];
	const mapped = mapType(host, type, replace) as ObjectType;
	const instantiated = new ObjectType(
		mapped.members,
		mapped.extendsType,
		mapped.name,
		[...mapped.instantiatedTypeParameters, parameterType],
		mapped.typeParameters.slice(1)
	);

	cacheForObject.set(parameterType, instantiated);

	return instantiated;

	function replace(type: Type) {
		if (type === param) {
			return parameterType;
		}
	}

	/* function mapObjectType(t: ObjectType) {
		return new ObjectType(
			mapMap(t.members, map),
			t.extendsType ? map(t.extendsType) as ObjectType : undefined,
			t.name,
			t.instantiatedTypeParameters.map(map),
			t.typeParameters
		);
	}
	function map(type: Type): Type {
		if (type instanceof ObjectType) {
			return mapObjectType(type);
		} else if (type instanceof PrimitiveType || type instanceof EnumType || type instanceof LiteralType || type instanceof FunctionReference) {
			return type;
		} else if (type instanceof UnionType) {
			return mapUnion(host, type, map);
		} else if (type instanceof IntersectionType) {
			return intersect(host, intersectionParts(type).map(map));
		} else if (type instanceof TypeParameter) {
			if (type === replace) return parameter;
			if (type.base) {
				const base = map(type.base);
				if (base !== type.base) return new TypeParameter(map(type.base), type.name);
			}
			return type;
		} else {
			return new FunctionSignature(type.isConstructor, map(type.thisType), type.typeParameters.map(map) as TypeParameter[], type.args.map(mapFunctionArgument), map(type.returnType));
		}
	}
	function mapFunctionArgument(argument: FunctionArgument) {
		return new FunctionArgument(argument.name, map(argument.type), argument.optional, argument.rest);
	} */
}
/*function instantiateSignature(host: TypeHost, type: FunctionSignature, substitutes: Map<TypeParameter, Type>) {
TODO
}*/

export function propertyNamesForType(type: Type): PropertyName[] | undefined {
	if (type === primitiveString) {
		return [indexerString];
	}
	if (type === primitiveNumber) {
		return [indexerNumber];
	}
	if (type instanceof UnionType) {
		const parts = type.unionParts.map(propertyNamesForType);
		if (some(parts, p => p === undefined)) return undefined;
		return ([] as PropertyName[]).concat(...(parts as PropertyName[][]));
	}
	if (type instanceof LiteralType) {
		if (typeof type.value !== "boolean") return [type.value];
	}
	return undefined;
}

export function fromTsType(host: TypeHost, n: ts.TypeNode | ts.FunctionLikeDeclaration, typeParameters: TypeParameter[] = []): Type {
	return from(n);

	function from(node: ts.TypeNode | ts.FunctionLikeDeclaration): Type;
	function from(node: ts.TypeNode | ts.FunctionLikeDeclaration | undefined): Type | undefined;
	function from(node: ts.TypeNode | ts.FunctionLikeDeclaration | undefined): any {
		if (node === undefined) return undefined;
		switch (node.kind) {
			case ts.SyntaxKind.FunctionType:
			case ts.SyntaxKind.ConstructorType:
			case ts.SyntaxKind.FunctionDeclaration:
			case ts.SyntaxKind.ArrowFunction:
			case ts.SyntaxKind.FunctionExpression:
			case ts.SyntaxKind.MethodDeclaration:
			case ts.SyntaxKind.GetAccessor:
			case ts.SyntaxKind.SetAccessor:
			case ts.SyntaxKind.FunctionExpression:
			case ts.SyntaxKind.Constructor:
				return fromFunctionOrConstructorType(node as ts.FunctionOrConstructorTypeNode | ts.FunctionLikeDeclaration);
			case ts.SyntaxKind.StringKeyword:
				return primitiveString;
			case ts.SyntaxKind.NumberKeyword:
				return primitiveNumber;
			case ts.SyntaxKind.BooleanKeyword:
				return primitiveBoolean;
			case ts.SyntaxKind.NullKeyword:
				return primitiveNull;
			case ts.SyntaxKind.UndefinedKeyword:
				return primitiveUndefined;
			case ts.SyntaxKind.AnyKeyword:
				return primitiveAny;
			case ts.SyntaxKind.NeverKeyword:
				return primitiveNever;
			case ts.SyntaxKind.VoidKeyword:
				return primitiveVoid;
			case ts.SyntaxKind.ArrayType:
				return fromArrayType(node as ts.ArrayTypeNode);
			case ts.SyntaxKind.ParenthesizedType:
				return from((node as ts.ParenthesizedTypeNode).type);
			case ts.SyntaxKind.UnionType:
				return fromUnionType(node as ts.UnionTypeNode);
			case ts.SyntaxKind.IntersectionType:
				return fromIntersectionType(node as ts.IntersectionTypeNode);
			case ts.SyntaxKind.LiteralType:
				return fromLiteralType(node as ts.LiteralTypeNode);
			default:
				// console.log("Unexpected type node kind: " + ts.SyntaxKind[node.kind]);
				return primitiveAny;
		}
	}
	function fromLiteralType(node: ts.LiteralTypeNode) {
		switch (node.literal.kind) {
			case ts.SyntaxKind.StringLiteral:
				return LiteralType.create((node.literal as ts.LiteralExpression).text);
			case ts.SyntaxKind.NumericLiteral:
				return LiteralType.create(JSON.parse((node.literal as ts.LiteralExpression).text) as number);
			case ts.SyntaxKind.TrueKeyword:
				return literalTrue;
			case ts.SyntaxKind.FalseKeyword:
				return literalFalse;
		}
	}
	function fromFunctionOrConstructorType(node: ts.FunctionOrConstructorTypeNode | ts.FunctionLikeDeclaration) {
		const saveTypeParameters = typeParameters;

		const funcTypeParameters = !node.typeParameters ? [] : node.typeParameters.map(fromTypeParameterDeclaration);

		typeParameters = [...funcTypeParameters, ...typeParameters];

		let funcArguments = node.parameters.map(fromParameterDeclaration);
		let thisType: Type = primitiveAny;
		if (funcArguments.length > 0 && funcArguments[0].name === "this") {
			thisType = funcArguments[0].type;
			funcArguments = funcArguments.slice(1);
		}
		const isConstructor = node.kind === ts.SyntaxKind.Constructor || node.kind === ts.SyntaxKind.ConstructorType;
		const returnType = from(node.type) || primitiveAny;

		typeParameters = saveTypeParameters;

		return new FunctionSignature(isConstructor, thisType, funcTypeParameters, funcArguments, returnType);
	}
	function fromArrayType(node: ts.ArrayTypeNode) {
		return instantiateObject(host, host.globalArray, from(node.elementType));
	}
	
	function fromTypeParameterDeclaration(node: ts.TypeParameterDeclaration) {
		return new TypeParameter(
			from(node.constraint) || primitiveNever,
			node.name.text
		);
	}
	function fromParameterDeclaration(node: ts.ParameterDeclaration, index: number) {
		const name = node.name.kind === ts.SyntaxKind.Identifier ? (node.name as ts.Identifier).text : "_" + index;
		const type = from(node.type) || primitiveAny;
		return new FunctionArgument(name, type, node.questionToken !== undefined, node.dotDotDotToken !== undefined);
	}
	function fromUnionType(node: ts.UnionTypeNode) {
		// Lambda is not required here, but TypeScript
		// gives a type error if omitted.
		return union(host, node.types.map(t => from(t)));
	}
	function fromIntersectionType(node: ts.IntersectionTypeNode) {
		// Lambda is not required here, but TypeScript
		// gives a type error if omitted.
		return intersect(host, node.types.map(t => from(t)));
	}
}

export interface CallArgument {
	spread: boolean;
	type: Type;
}
export function functionSignatureMatches(host: TypeHost, signature: FunctionSignature, thisType: Type, args: CallArgument[]) {
	const argumentMapping: [number, CallArgument[]][] = [];

	let i = 0;
	for (let j = 0; j < args.length; j++) {
		const arg = args[j];
		const functionArg = signature.args[i];
		if (functionArg === undefined) {
			// Too many arguments
			return undefined;
		}
		if (arg.spread && !functionArg.rest) {
			// Spread may only be used for rest argument
			return undefined;
		}
		if (functionArg.rest) {
			argumentMapping.push([i, args.slice(j)]);
			break;
		}
		argumentMapping.push([i, [arg]]);
	}
	// Check for missing required arguments
	for (; i < signature.args.length; i++) {
		const functionArg = signature.args[i];
		if (!functionArg.optional && !functionArg.rest) {
			return undefined;
		}
	}

	let appliedSignature = signature;
	
	const typeArguments = new Set(signature.typeParameters);
	let substituteUpper = new Map<TypeParameter, Type[]>();
	let substituteLower = new Map<TypeParameter, Type[]>();
	const substitutes = new Map<TypeParameter, Type>();
	
	if (signature.typeParameters.length !== 0) {
		for (const param of signature.typeParameters) {
			substituteUpper.set(param, []);
			substituteLower.set(param, []);
		}
		for (const [i, callArgs] of argumentMapping) {
			const functionArg = signature.args[i];
			const functionArgType = functionArg.rest ? propertyType(host, functionArg.type, indexerNumber) : functionArg.type;
			if (functionArgType === undefined) return undefined;
			for (const arg of callArgs) {
				const argType = arg.spread ? propertyType(host, arg.type, indexerNumber) : arg.type;
				if (argType === undefined) return undefined;
				if (!assign(functionArgType, argType, false)) return undefined;
			}
		}

		if (!assign(thisType, signature.thisType, false)) return undefined;

		for (const param of signature.typeParameters) {
			const upper = union(host, substituteUpper.get(param)!);
			const lower = union(host, substituteLower.get(param)!);

			if (!isSubtype(host, lower, upper)) return undefined;

			substitutes.set(param, lower !== primitiveNever ? lower : upper);
		}

		appliedSignature = new FunctionSignature(
			signature.isConstructor,
			substituteType(signature.thisType),
			[],
			signature.args.map(arg => new FunctionArgument(
				arg.name,
				substituteType(arg.type),
				arg.optional,
				arg.rest
			)),
			substituteType(signature.returnType)
		);
	}

	for (const [i, callArgs] of argumentMapping) {
		const functionArg = appliedSignature.args[i];
		const functionArgType = functionArg.rest ? propertyType(host, functionArg.type, indexerNumber) : functionArg.type;
		if (functionArgType === undefined) return undefined;
		for (const arg of callArgs) {
			const argType = arg.spread ? propertyType(host, arg.type, indexerNumber) : arg.type;
			if (argType === undefined) return undefined;
			if (!isSubtype(host, argType, functionArgType)) return undefined;
		}
	}
	return signature;

	function assign(to: Type, type: Type, contra: boolean): boolean {
		if (to instanceof TypeParameter && typeArguments.has(to)) {
			assignTypeParameter(to, type, contra);
			return true;
		}
		if (to instanceof PrimitiveType || to instanceof LiteralType || to instanceof EnumType || to instanceof TypeParameter) {
			if (contra) {
				return isSubtype(host, to, type);
			} else {
				return isSubtype(host, type, to);
			}
		}
		if (to instanceof IntersectionType) {
			for (const part of to.intersectionParts) {
				if (!assign(part, type, contra)) return false;
			}
			return true;
		}
		if (to instanceof ObjectType) {
			for (const [property, propType] of to.members) {
				const other = propertyType(host, type, property) || primitiveUndefined;
				if (!assign(propType, other, contra)) return false;
			}
			return true;
		}
		if (to instanceof FunctionReference) to = to.signature;
		if (to instanceof FunctionSignature) {
			if (type instanceof FunctionReference) {
				type = type.signature;
			} else if (!(type instanceof FunctionSignature)) {
				return false;
			}
			for (let i = 0; i < to.args.length; i++) {
				const toArg = to.args[i];
				const arg = type.args[i];
				if (arg === undefined) break;
				if (toArg.rest !== arg.rest) return false;
				if (toArg.optional && !arg.optional) return false;
				if (!assign(toArg.type, arg.type, !contra)) return false;
			}
			return assign(to.thisType, type.thisType, contra) && assign(to.returnType, type.returnType, contra);
		}
		// Union type
		const saveSubstituteUpper = new Map(substituteUpper);
		const saveSubstituteLower = new Map(substituteLower);
		for (let i = 0; i < to.unionParts.length; i++) {
			if (i !== 0) {
				substituteUpper = new Map(saveSubstituteUpper);
				substituteLower = new Map(saveSubstituteLower);
			}
			if (assign(to.unionParts[i], type, contra)) {
				return true;
			}
		}
		return false;
	}
	function assignTypeParameter(typeParam: TypeParameter, type: Type, contra: boolean) {
		const map = contra ? substituteUpper : substituteLower;

		let typeSubstitutes = map.get(typeParam)!;
		map.set(typeParam, [...typeSubstitutes, type]);
	}
	function substituteType(type: Type) {
		return mapType(host, type, t => t instanceof TypeParameter ? substitutes.get(t) : undefined);
	}
}

export function binaryOperatorInverse(kind: ts.SyntaxKind) {
	switch (kind) {
		case ts.SyntaxKind.EqualsEqualsEqualsToken:
			return ts.SyntaxKind.ExclamationEqualsEqualsToken;
		case ts.SyntaxKind.ExclamationEqualsEqualsToken:
			return ts.SyntaxKind.EqualsEqualsEqualsToken;
		case ts.SyntaxKind.LessThanToken:
			return ts.SyntaxKind.GreaterThanEqualsToken;
		case ts.SyntaxKind.LessThanEqualsToken:
			return ts.SyntaxKind.GreaterThanToken;
		case ts.SyntaxKind.GreaterThanToken:
			return ts.SyntaxKind.LessThanEqualsToken;
		case ts.SyntaxKind.GreaterThanEqualsToken:
			return ts.SyntaxKind.LessThanToken;
	}
	return undefined;
}
export function binaryOperatorFlip(kind: ts.SyntaxKind) {
	switch (kind) {
		case ts.SyntaxKind.EqualsEqualsEqualsToken:
		case ts.SyntaxKind.ExclamationEqualsEqualsToken:
			return kind;
		case ts.SyntaxKind.LessThanToken:
			return ts.SyntaxKind.GreaterThanToken;
		case ts.SyntaxKind.LessThanEqualsToken:
			return ts.SyntaxKind.GreaterThanEqualsToken;
		case ts.SyntaxKind.GreaterThanToken:
			return ts.SyntaxKind.LessThanToken;
		case ts.SyntaxKind.GreaterThanEqualsToken:
			return ts.SyntaxKind.LessThanEqualsToken;
	}
	return undefined;
}
export function binaryOperatorNumberFunction(kind: ts.SyntaxKind): ((a: number, b: number) => number) | undefined {
	// Number operators
	switch (kind) {
		case ts.SyntaxKind.MinusToken:
		case ts.SyntaxKind.MinusEqualsToken:
			return (a, b) => a - b;
		case ts.SyntaxKind.AsteriskToken:
		case ts.SyntaxKind.AsteriskEqualsToken:
			return (a, b) => a * b;
		case ts.SyntaxKind.SlashToken:
		case ts.SyntaxKind.SlashEqualsToken:
			return (a, b) => a / b;
		case ts.SyntaxKind.PercentToken:
		case ts.SyntaxKind.PercentEqualsToken:
			return (a, b) => a % b;
		case ts.SyntaxKind.BarToken:
		case ts.SyntaxKind.BarEqualsToken:
			return (a, b) => a | b;
		case ts.SyntaxKind.AmpersandToken:
		case ts.SyntaxKind.AmpersandEqualsToken:
			return (a, b) => a & b;
		case ts.SyntaxKind.CaretToken:
		case ts.SyntaxKind.CaretEqualsToken:
			return (a, b) => a ^ b;
		case ts.SyntaxKind.LessThanLessThanToken:
		case ts.SyntaxKind.LessThanLessThanEqualsToken:
			return (a, b) => a << b;
		case ts.SyntaxKind.GreaterThanGreaterThanToken:
		case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
			return (a, b) => a >> b;
		case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
		case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
			return (a, b) => a >>> b;
	}
}
export function propertyNamesEqual(a: PropertyName, b: PropertyName) {
	if (a === b) return true;
	return a instanceof Indexer && b instanceof Indexer && a.kind === b.kind;
}

export interface NarrowingReference {
	expression: ts.Node;
	property: PropertyName[];
}
