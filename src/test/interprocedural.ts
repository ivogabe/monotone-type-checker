import test from "ava";
import { check } from "../lib/test-utils";

test(check
	`undefined`
	`
	let x, y, f;
	f = function(value) {
		var z = 1;
		if (typeof value === "number") {
			return "a";
		}
		if (value !== "a") {
			return true;
		}
	}
	x = f(2);
	y = f(x);
	y;
	`
);
