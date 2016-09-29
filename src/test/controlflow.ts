import test from "ava";
import { lastType } from "../lib/instance";

test("if", t => {
	t.is(lastType(`let x; if (true as boolean) { x = true; } else { x = false; } x;`), "boolean");
	t.is(lastType(`let x; if (true) { x = true; } else { x = false; } x;`), "true");
	t.is(lastType(`let x; if (false) { x = true; } else { x = false; } x;`), "false");
});
