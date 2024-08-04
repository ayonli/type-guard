import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "@ayonli/jsext/try";
import { as, validate, ValidationWarning } from "../src";

describe("TupleType", () => {
    it("should validate tuples with as() function", () => {
        const value1 = validate(["hello, world", 123], as([String, Number] as const), "value1");
        assert.deepStrictEqual(value1, ["hello, world", 123]);

        const [err1] = _try(() => validate(null, as([String, Number] as const), "value"));
        assert.strictEqual(
            String(err1),
            "Error: value is required, but no value is given"
        );

        const [err2] = _try(() => validate([
            "hello",
            Buffer.from([1, 2, 3])
        ], as([String, Number] as const), "value"));
        assert.strictEqual(
            String(err2),
            "TypeError: value[1] is expected to be a number, but a Buffer is given"
        );

        const [err3] = _try(() => validate(["hello"], as([String, Number] as const), "value"));
        assert.strictEqual(
            String(err3),
            "Error: value[1] is required, but no value is given"
        );

        const [err4] = _try(() => validate([
            "hello",
            1,
            2,
            3
        ], as([String, Number] as const), "value"));
        assert.strictEqual(
            String(err4),
            "RangeError: value is expected to contain no more than 2 items"
        );
    });

    it("should validate optional tuple", () => {
        const value1 = validate(null, as([String, Number] as const).optional, "value1");
        assert.strictEqual(value1, null);
    });

    it("should validate optional items in tuple", () => {
        const value1 = validate(["hello"], as([String, Number.optional] as const).optional, "value1");
        assert.deepStrictEqual(value1, ["hello"]);

        const value2 = validate(["hello", void 0, true], as([
            String,
            Number.optional,
            Boolean.optional
        ] as const).optional, "value1");
        assert.deepStrictEqual(value2, ["hello", void 0, true]);

        const value3 = validate(["hello", void 0, null], as([
            String,
            Number.optional,
            Boolean.optional
        ] as const).optional, "value1");
        assert.deepStrictEqual(value3, ["hello", void 0, null]);
    });

    it("should validate tuple with default value", () => {
        const value1 = validate(void 0, as([String, Number] as const).default(["hello", 1]), "value1");
        assert.deepStrictEqual(value1, ["hello", 1]);
    });

    it("should validate tuple of constant values", () => {
        const value1 = validate(["foo", 1], as(["foo", 1] as const), "value1");
        assert.deepStrictEqual(value1, ["foo", 1]);
    });

    it("should remove unknown items and emit warnings", () => {
        const warnings: ValidationWarning[] = [];

        const value1 = validate(["foo", 1, "bar"], as([String, Number] as const), "value1", {
            warnings,
            removeUnknownItems: true,
        });
        assert.deepStrictEqual(value1, ["foo", 1]);

        const value2 = validate(["foo", 1, "bar", 2, 3], as([String, Number] as const), "value2", {
            warnings,
            removeUnknownItems: true,
        });
        assert.deepStrictEqual(value2, ["foo", 1]);

        assert.deepStrictEqual(warnings, [
            {
                path: "value1",
                message: "unknown item value1[2] has been removed",
            },
            {
                path: "value2",
                message: "unknown items value2[2...4] have been removed",
            }
        ] as ValidationWarning[]);
    });

    it("should silence item removing warnings when suppressed", () => {
        const warnings: ValidationWarning[] = [];

        const value1 = validate(["foo", 1, "bar"], as([String, Number] as const), "value1", {
            warnings,
            removeUnknownItems: true,
            suppress: true,
        });
        assert.deepStrictEqual(value1, ["foo", 1]);

        assert.deepStrictEqual(warnings, [] as ValidationWarning[]);
    });

    it("should suppress non-critical errors as warnings", () => {
        const warnings: ValidationWarning[] = [];

        const value1 = validate(["foo", 1, "bar"], as([String, Number] as const), "value1", {
            warnings,
            suppress: true,
        });
        assert.deepStrictEqual(value1, ["foo", 1]);

        assert.deepStrictEqual(warnings, [
            {
                path: "value1",
                message: "value1 is expected to contain no more than 2 items"
            }
        ] as ValidationWarning[]);
    });
});
