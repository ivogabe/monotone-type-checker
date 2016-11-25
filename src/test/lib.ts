import test from "ava";
import { check } from "../lib/test-utils";

test(check
	`(s: string, radix?: number) => number`
	`let x = parseInt; x;`
);
test(check
	`number`
	`let x = parseInt("9", 42); x;`
);
test(check
	`string`
	`let x = "a".trim(); x;`
);
test(check
	`string`
	`let x = "a".trim(); x;`
);
test(check
	`number`
	`let x = new Date("a").getHours(); x;`
);