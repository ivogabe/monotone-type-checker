import test from "ava";
import { lastType } from "../lib/instance";

test("assignments", t => {
	t.is(lastType(`let x; x = ""; x;`), "\"\"");
	t.is(lastType(`let x; x = 1; x;`), "1");
	t.is(lastType(`var x; x = true; x;`), "true");
});

test("initializers", t => {
	t.is(lastType(`const x = ""; x;`), "\"\"");
	t.is(lastType(`let x = 1; x;`), "1");
	t.is(lastType(`var x = true; x;`), "true");
});
