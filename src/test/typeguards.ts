import test from "ava";
import { lastType } from "../lib/instance";

test("narrowing-primitives", t => {
	t.is(lastType(`let x = "" as "" | number; if (typeof x === "string") x;`), "\"\"");
	t.is(lastType(`let x = "" as "" | number; if (typeof x !== "number") x;`), "\"\"");
	t.is(lastType(`let x = "" as "" | number; if (typeof x !== "string") {} else x;`), "\"\"");
	t.is(lastType(`let x = "" as "" | number; if (typeof x === "number") {} else x;`), "\"\"");
});

test("reachability", t => {
	t.is(lastType(`let x = ""; if (typeof x === "string") x = 1 else x = 2; x;`), "1");
	t.is(lastType(`let x = ""; if (typeof x !== "number") x = 1 else x = 2; x;`), "1");
	t.is(lastType(`let x = ""; if (typeof x !== "string") x = 1 else x = 2; x;`), "2");
	t.is(lastType(`let x = ""; if (typeof x === "number") x = 1 else x = 2; x;`), "2");
});

test("assignments", t => {
	t.is(lastType(`let x = 1; if (((x = 2), 1) === x) x;`), "never");
	t.is(lastType(`let x = 1; if (x === ((x = 2), 1)) x;`), "2");
});
