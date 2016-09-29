import test from "ava";
import { check } from "../lib/test-utils";

test(check
	`(s: string, radix?: number) => number`
	`let x = parseInt; x;`
);
test.skip(check
	`number`
	`let x = parseInt("9"); x;`
);
