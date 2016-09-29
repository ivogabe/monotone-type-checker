import { Node } from "typescript";
import { TypeHost, Type, union, typesEqual } from "./types";
import { curry } from "./utils";
import { createStorage, Storage, Store } from "monotone";

export type TypeStorage<TKey> = Storage<TKey, Type>;
export type TypeStore<TKey> = Store<TKey, Type>;

export function createNodeTypeStorage(host: TypeHost, defaultValue: (key: Node) => Type) {
	return createTypeStorage(host, defaultValue, key => `Node ${ key.getText() } (${ key.pos })`);
}
export function createSymbolTypeStorage(host: TypeHost, defaultValue: (key: number) => Type) {
	return createTypeStorage<number>(host, defaultValue, key => `Symbol ${ key }`);
}

function createTypeStorage<UKey>(host: TypeHost, defaultValue: (key: UKey) => Type, showKey: (key: UKey) => string): TypeStorage<UKey> {
	return createStorage<UKey, Type>(
		key => defaultValue(key),
		(a, b) => union(host, [a, b]),
		curry(typesEqual, host),
		showKey,
		type => type.show()
	);
}
