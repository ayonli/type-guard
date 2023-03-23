import * as assert from "node:assert";
import { describe, it } from "mocha";
import { validate, Any } from "..";

describe("Any", () => {
    it("should import Any type", () => {
        assert.strictEqual(typeof Any, "object");
        assert.strictEqual(String(Any), "[object AnyType]");
        assert.strictEqual(String(Any.optional), "[object OptionalAnyType]");
        assert.strictEqual(String(Any.required), "[object AnyType]");
    });

    it("should validate Any against various type of values", () => {
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

        const value7 = validate(null, Any, "value7");
        assert.strictEqual(value7, null);

        const value8 = validate(void 0, Any.optional, "value8");
        assert.strictEqual(value8, void 0);

        const value9 = validate(void 0, Any.default(null), "value9");
        assert.strictEqual(value9, null);
    });
});
