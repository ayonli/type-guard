import * as assert from "node:assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { validate, ValidationWarning } from "..";

describe("Number", () => {
    it("should validate a number", () => {
        const num = validate(123, Number, "num");
        assert.strictEqual(num, 123);

        const num1 = validate(0, Number, "num1");
        assert.strictEqual(num1, 0);

        const num2 = validate(-100, Number, "num2");
        assert.strictEqual(num2, -100);

        const num3 = validate(12.3, Number, "num3");
        assert.strictEqual(num3, 12.3);
    });

    it("should report error when the number is not provided or provided NaN", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, Number, "num"));
        assert.strictEqual(String(err1), "Error: num is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate(void 0, Number, "num"));
        assert.strictEqual(String(err2), "Error: num is required, but no value is given");

        const [err3] = _try(() => validate(NaN, Number, "num"));
        assert.strictEqual(String(err3), "Error: num is required, but no value is given");

        const [err4] = _try(() => validate(NaN, Number.optional.required, "num"));
        assert.strictEqual(String(err4), "Error: num is required, but no value is given");
    });

    it("should validate an optional number", () => {
        // @ts-ignore
        const num1 = validate(null, Number.optional, "num1");
        assert.strictEqual(num1, null);

        // @ts-ignore
        const num2 = validate(void 0, Number.optional, "num2");
        assert.strictEqual(num2, void 0);

        // @ts-ignore
        const num3 = validate(NaN, Number.optional, "num3");
        assert.strictEqual(num3, null);
    });

    it("should validate optional numbers with default value", () => {
        // @ts-ignore
        const num1 = validate(null, Number.default(0), "num1");
        assert.strictEqual(num1, 0);

        // @ts-ignore
        const num2 = validate(void 0, Number.default(123), "num2");
        assert.strictEqual(num2, 123);
    });

    it("should convert compatible values to numbers and emit warnings", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const num1 = validate("123", Number, "num1", { warnings });
        assert.strictEqual(num1, 123);

        // @ts-ignore
        const num2 = validate(BigInt(123), Number, "num2", { warnings });
        assert.strictEqual(num2, 123);

        // @ts-ignore
        const num3 = validate(true, Number, "num3", { warnings });
        assert.strictEqual(num3, 1);

        // @ts-ignore
        const num4 = validate(false, Number, "num4", { warnings });
        assert.strictEqual(num4, 0);

        const date = new Date();
        // @ts-ignore
        const num5 = validate(date, Number, "num5", { warnings });
        assert.strictEqual(num5, date.valueOf());

        assert.deepStrictEqual(warnings, [
            {
                path: "num1",
                message: "a string at num1 has been converted to number",
            },
            {
                path: "num2",
                message: "a bigint at num2 has been converted to number",
            },
            {
                path: "num3",
                message: "a boolean at num3 has been converted to number",
            },
            {
                path: "num4",
                message: "a boolean at num4 has been converted to number",
            },
            {
                path: "num5",
                message: "a Date at num5 has been converted to number",
            }
        ] as ValidationWarning[]);
    });

    it("should throw error when the value is not compatible", () => {
        // @ts-ignore
        const [err1] = _try(() => validate("1000000000000000000", Number, "num1"));
        assert.strictEqual(
            String(err1),
            "TypeError: num1 is expected to be a number, but a string is given",
        );

        // @ts-ignore
        const [err2] = _try(() => validate(BigInt("1000000000000000000"), Number, "num2"));
        assert.strictEqual(
            String(err2),
            "TypeError: num2 is expected to be a number, but a bigint is given",
        );

        // @ts-ignore
        const [err3] = _try(() => validate({ hello: "world" }, Number, "num3"));
        assert.strictEqual(
            String(err3),
            "TypeError: num3 is expected to be a number, but an object is given"
        );

        // @ts-ignore
        const [err4] = _try(() => validate([1, 2, 3], Number, "num4"));
        assert.strictEqual(
            String(err4),
            "TypeError: num4 is expected to be a number, but an array is given"
        );

        // @ts-ignore
        const [err5] = _try(() => validate(Buffer.from([1, 2, 3]), Number, "num5"));
        assert.strictEqual(
            String(err5),
            "TypeError: num5 is expected to be a number, but a Buffer is given"
        );

        // @ts-ignore
        const [err6] = _try(() => validate(() => 123, Number, "num"));
        assert.strictEqual(
            String(err6),
            "TypeError: num is expected to be a number, but a function is given"
        );
    });

    it("should not convert type when in strict mode", () => {
        // @ts-ignore
        const [err1] = _try(() => validate("123", Number, "num", { strict: true }));
        assert.strictEqual(
            String(err1),
            "TypeError: num is expected to be a number, but a string is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate(BigInt(123), Number, "num", { strict: true }));
        assert.strictEqual(
            String(err2),
            "TypeError: num is expected to be a number, but a bigint is given"
        );

        // @ts-ignore
        const [err3] = _try(() => validate(true, Number, "num", { strict: true }));
        assert.strictEqual(
            String(err3),
            "TypeError: num is expected to be a number, but a boolean is given"
        );

        // @ts-ignore
        const [err4] = _try(() => validate(false, Number, "num", { strict: true }));
        assert.strictEqual(
            String(err4),
            "TypeError: num is expected to be a number, but a boolean is given"
        );

        // @ts-ignore
        const [err5] = _try(() => validate(new Date(), Number, "num", { strict: true }));
        assert.strictEqual(
            String(err5),
            "TypeError: num is expected to be a number, but a Date is given"
        );
    });

    it("should constrain the value to be integer", () => {
        const num1 = validate(123, Number.integer, "num1");
        assert.strictEqual(num1, 123);

        const [err1] = _try(() => validate(1.23, Number.integer, "num"));
        assert.strictEqual(String(err1), "TypeError: num is expected to be an integer");
    });

    it("should constrain the range of the number", () => {
        const num1 = validate(10, Number.min(1), "num1");
        assert.strictEqual(num1, 10);

        const [err1] = _try(() => validate(10, Number.min(20), "num"));
        assert.strictEqual(String(err1), "RangeError: num is expected not to be less than 20");

        const num2 = validate(10, Number.max(20), "num");
        assert.strictEqual(num2, 10);

        const [err2] = _try(() => validate(20, Number.max(10), "num"));
        assert.strictEqual(String(err2), "RangeError: num is expected not to be greater than 10");

        const num3 = validate(10, Number.min(1).max(20), "num3");
        assert.strictEqual(num3, 10);
    });

    it("should constrain the options of the number", () => {
        const num1 = validate(1, Number.enum([-1, 0, 1] as const), "num1");
        assert.strictEqual(num1, 1);

        // @ts-ignore
        const [err1] = _try(() => validate(2, Number.enum([-1, 0, 1] as const), "num"));
        assert.strictEqual(
            String(err1),
            "Error: num is expected to be one of these values: -1, 0, 1"
        );
    });

    it("should constrain by a constant number", () => {
        const num1 = validate(1, 1 as const, "num1");
        assert.strictEqual(num1, 1);

        // @ts-ignore
        const [err1] = _try(() => validate(0, 1 as const, "num"));
        assert.strictEqual(String(err1), "Error: num is expected to be 1");
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        const num = validate(123, Number.deprecated("will no longer effect"), "num", { warnings });
        assert.strictEqual(num, 123);

        assert.deepStrictEqual(warnings, [{
            path: "num",
            message: "num is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });

    it("should suppress non-critical errors as warnings", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const num1 = validate(1.5, Number.integer, "num1", { warnings, suppress: true });
        assert.strictEqual(num1, 1.5);

        const num2 = validate(10, Number.min(20), "num2", { warnings, suppress: true });
        assert.strictEqual(num2, 10);

        const num3 = validate(20, Number.max(10), "num3", { warnings, suppress: true });
        assert.strictEqual(num3, 20);

        // @ts-ignore
        const num4 = validate(2, Number.enum([-1, 0, 1] as const), "num4", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(num4, 2);

        // @ts-ignore
        const num5 = validate(0, 1 as const, "num5", { warnings, suppress: true });
        assert.strictEqual(num5, 0);

        assert.deepStrictEqual(warnings, [
            {
                path: "num1",
                message: "num1 is expected to be an integer"
            },
            {
                path: "num2",
                message: "num2 is expected not to be less than 20"
            },
            {
                path: "num3",
                message: "num3 is expected not to be greater than 10"
            },
            {
                path: "num4",
                message: "num4 is expected to be one of these values: -1, 0, 1"
            },
            {
                path: "num5",
                message: "num5 is expected to be 1"
            }
        ] as ValidationWarning[]);
    });
});
