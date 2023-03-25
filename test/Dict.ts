import * as assert from "node:assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { validate, Dict, as, ValidationWarning } from "..";

describe("Dict", () => {
    it("should import Dict type", () => {
        assert.strictEqual(typeof Dict, "function");
        assert.strictEqual(String(Dict(String, String)), "[object DictType]");
        assert.strictEqual(String(Dict(String, String).optional), "[object OptionalDictType]");
        assert.strictEqual(String(Dict(String, String).optional.required), "[object DictType]");
    });

    it("should validate Dict against objects", () => {
        const obj1 = { foo: "hello", bar: "world" } as const;
        const dict1 = validate(obj1, Dict(String, String), "dict1");
        assert.deepStrictEqual(dict1, obj1);

        const obj2 = { foo: "hello", bar: 123 };
        const dict2 = validate(obj2, Dict(String, as(String, Number)), "dict2");
        assert.deepStrictEqual(dict2, obj2);

        // @ts-ignore
        const [err1] = _try(() => validate(null, Dict(String, String), "dict1"));
        assert.strictEqual(String(err1), "Error: dict1 is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate({ foo: {} }, Dict(String, String), "dict2"));
        assert.strictEqual(
            String(err2),
            "TypeError: dict2.foo is expected to be a string, but an object is given"
        );

        // @ts-ignore
        const [err3] = _try(() => validate({
            foo: "hello",
            // @ts-ignore
            bar: {},
        }, Dict(String, as(String, Number)), "dict3"));
        assert.strictEqual(
            String(err3),
            "TypeError: dict3.bar is expected to be a string or number, but an object is given"
        );
    });

    it("should validate Dict against enum properties", () => {
        const obj1 = { foo: "hello", bar: "world" } as const;

        const dict1 = validate(obj1, Dict(String.enum(["foo", "bar"] as const), String), "dict1");
        assert.deepStrictEqual(dict1, obj1);

        const [err1] = _try(() => validate({
            foo: "hello",
            // @ts-ignore
            bar1: "world"
        }, Dict(String.enum(["foo", "bar"] as const), String), "dict1"));
        assert.strictEqual(
            String(err1),
            "RangeError: dict1 is expected to contain only these properties: 'foo', 'bar'"
        );
    });

    it("should validate Dict against enum values", () => {
        const obj1 = { foo: "hello", bar: "world" } as const;
        const dict4 = validate(obj1, Dict(String, String.enum(["hello", "world"] as const)), "dict4");
        assert.deepStrictEqual(dict4, obj1);

        const [err1] = _try(() => validate({
            // @ts-ignore
            foo: "hi",
            bar: "world"
        }, Dict(String, String.enum(["hello", "world"] as const)), "dict1"));
        assert.strictEqual(
            String(err1),
            "RangeError: dict1.foo is expected to be one of these values: 'hello', 'world'"
        );
    });

    it("should remove unknown properties and emit warnings", () => {
        const warnings: ValidationWarning[] = [];

        const dict1 = validate({
            // @ts-ignore
            foo: "hello", bar: "world", foo1: "hi"
        }, Dict(String.enum(["foo", "bar"] as const), String), "dict1", {
            warnings,
            removeUnknownProps: true,
        });
        assert.deepStrictEqual(dict1, { foo: "hello", bar: "world" });

        assert.deepStrictEqual(warnings, [
            {
                path: "dict1.foo1",
                message: "unknown property dict1.foo1 has been removed",
            }
        ] as ValidationWarning[]);
    });

    it("should not emit warnings when suppressed", () => {
        const warnings: ValidationWarning[] = [];

        const dict1 = validate({
            // @ts-ignore
            foo: "hello", bar: "world", foo1: "hi"
        }, Dict(String.enum(["foo", "bar"] as const), String), "dict1", {
            warnings,
            removeUnknownProps: true,
            suppress: true,
        });
        assert.deepStrictEqual(dict1, { foo: "hello", bar: "world" });

        assert.deepStrictEqual(warnings, [] as ValidationWarning[]);
    });

    it("should suppress errors as warnings", () => {
        const warnings: ValidationWarning[] = [];

        const dict1 = validate({
            // @ts-ignore
            foo: "hello", bar: "world", foo1: "hi"
        }, Dict(String.enum(["foo", "bar"] as const), String), "dict1", {
            warnings,
            suppress: true,
        });
        assert.deepStrictEqual(dict1, { foo: "hello", bar: "world", foo1: "hi" });

        assert.deepStrictEqual(warnings, [
            {
                path: "dict1",
                message: "dict1 is expected to contain only these properties: 'foo', 'bar'",
            }
        ] as ValidationWarning[]);
    });
});
