import { lastType } from "./instance";
import { TestContext } from "ava";

export { lastType };

export const check = (type: TemplateStringsArray) => (source: TemplateStringsArray) => (t: TestContext) => {
	t.is(lastType(source[0]), type[0]);
};
