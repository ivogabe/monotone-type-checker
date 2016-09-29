import { runString } from "monotone";
import { typeChecker } from "./instance";

run("Example 1", `
	var x, y, z, v;
	x = true;
	x = 5;
	while (1) {
		y = x;
		x = true;
		x = "";
		
		z = true;
		z;
		
		v = x + (x = 0);
		v;
	}
	x;
	y;
	z = null;
	debugger;
	z;
`);

run("Example 2", `
	var x, y, z;
	x = false ? "a" : 42;
	y = x++;
	y;
	x;
	z = ("a" + "b") && 908751;
	z;
`);

run("Example 3", `
	var id, apply, i, x, f;
	// f = (a: string, b: number) => a;
	// x = f("", 4);
	// x;
	apply = function ap(f: any, b: any): any { return f(b); };
	id = function id(a: any): any { return a; }
	// x = 2;
	// x = f("", true);
	x = apply(id, 2);
	x;
	x = apply(id, apply)(id, id)("a");
	x;
`);

run("Example 4", `var x, y, setX;
x = "";
setX = function() {
	var z;
	z = x;
	x = 5;
	return z;
}

x;
y = setX();
x;
y;
`);

run("Example 5 - objects", `
var x, y;
if (1 + 1) {
	x = { a: true, b: 42 };
} else {
	x = { a: false, b: 0 };
}
x.c = "";
if ((x.a === true)) {
	y = x.b;
	y;
}
var z = undefined as Number;
z;
`);

function run(title: string, content: string) {
	console.log(title);
	console.log(runString(typeChecker(), true, content).types.join('\n'));
}
