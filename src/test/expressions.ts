import test from "ava";
import { lastType } from "../lib/instance";

test("typeof", t => {
	t.is(lastType(`let x = typeof ""; x;`), "\"string\"");
	t.is(lastType(`let x = typeof 1; x;`), "\"number\"");
	t.is(lastType(`let x = typeof (true as boolean); x;`), "\"boolean\"");
});
