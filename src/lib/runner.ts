import * as fs from "fs";
import * as ts from "typescript";
import * as monotone from "monotone";
import * as instance from "./instance";

const args = process.argv.slice(2);

if (args.length === 0) {
	console.log('Usage: npm run runner -- filenames [--case=timeago|mustache] [--time]');
	process.exit();
}

const fileNames = args.filter(arg => arg.substring(0, 2) !== '--');
const options = args.filter(arg => arg.substring(0, 2) == '--').map(arg => arg.substring(2));

if (hasOption("case=timeago")) {
	fileNames.push(
		'cases/timeago/timeago.ts'
	);
}
if (hasOption("case=mustache")) {
	fileNames.push(
		'cases/mustache/mustache.ts'
	);
}

const timeStart = process.hrtime();

const files = fileNames.map(fileName => {
	const content = fs.readFileSync(fileName, "utf8");
	return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
});

const timeFiles = process.hrtime(timeStart);
const timeAnalysisStart = process.hrtime();

const result = monotone.runFiles(instance.typeChecker(), true, files);

const timeAnalysis = process.hrtime(timeAnalysisStart);
const timeTotal = process.hrtime(timeStart);

console.log(result.types.join("\n"));

if (hasOption('time')) {
	const printTime = (title: string, [seconds, nanoseconds]: number[]) => {
		console.log("* " + addWhitespaceRight(7, title + ":") + addWhitespaceLeft(4, seconds.toString()) + "s" + nanoseconds);
	};

	console.log("TIMES");
	printTime("Parse files", timeFiles);
	printTime("Analysis", timeAnalysis);
	printTime("Total", timeTotal);
}

function hasOption(option: string) {
	return options.indexOf(option) !== -1;
}
function addWhitespaceRight(length: number, str: string): string {
	if (str.length < length) return addWhitespaceRight(length, str + " ");
	return str;
}
function addWhitespaceLeft(length: number, str: string): string {
	if (str.length < length) return addWhitespaceLeft(length, " " + str);
	return str;
}
