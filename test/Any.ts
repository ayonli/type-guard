import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { validate, Any, ValidationWarning } from "..";

describe("Any", () => {
    it("should import Any type", () => {
        assert.strictEqual(typeof Any, "object");
        assert.strictEqual(String(Any), "[object AnyType]");
        assert.strictEqual(String(Any.optional), "[object OptionalAnyType]");
        assert.strictEqual(String(Any.required), "[object AnyType]");
    });

    it("should validate Any against values of various types", () => {
        const value1 = validate("hello, world", Any, "value1");
        assert.strictEqual(value1, "hello, world");

        const value2 = validate(123, Any, "value2");
        assert.strictEqual(value2, 123);

        const value3 = validate(true, Any, "value3");
        assert.strictEqual(value3, true);

        const date = new Date();
        const value4 = validate(date, Any, "value4");
        assert.strictEqual(value4, date);

        const obj = { foo: "hello", bar: "world" };
        const value5 = validate(obj, Any, "value5");
        assert.strictEqual(value5, obj);

        const arr = ["hello", "world"];
        const value6 = validate(arr, Any, "value6");
        assert.strictEqual(value6, arr);
    });

    it("should report error when the value is not provided", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(void 0, Any, "value1"));
        assert.strictEqual(String(err1), "Error: value1 is required, but no value is given");

        const [err2] = _try(() => validate(null, Any, "value2"));
        assert.strictEqual(String(err2), "Error: value2 is required, but no value is given");
    });

    it("should validate an optional value", () => {
        const value8 = validate(void 0, Any.optional, "value8");
        assert.strictEqual(value8, void 0);
    });

    it("should validate an optional value with default value", () => {
        const value9 = validate(void 0, Any.default(null), "value9");
        assert.strictEqual(value9, null);

        const date = new Date();
        const value10 = validate(void 0, Any.default(date), "value10");
        assert.strictEqual(value10, date);
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        const value = validate("hello, world!", Any.deprecated("will no longer effect"), "value", {
            warnings,
        });
        assert.strictEqual(value, "hello, world!");

        assert.deepStrictEqual(warnings, [{
            path: "value",
            message: "value is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });
});
