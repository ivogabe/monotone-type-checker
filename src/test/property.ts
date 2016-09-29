import test from "ava";
import { check } from "../lib/test-utils";

test('any', check
	`any`
	`
	var x = null as any;
	var y = x.foo;
	y;
	`
);
test('never', check
	`never`
	`
	var x, y;
	y = x.foo;
	y;
	`
);
test('object', check
	`"a"`
	`
	var x, y;
	x = { foo: "a" };
	y = x.foo;
	y;
	`
);
