import "@hyurl/utils/types";
import * as assert from "assert";
import _try from "dotry";
import { describe, it, before, after } from "mocha";
import { def, setWarningHandler, ValidationWarning, Void } from "..";

describe("def()", () => {
    const warnings: ValidationWarning[] = [];

    before(() => {
        setWarningHandler(function (_warnings) {
            warnings.push(..._warnings);
        });
    });

    it("should define a function with typed parameters and returns", () => {
        // @ts-ignore
        const sum = def(function sum({ a, b, c }) {
            return String(a + b + (c || 0));
        }, [{ a: Number, b: Number, c: Number.optional }] as const, Number);
        assert.strictEqual(sum.name, "sum");
        assert.strictEqual(sum.length, 1);
        assert.strictEqual(sum.toString(), `function sum({ a, b, c }) {
            return String(a + b + (c || 0));
        }`);

        // @ts-ignore
        const result = sum({ a: 1, b: "2" });
        assert.strictEqual(result, 3);

        // @ts-ignore
        const [err1] = _try(() => sum({ a: Buffer.from([1]), b: 2 }));
        assert.strictEqual(
            String(err1),
            "TypeError: parameters.arg0.a is expected to be a number, but a Buffer is given"
        );
        assert.strictEqual(err1.stack?.split("\n")[1], `    at ${__filename}:32:35`);

        // @ts-ignore
        const sum2 = def(({ a, b, c }) => {
            return Buffer.from([a, b, c || 0]);
        }, [{ a: Number, b: Number, c: Number.optional }] as const, Number);
        const [err2] = _try(() => sum2({ a: 1, b: 2 }));
        assert.strictEqual(
            String(err2),
            "TypeError: returns is expected to be a number, but a Buffer is given"
        );
        assert.strictEqual(err2.stack?.split("\n")[1], `    at ${__filename}:43:35`);
    });

    it("should define an async function with typed parameters and returns", async () => {
        // @ts-ignore
        const sum = def(async ({ a, b, c }) => {
            return await Promise.resolve(String(a + b + (c || 0)));
        }, [{ a: Number, b: Number, c: Number.optional }] as const, Number) as (param0: {
            a: number,
            b: number;
        }) => Promise<number>;
        assert.strictEqual(sum.name, "");
        assert.strictEqual(sum.length, 1);
        assert.strictEqual(sum.toString(), `async ({ a, b, c }) => {
            return await Promise.resolve(String(a + b + (c || 0)));
        }`);

        // @ts-ignore
        const result = await sum({ a: 1, b: "2" });
        assert.strictEqual(result, 3);

        // @ts-ignore
        const [err1] = await _try(() => sum({ a: Buffer.from([1]), b: 2 }));
        assert.strictEqual(
            String(err1),
            "TypeError: parameters.arg0.a is expected to be a number, but a Buffer is given"
        );
        assert.strictEqual(err1.stack?.split("\n")[1], `    at ${__filename}:70:41`);

        // @ts-ignore
        const sum2 = def(async ({ a, b, c }) => {
            await Promise.resolve(null);
            return Buffer.from([a, b, c || 0]);
        }, [{ a: Number, b: Number, c: Number.optional }] as const, Number) as (param0: {
            a: number,
            b: number;
        }) => Promise<number>;
        const [err2] = await _try(() => sum2({ a: 1, b: 2 }));
        assert.strictEqual(
            String(err2),
            "TypeError: returns is expected to be a number, but a Buffer is given"
        );
        assert.strictEqual(
            err2.stack?.split("\n")[1],
            `    at async Context.<anonymous> (${__filename}:85:24)`
        );
    });

    it("should define a function that takes no arguments", () => {
        const test = def(() => {
            return "hello, world!";
        }, [Void], String);
        // @ts-ignore
        assert.strictEqual("hello, world!", test("hi, world!"));
    });

    it("should define a function that returns nothing", () => {
        const test = def(() => {
            return "hello, world!";
        }, [Void], Void);
        // @ts-ignore
        const [err1] = _try(() => test());
        assert.strictEqual(
            String(err1),
            "TypeError: returns is expected to be void, but a string is given"
        );
        assert.strictEqual(err1.stack?.split("\n")[1], `    at ${__filename}:109:35`);
    });

    after(() => {
        assert.deepStrictEqual(warnings, [
            {
                path: "parameters.arg0.b",
                message: "a string at parameters.arg0.b has been converted to number"
            },
            {
                path: "returns",
                message: "a string at returns has been converted to number"
            },
            {
                path: "parameters.arg0.b",
                message: "a string at parameters.arg0.b has been converted to number"
            },
            {
                path: "returns",
                message: "a string at returns has been converted to number"
            },
            {
                path: "anonymous()",
                message: "anonymous() is expected to have no argument, but a string is given"
            },
            {
                path: "parameters.arg0",
                message: "unknown property parameters.arg0 has been removed"
            }
        ] as ValidationWarning[]);
    });
});
