import * as ts from "typescript";

export function all<U>(xs: Iterable<U>, check: (x: U) => boolean) {
	for (const x of xs) {
		if (!check(x)) return false;
	}
	return true;
}
export function some<U>(xs: Iterable<U>, check: (x: U) => boolean) {
	for (const x of xs) {
		if (check(x)) return true;
	}
	return false;
}

export function* mapIterable<U, V>(xs: Iterable<U>, callback: (value: U) => V) {
	for (const x of xs) {
		yield callback(x);
	}
}
export function mapMap<U, V, W>(map: Map<U, V>, callback: (value: V) => W) {
	return new Map(mapIterable<[U, V], [U, W]>(map, ([key, value]) => [key, callback(value)]));
}


export function curry<U1, U2, V>(f: (x1: U1, x2: U2) => V, x1: U1): (x2: U2) => V;
export function curry<U1, U2, U3, V>(f: (x1: U1, x2: U2, x3: U3) => V, x1: U1): (x2: U2, x3: U3) => V;
export function curry<U1, U2, U3, V>(f: (x1: U1, x2: U2, x3: U3) => V, x1: U1, u2: U2): (x3: U3) => V;
export function curry<U1, U2, U3, U4, V>(f: (x1: U1, x2: U2, x3: U3, x4: U4) => V, x1: U1): (x2: U2, x3: U3, x4: U4) => V;
export function curry<U1, U2, U3, U4, V>(f: (x1: U1, x2: U2, x3: U3, x4: U4) => V, x1: U1, x2: U2): (x3: U3, x4: U4) => V;
export function curry<U1, U2, U3, U4, V>(f: (x1: U1, x2: U2, x3: U3, x4: U4) => V, x1: U1, x2: U2, x3: U3): (x4: U4) => V;
export function curry(f: any, ...curriedArgs: any[]) {
	return (...args: any[]) => f(...curriedArgs, ...args);
}

export function isFunctionLike(node: ts.Node): node is ts.FunctionLikeDeclaration {
	switch (node.kind) {
		case ts.SyntaxKind.Constructor:
		case ts.SyntaxKind.FunctionExpression:
		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.ArrowFunction:
		case ts.SyntaxKind.MethodDeclaration:
		case ts.SyntaxKind.MethodSignature:
		case ts.SyntaxKind.GetAccessor:
		case ts.SyntaxKind.SetAccessor:
		case ts.SyntaxKind.CallSignature:
		case ts.SyntaxKind.ConstructSignature:
		case ts.SyntaxKind.IndexSignature:
		case ts.SyntaxKind.FunctionType:
		case ts.SyntaxKind.ConstructorType:
			return true;
	}
	return false;
}
