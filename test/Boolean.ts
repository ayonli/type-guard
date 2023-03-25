import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { validate, ValidationWarning } from "..";

describe("Boolean", () => {
    it("should validate boolean values", () => {
        const bool1 = validate(true, Boolean, "bool1");
        assert.strictEqual(bool1, true);

        const bool2 = validate(false, Boolean, "bool2");
        assert.strictEqual(bool2, false);
    });

    it("should report error when the boolean is not provided", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, Boolean, "bool"));
        assert.strictEqual(String(err1), "Error: bool is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate(void 0, Boolean, "bool"));
        assert.strictEqual(String(err2), "Error: bool is required, but no value is given");
    });

    it("should validate an optional boolean", () => {
        // @ts-ignore
        const bool1 = validate(null, Boolean.optional, "bool1");
        assert.strictEqual(bool1, null);

        // @ts-ignore
        const bool2 = validate(void 0, Boolean.optional, "bool2");
        assert.strictEqual(bool2, void 0);
    });

    it("should validate optional booleans with default value", () => {
        // @ts-ignore
        const bool1 = validate(null, Boolean.default(false), "bool1");
        assert.strictEqual(bool1, false);

        // @ts-ignore
        const bool2 = validate(void 0, Boolean.default(true), "bool2");
        assert.strictEqual(bool2, true);
    });

    it("should convert compatible values to booleans and emit warnings", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const bool1 = validate("true", Boolean, "bool1", { warnings });
        assert.strictEqual(bool1, true);

        // @ts-ignore
        const bool2 = validate("false", Boolean, "bool2", { warnings });
        assert.strictEqual(bool2, false);

        // @ts-ignore
        const bool3 = validate(1, Boolean, "bool3", { warnings });
        assert.strictEqual(bool3, true);

        // @ts-ignore
        const bool4 = validate(0, Boolean, "bool4", { warnings });
        assert.strictEqual(bool4, false);

        assert.deepStrictEqual(warnings, [
            {
                path: "bool1",
                message: "a string at bool1 has been converted to boolean",
            },
            {
                path: "bool2",
                message: "a string at bool2 has been converted to boolean",
            },
            {
                path: "bool3",
                message: "a number at bool3 has been converted to boolean",
            },
            {
                path: "bool4",
                message: "a number at bool4 has been converted to boolean",
            }
        ] as ValidationWarning[]);
    });

    it("should throw error when the value is not compatible", () => {
        // @ts-ignore
        const [err1] = _try(() => validate("Yes", Boolean, "bool"));
        assert.strictEqual(
            String(err1),
            "TypeError: bool is expected to be a boolean, but a string is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate(10, Boolean, "bool"));
        assert.strictEqual(
            String(err2),
            "TypeError: bool is expected to be a boolean, but a number is given"
        );
    });

    it("should not convert type when in strict mode", () => {
        // @ts-ignore
        const [err1] = _try(() => validate("true", Boolean, "bool", { strict: true }));
        assert.strictEqual(
            String(err1),
            "TypeError: bool is expected to be a boolean, but a string is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate(1, Boolean, "bool", { strict: true }));
        assert.strictEqual(
            String(err2),
            "TypeError: bool is expected to be a boolean, but a number is given"
        );
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        validate(false, Boolean.deprecated("will no longer effect"), "bool", { warnings });

        assert.deepStrictEqual(warnings, [{
            path: "bool",
            message: "bool is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });
});
