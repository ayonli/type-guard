import * as assert from "node:assert";
import { describe, it } from "mocha";
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

        const dict3 = validate(obj1, Dict(String.enum(["foo", "bar"] as const), String), "dict3");
        assert.deepStrictEqual(dict3, obj1);

        const dict4 = validate(obj1, Dict(String, String.enum(["hello", "world"] as const)), "dict4");
        assert.deepStrictEqual(dict4, obj1);

        let err1: any;
        try {
            // @ts-ignore
            validate(null, Dict(String, String), "dict1");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "Error: dict1 is required, but no value is given"
            );
        }
        assert(err1 instanceof Error);

        let err2: any;
        try {
            // @ts-ignore
            validate({ foo: {} }, Dict(String, String), "dict2");
        } catch (err) {
            err2 = err;
            assert.strictEqual(
                String(err),
                "TypeError: dict2.foo is expected to be a string, but an object is given"
            );
        }
        assert(err2 instanceof Error);

        let err3: any;
        try {
            // @ts-ignore
            validate({
                // @ts-ignore
                foo: "hello", bar: "world", foo1: {}
            }, Dict(String.enum(["foo", "bar"] as const), String), "dict3");
        } catch (err) {
            err3 = err;
            assert.strictEqual(
                String(err),
                "RangeError: dict3 is expected to contain only these properties: 'foo', 'bar'"
            );
        }
        assert(err3 instanceof Error);

        let err4: any;
        try {
            // @ts-ignore
            validate({
                // @ts-ignore
                foo: "hello", bar: "world", foo1: "123"
            }, Dict(String, String.enum(["hello", "world"] as const)), "dict4");
        } catch (err) {
            err4 = err;
            assert.strictEqual(
                String(err),
                "RangeError: dict4.foo1 is expected to be one of these values: 'hello', 'world'"
            );
        }
        assert(err4 instanceof Error);
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
