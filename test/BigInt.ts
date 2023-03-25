import * as assert from "node:assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { validate, ValidationWarning } from "..";

describe("BigInt", () => {
    it("should validate a bigint", () => {
        const num = validate(BigInt(123), BigInt, "num");
        assert.strictEqual(num, BigInt(123));

        const num1 = validate(BigInt(0), BigInt, "num1");
        assert.strictEqual(num1, BigInt(0));

        const num2 = validate(BigInt(-100), BigInt, "num2");
        assert.strictEqual(num2, BigInt(-100));
    });

    it("should report error when the bigint is not provided", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, BigInt, "num"));
        assert.strictEqual(String(err1), "Error: num is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate(void 0, BigInt, "num"));
        assert.strictEqual(String(err2), "Error: num is required, but no value is given");

        // @ts-ignore
        const [err3] = _try(() => validate(NaN, BigInt, "num"));
        assert.strictEqual(String(err3), "Error: num is required, but no value is given");
    });

    it("should validate an optional bigint", () => {
        // @ts-ignore
        const num1 = validate(null, BigInt.optional, "num1");
        assert.strictEqual(num1, null);

        // @ts-ignore
        const num2 = validate(void 0, BigInt.optional, "num2");
        assert.strictEqual(num2, void 0);

        // @ts-ignore
        const num3 = validate(NaN, BigInt.optional, "num3");
        assert.strictEqual(num3, null);
    });

    it("should validate optional bigints with default value", () => {
        // @ts-ignore
        const num1 = validate(null, BigInt.default(BigInt(0)), "num1");
        assert.strictEqual(num1, BigInt(0));

        // @ts-ignore
        const num2 = validate(void 0, BigInt.default(BigInt(123)), "num2");
        assert.strictEqual(num2, BigInt(123));
    });

    it("should convert compatible values to bigints and record warnings", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const num1 = validate("123", BigInt, "num1", { warnings });
        assert.strictEqual(num1, BigInt(123));

        // @ts-ignore
        const num2 = validate(123, BigInt, "num2", { warnings });
        assert.strictEqual(num2, BigInt(123));

        // @ts-ignore
        const num3 = validate(true, BigInt, "num3", { warnings });
        assert.strictEqual(num3, BigInt(1));

        // @ts-ignore
        const num4 = validate(false, BigInt, "num4", { warnings });
        assert.strictEqual(num4, BigInt(0));

        assert.deepStrictEqual(warnings, [
            {
                path: "num1",
                message: "a string at num1 has been converted to bigint",
            },
            {
                path: "num2",
                message: "a number at num2 has been converted to bigint",
            },
            {
                path: "num3",
                message: "a boolean at num3 has been converted to bigint",
            },
            {
                path: "num4",
                message: "a boolean at num4 has been converted to bigint",
            }
        ] as ValidationWarning[]);
    });

    it("should throw error when the value is not compatible", () => {
        // @ts-ignore
        const [err1] = _try(() => validate({ hello: "world" }, BigInt, "num"));
        assert.strictEqual(
            String(err1),
            "TypeError: num is expected to be a bigint, but an object is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate([1, 2, 3], BigInt, "num"));
        assert.strictEqual(
            String(err2),
            "TypeError: num is expected to be a bigint, but an array is given"
        );

        // @ts-ignore
        const [err3] = _try(() => validate(Buffer.from([1, 2, 3]), BigInt, "num"));
        assert.strictEqual(
            String(err3),
            "TypeError: num is expected to be a bigint, but a Buffer is given"
        );

        // @ts-ignore
        const [err4] = _try(() => validate(() => 123, BigInt, "num"));
        assert.strictEqual(
            String(err4),
            "TypeError: num is expected to be a bigint, but a function is given"
        );
    });

    it("should not convert type when in strict mode", () => {
        // @ts-ignore
        const [err1] = _try(() => validate("123", BigInt, "num", { strict: true }));
        assert.strictEqual(
            String(err1),
            "TypeError: num is expected to be a bigint, but a string is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate(123, BigInt, "num", { strict: true }));
        assert.strictEqual(
            String(err2),
            "TypeError: num is expected to be a bigint, but a number is given"
        );

        // @ts-ignore
        const [err3] = _try(() => validate(true, BigInt, "num", { strict: true }));
        assert.strictEqual(
            String(err3),
            "TypeError: num is expected to be a bigint, but a boolean is given"
        );

        // @ts-ignore
        const [err4] = _try(() => validate(false, BigInt, "num", { strict: true }));
        assert.strictEqual(
            String(err4),
            "TypeError: num is expected to be a bigint, but a boolean is given"
        );
    });

    it("should constrain the range of the bigint", () => {
        const num1 = validate(BigInt(10), BigInt.min(BigInt(1)), "num1");
        assert.strictEqual(num1, BigInt(10));

        const [err1] = _try(() => validate(BigInt(10), BigInt.min(BigInt(20)), "num"));
        assert.strictEqual(String(err1), "RangeError: num is expected not to be less than 20",);

        const num2 = validate(BigInt(10), BigInt.max(BigInt(20)), "num");
        assert.strictEqual(num2, BigInt(10));

        const [err2] = _try(() => validate(BigInt(20), BigInt.max(BigInt(10)), "num"));
        assert.strictEqual(String(err2), "RangeError: num is expected not to be greater than 10",);

        const num3 = validate(BigInt(10), BigInt.min(BigInt(1)).max(BigInt(20)), "num3");
        assert.strictEqual(num3, BigInt(10));
    });

    it("should constrain the options of the bigint", () => {
        const enums = BigInt.enum([BigInt(-1), BigInt(0), BigInt(1)] as const);
        const num1 = validate(BigInt(1), enums, "num1");
        assert.strictEqual(num1, BigInt(1));

        // @ts-ignore
        const [err1] = _try(() => validate(BigInt(2), enums, "num"));
        assert.strictEqual(
            String(err1),
            "Error: num is expected to be one of these values: -1, 0, 1"
        );
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        validate(BigInt(1), BigInt.deprecated("will no longer effect"), "num", { warnings });

        assert.deepStrictEqual(warnings, [{
            path: "num",
            message: "num is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });

    it("should suppress non-critical errors as warnings", () => {
        const warnings: ValidationWarning[] = [];

        const num2 = validate(BigInt(10), BigInt.min(BigInt(20)), "num2", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(num2, BigInt(10));

        const num3 = validate(BigInt(20), BigInt.max(BigInt(10)), "num3", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(num3, BigInt(20));

        // @ts-ignore
        const num4 = validate(BigInt(2), BigInt.enum([
            BigInt(-1),
            BigInt(0),
            BigInt(1)
        ] as const), "num4", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(num4, BigInt(2));

        assert.deepStrictEqual(warnings, [
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
            }
        ] as ValidationWarning[]);
    });
});
