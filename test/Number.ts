import * as assert from "node:assert";
import { describe, it } from "mocha";
import { validate, ValidationWarning } from "..";

describe("Number", () => {
    it("should validate a number", () => {
        const num = validate(123, Number, "num");
        assert.strictEqual(num, 123);
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

    it("should report error when the number is not provided or provided NaN", () => {
        try {
            // @ts-ignore
            validate(null, Number, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: num is required, but no value is given"
            );
        }

        try {
            // @ts-ignore
            validate(void 0, Number, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: num is required, but no value is given"
            );
        }

        try {
            validate(NaN, Number, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: num is required, but no value is given"
            );
        }

        try {
            validate(NaN, Number.optional.required, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: num is required, but no value is given"
            );
        }
    });

    it("should convert compatible values to numbers and record warnings", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const num1 = validate("123", Number, "num1", { warnings });
        assert.strictEqual(num1, 123);

        try {
            // @ts-ignore
            validate("1000000000000000000", Number, "num2");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num2 is expected to be a number, but a string is given",
            );
        }

        // @ts-ignore
        const num2 = validate(BigInt(123), Number, "num2", { warnings });
        assert.strictEqual(num2, 123);

        try {
            // @ts-ignore
            validate(BigInt("1000000000000000000"), Number, "num2");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num2 is expected to be a number, but a bigint is given",
            );
        }

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
        try {
            // @ts-ignore
            validate({ hello: "world" }, Number, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but an object is given");
        }

        try {
            // @ts-ignore
            validate([1, 2, 3], Number, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but an array is given");
        }

        try {
            // @ts-ignore
            validate(Buffer.from([1, 2, 3]), Number, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but a Buffer is given");
        }

        try {
            // @ts-ignore
            validate(() => 123, Number, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but a function is given");
        }
    });

    it("should not convert type when in strict mode", () => {
        try {
            // @ts-ignore
            validate("123", Number, "num", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but a string is given");
        }

        try {
            // @ts-ignore
            validate(BigInt(123), Number, "num", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but a bigint is given");
        }

        try {
            // @ts-ignore
            validate(true, Number, "num", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but a boolean is given");
        }

        try {
            // @ts-ignore
            validate(false, Number, "num", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but a boolean is given");
        }

        try {
            // @ts-ignore
            validate(new Date(), Number, "num", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num is expected to be a number, but a Date is given");
        }
    });

    it("should constrain the value to be integer", () => {
        const num1 = validate(123, Number.integer, "num1");
        assert.strictEqual(num1, 123);

        try {
            validate(1.23, Number.integer, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: num must be an integer"
            );
        }
    });

    it("should constrain the range of the number", () => {
        const num1 = validate(10, Number.min(1), "num1");
        assert.strictEqual(num1, 10);

        try {
            validate(10, Number.min(20), "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "RangeError: num must not be less than 20",
            );
        }

        const num2 = validate(10, Number.max(20), "num");
        assert.strictEqual(num2, 10);

        try {
            validate(20, Number.max(10), "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "RangeError: num must not be greater than 10",
            );
        }

        const num3 = validate(10, Number.min(1).max(20), "num3");
        assert.strictEqual(num3, 10);
    });

    it("should constrain the options of the number", () => {
        const num1 = validate(1, Number.enum([-1, 0, 1] as const), "num1");
        assert.strictEqual(num1, 1);

        try {
            // @ts-ignore
            validate(2, Number.enum([-1, 0, 1] as const), "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: num must be one of these values: -1, 0, 1"
            );
        }
    });

    it("should constrain by a constant number", () => {
        const num1 = validate(1, 1 as const, "num1");
        assert.strictEqual(num1, 1);

        try {
            // @ts-ignore
            validate(0, 1 as const, "num");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: num must be 1");
        }
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        validate(123, Number.deprecated("will no longer effect"), "num", { warnings });

        assert.deepStrictEqual(warnings, [{
            path: "num",
            message: "num is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });
});
