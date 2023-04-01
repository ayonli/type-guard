import "@hyurl/utils/types";
import * as assert from "assert";
import _try from "dotry";
import { describe, it, before, after } from "mocha";
import { def, setWarningHandler, ValidationWarning } from "..";

describe("def()", () => {
    const warnings: ValidationWarning[] = [];

    before(() => {
        setWarningHandler(function (_warnings) {
            warnings.push(..._warnings);
        });
    });

    after(() => {
        assert.deepStrictEqual(warnings, [
            {
                path: "parameters.b",
                message: "a string at parameters.b has been converted to number"
            },
            {
                path: "returns",
                message: "a string at returns has been converted to number"
            },
            {
                path: "parameters.b",
                message: "a string at parameters.b has been converted to number"
            },
            {
                path: "returns",
                message: "a string at returns has been converted to number"
            },
        ] as ValidationWarning[]);
    });



    it("should define a function with typed parameters and returns", () => {
        // @ts-ignore
        const sum = def(({ a, b, c }) => {
            // @ts-ignore
            return String(a + b + (c || 0));
        }, { a: Number, b: Number, c: Number.optional }, Number);

        // @ts-ignore
        const result = sum({ a: 1, b: "2" });
        assert.deepEqual(result, 3);

        // @ts-ignore
        const [err1] = _try(() => sum({ a: Buffer.from([1]), b: Buffer.from([2]) }));
        assert.strictEqual(
            String(err1),
            "TypeError: parameters.a is expected to be a number, but a Buffer is given"
        );
        assert.strictEqual(err1.stack?.split("\n")[1], `    at ${__filename}:51:35`);

        // @ts-ignore
        const sum2 = def(({ a, b, c }) => {
            // @ts-ignore
            return Buffer.from([a, b, c || 0]);
        }, { a: Number, b: Number, c: Number.optional }, Number);
        // @ts-ignore
        const [err2] = _try(() => sum2({ a: 1, b: 2 }));
        assert.strictEqual(
            String(err2),
            "TypeError: returns is expected to be a number, but a Buffer is given"
        );
        assert.strictEqual(err2.stack?.split("\n")[1], `    at ${__filename}:64:35`);
    });

    it("should define an async function with typed parameters and returns", async () => {
        // @ts-ignore
        const sum = def(async ({ a, b, c }) => {
            return await Promise.resolve(String(a + b + (c || 0)));
        }, { a: Number, b: Number, c: Number.optional }, Number) as (parameters: {
            a: number,
            b: number;
        }) => Promise<number>;

        // @ts-ignore
        const result = await sum({ a: 1, b: "2" });
        assert.deepEqual(result, 3);

        // @ts-ignore
        const [err1] = await _try(() => sum({ a: Buffer.from([1]), b: Buffer.from([2]) }));
        assert.strictEqual(
            String(err1),
            "TypeError: parameters.a is expected to be a number, but a Buffer is given"
        );
        assert.strictEqual(err1.stack?.split("\n")[1], `    at ${__filename}:86:41`);

        // @ts-ignore
        const sum2 = def(async ({ a, b, c }) => {
            await Promise.resolve(null);
            // @ts-ignore
            return Buffer.from([a, b, c || 0]);
        }, { a: Number, b: Number, c: Number.optional }, Number) as (parameters: {
            a: number,
            b: number;
        }) => Promise<number>;
        // @ts-ignore
        const [err2] = await _try(() => sum2({ a: 1, b: 2 }));
        assert.strictEqual(
            String(err2),
            "TypeError: returns is expected to be a number, but a Buffer is given"
        );
        assert.strictEqual(
            err2.stack?.split("\n")[1],
            `    at async Context.<anonymous> (${__filename}:103:24)`
        );
    });
});
