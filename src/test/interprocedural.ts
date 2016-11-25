import test from "ava";
import { check } from "../lib/test-utils";

test(check
	`6`
	`
	let y;
	function f(x) { return x * 3; }
	function g(x) { return f(x); }
	y = g(2);
	y;
	`
);
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
