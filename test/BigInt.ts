import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { validate, ValidationWarning } from "..";

describe("BigInt", () => {
    it("should validate a bigint", () => {
        const num = validate(123n, BigInt, "num");
        assert.strictEqual(num, 123n);

        const num1 = validate(0n, BigInt, "num1");
        assert.strictEqual(num1, 0n);

        const num2 = validate(-100n, BigInt, "num2");
        assert.strictEqual(num2, -100n);
    });

    it("should report error when the bigint is not provided", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, BigInt, "num"));
        assert.strictEqual(String(err1), "Error: num is required, but no value is given");

        const [err2] = _try(() => validate(void 0, BigInt, "num"));
        assert.strictEqual(String(err2), "Error: num is required, but no value is given");

        const [err3] = _try(() => validate(NaN, BigInt, "num"));
        assert.strictEqual(String(err3), "Error: num is required, but no value is given");
    });

    it("should validate an optional bigint", () => {
        const num1 = validate(null, BigInt.optional, "num1");
        assert.strictEqual(num1, null);

        const num2 = validate(void 0, BigInt.optional, "num2");
        assert.strictEqual(num2, void 0);

        const num3 = validate(NaN, BigInt.optional, "num3");
        assert.strictEqual(num3, null);
    });

    it("should validate optional bigints with default value", () => {
        const num1 = validate(null, BigInt.default(0n), "num1");
        assert.strictEqual(num1, 0n);

        const num2 = validate(void 0, BigInt.default(123n), "num2");
        assert.strictEqual(num2, 123n);
    });

    it("should convert compatible values to bigints and record warnings", () => {
        const warnings: ValidationWarning[] = [];

        const num1 = validate("123", BigInt, "num1", { warnings });
        assert.strictEqual(num1, 123n);

        const num2 = validate(123, BigInt, "num2", { warnings });
        assert.strictEqual(num2, 123n);

        const num3 = validate(true, BigInt, "num3", { warnings });
        assert.strictEqual(num3, 1n);

        const num4 = validate(false, BigInt, "num4", { warnings });
        assert.strictEqual(num4, 0n);

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
        const [err1] = _try(() => validate({ hello: "world" }, BigInt, "num"));
        assert.strictEqual(
            String(err1),
            "TypeError: num is expected to be a bigint, but an object is given"
        );

        const [err2] = _try(() => validate([1, 2, 3], BigInt, "num"));
        assert.strictEqual(
            String(err2),
            "TypeError: num is expected to be a bigint, but an array is given"
        );

        const [err3] = _try(() => validate(Buffer.from([1, 2, 3]), BigInt, "num"));
        assert.strictEqual(
            String(err3),
            "TypeError: num is expected to be a bigint, but a Buffer is given"
        );

        const [err4] = _try(() => validate(() => 123, BigInt, "num"));
        assert.strictEqual(
            String(err4),
            "TypeError: num is expected to be a bigint, but a function is given"
        );
    });

    it("should not convert type when in strict mode", () => {
        const [err1] = _try(() => validate("123", BigInt, "num", { strict: true }));
        assert.strictEqual(
            String(err1),
            "TypeError: num is expected to be a bigint, but a string is given"
        );

        const [err2] = _try(() => validate(123, BigInt, "num", { strict: true }));
        assert.strictEqual(
            String(err2),
            "TypeError: num is expected to be a bigint, but a number is given"
        );

        const [err3] = _try(() => validate(true, BigInt, "num", { strict: true }));
        assert.strictEqual(
            String(err3),
            "TypeError: num is expected to be a bigint, but a boolean is given"
        );

        const [err4] = _try(() => validate(false, BigInt, "num", { strict: true }));
        assert.strictEqual(
            String(err4),
            "TypeError: num is expected to be a bigint, but a boolean is given"
        );
    });

    it("should constrain the range of the bigint", () => {
        const num1 = validate(10n, BigInt.min(1n), "num1");
        assert.strictEqual(num1, 10n);

        const [err1] = _try(() => validate(10n, BigInt.min(20n), "num"));
        assert.strictEqual(String(err1), "RangeError: num is expected not to be less than 20",);

        const num2 = validate(10n, BigInt.max(20n), "num");
        assert.strictEqual(num2, 10n);

        const [err2] = _try(() => validate(20n, BigInt.max(10n), "num"));
        assert.strictEqual(String(err2), "RangeError: num is expected not to be greater than 10",);

        const num3 = validate(10n, BigInt.min(1n).max(20n), "num3");
        assert.strictEqual(num3, 10n);
    });

    it("should constrain the options of the bigint", () => {
        const enums = BigInt.enum([-1n, 0n, 1n] as const);
        const num1 = validate(1n, enums, "num1");
        assert.strictEqual(num1, 1n);

        const [err1] = _try(() => validate(2n, enums, "num"));
        assert.strictEqual(
            String(err1),
            "TypeError: num is expected to be -1, 0 or 1, but 2 is given"
        );
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        validate(1n, BigInt.deprecated("will no longer effect"), "num", { warnings });

        assert.deepStrictEqual(warnings, [{
            path: "num",
            message: "num is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });

    it("should suppress non-critical errors as warnings", () => {
        const warnings: ValidationWarning[] = [];

        const num2 = validate(10n, BigInt.min(20n), "num2", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(num2, 10n);

        const num3 = validate(20n, BigInt.max(10n), "num3", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(num3, 20n);

        const num4 = validate(2n, BigInt.enum([
            -1n,
            0n,
            1n
        ] as const), "num4", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(num4, 2n);

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
                message: "num4 is expected to be -1, 0 or 1, but 2 is given"
            }
        ] as ValidationWarning[]);
    });
});
