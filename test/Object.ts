import * as assert from "node:assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { as, validate, ValidationWarning } from "..";

describe("Object", () => {
    it("should validate values of mixed types", () => {
        const obj = { foo: "hello", bar: "world" };
        const obj1 = validate(obj, Object, "obj1");
        assert.strictEqual(obj1, obj);

        const date = new Date();
        const obj2 = validate(date, Object, "obj2");
        assert.strictEqual(obj2, date);

        const buf = Buffer.from("hello, world!");
        const obj3 = validate(buf, Object, "obj3");
        assert.strictEqual(obj3, buf);

        const arr = [1, 2, 3];
        const obj4 = validate(arr, Object, "obj4");
        assert.strictEqual(obj4, arr);
    });

    it("should report error when the value is not provided", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, Object, "obj"));
        assert.strictEqual(String(err1), "Error: obj is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate(void 0, Object, "obj"));
        assert.strictEqual(String(err2), "Error: obj is required, but no value is given");
    });

    it("should validate optional values of mixed types", () => {
        // @ts-ignore
        const obj1 = validate(null, Object.optional, "obj1");
        assert.strictEqual(obj1, null);

        // @ts-ignore
        const obj2 = validate(void 0, Object.optional, "obj2");
        assert.deepStrictEqual(obj2, void 0);
    });

    it("should validate values of mixed types with default values", () => {
        const obj = {};
        // @ts-ignore
        const obj1 = validate(null, Object.default(obj), "obj1");
        assert.strictEqual(obj1, obj);

        const date = new Date();
        // @ts-ignore
        const obj2 = validate(void 0, Object.default(date), "obj2");
        assert.strictEqual(obj2, date);
    });

    it("should validate structures of object literals", () => {
        const obj = validate({
            str: "hello, world!",
        }, {
            str: String,
            str1: String.optional,
        }, "obj");
        assert.deepStrictEqual(obj, { str: "hello, world!" });

        // @ts-ignore
        const obj1 = validate(null, as({ str: String, str1: String.optional }).optional, "obj1");
        assert.strictEqual(obj1, null);

        // @ts-ignore
        const obj2 = validate(null, as({
            str: String,
            str1: String.optional,
        }).default({ str: "hello, world!" }), "obj2");
        assert.deepStrictEqual(obj2, { str: "hello, world!" });

        const obj3 = validate({ foo: {} }, {
            foo: {
                foo1: String.default("hello, world!"),
                bar1: Number.optional,
            },
            bar: Number.optional,
        }, "obj3");
        assert.deepStrictEqual(obj3, { foo: { foo1: "hello, world!" } });
    });

    it("should report errors occurred in the object literal structures", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, { str: String, str1: String.optional }, "obj"));
        assert.strictEqual(
            String(err1),
            "Error: obj is required, but no value is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate({}, { str: String, str1: String.optional }, "obj"));
        assert.strictEqual(
            String(err2),
            "Error: obj.str is required, but no value is given"
        );

        // @ts-ignore
        const [err3] = _try(() => validate({ foo: {} }, {
            foo: {
                foo1: String,
                bar1: Number.optional,
            },
            bar: Number.optional,
        }, "obj"));
        assert.strictEqual(
            String(err3),
            "Error: obj.foo.foo1 is required, but no value is given"
        );

        // @ts-ignore
        const [err4] = _try(() => validate("hello, world!", { foo: String, bar: Number }, "obj"));
        assert.strictEqual(
            String(err4),
            "TypeError: obj is expected to be an object, but a string is given"
        );

        // @ts-ignore
        const [err5] = _try(() => validate({ foo: {} }, { foo: String }, "obj"));
        assert.strictEqual(
            String(err5),
            "TypeError: obj.foo is expected to be a string, but an object is given"
        );
    });

    it("should remove unknown properties of the object literal", () => {
        // @ts-ignore
        const obj1 = validate({ foo: "123", bar: "456" }, { foo: String }, "obj6", {
            removeUnknownProps: true,
        });
        assert.deepStrictEqual(obj1, { foo: "123" });

        // @ts-ignore
        const obj2 = validate({
            // @ts-ignore
            foo: { foo: "123", bar: "456" }, bar: "123"
        }, { foo: { bar: String } }, "obj6", {
            removeUnknownProps: true,
        });
        assert.deepStrictEqual(obj2, { foo: { bar: "456" } });
    });

    it("should emit various warnings", () => {
        const warnings: ValidationWarning[] = [];

        const obj1 = validate({}, Object.deprecated("no longer effect"), "obj1", { warnings });
        assert.deepStrictEqual(obj1, {});

        const obj2 = validate({ foo: "hello, world!" }, {
            foo: String.optional.deprecated("use 'bar' instead"),
            bar: String.optional,
        }, "obj2", { warnings });
        assert.deepStrictEqual(obj2, { foo: "hello, world!" });

        const obj3 = validate({ foo: "hello, world!" }, {
            foo: String.optional.deprecated(),
            bar: String.optional,
        }, "obj3", { warnings });
        assert.deepStrictEqual(obj3, { foo: "hello, world!" });

        const obj4 = validate({ foo: "hello, world!", bar: "hi, world!" }, {
            foo: String.optional.deprecated("use 'bar' instead"),
            bar: String.optional.deprecated(),
        }, "obj4", { warnings });
        assert.deepStrictEqual(obj4, { foo: "hello, world!", bar: "hi, world!" });

        // @ts-ignore
        const obj5 = validate({ foo: 123, bar: "123" }, {
            foo: String,
            bar: Number,
        }, "obj5", { warnings });
        assert.deepStrictEqual(obj5, { foo: "123", bar: 123 });

        // @ts-ignore
        const obj6 = validate({ foo: "123", bar: "456" }, { foo: String }, "obj6", {
            warnings,
            removeUnknownProps: true,
        });
        assert.deepStrictEqual(obj6, { foo: "123" });

        assert.deepStrictEqual(warnings, [
            {
                path: "obj1",
                message: "obj1 is deprecated: no longer effect",
            },
            {
                path: "obj2.foo",
                message: "obj2.foo is deprecated: use 'bar' instead",
            },
            {
                path: "obj3.foo",
                message: "obj3.foo is deprecated",
            },
            {
                path: "obj4.foo",
                message: "obj4.foo is deprecated: use 'bar' instead",
            },
            {
                path: "obj4.bar",
                message: "obj4.bar is deprecated",
            },
            {
                path: "obj5.foo",
                message: "a number at obj5.foo has been converted to string",
            },
            {
                path: "obj5.bar",
                message: "a string at obj5.bar has been converted to number",
            },
            {
                path: "obj6.bar",
                message: "unknown property obj6.bar bas been removed",
            }
        ] as ValidationWarning[]);
    });

    it("should silence property removing when suppressed", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const obj1 = validate({ foo: "123", bar: "456" }, { foo: String }, "obj1", {
            warnings,
            removeUnknownProps: true,
            suppress: true,
        });
        assert.deepStrictEqual(obj1, { foo: "123" });

        // @ts-ignore
        const obj2 = validate({
            // @ts-ignore
            foo: { foo: "123", bar: "456" }, bar: "123"
        }, { foo: { bar: String } }, "obj6", {
            warnings,
            removeUnknownProps: true,
            suppress: true,
        });
        assert.deepStrictEqual(obj2, { foo: { bar: "456" } });

        assert.deepStrictEqual(warnings, []);
    });

    it("should validate object literals against the alternative keyword", () => {
        const obj1 = validate({ foo: "hello, world!" }, {
            foo: String.optional.alternatives("bar"),
            bar: String.optional,
        }, "obj1");
        assert.deepStrictEqual(obj1, { foo: "hello, world!" });

        const obj2 = validate({ bar: "hello, world!" }, {
            foo: String.optional.alternatives("bar"),
            bar: String.optional,
        }, "obj1");
        assert.deepStrictEqual(obj2, { bar: "hello, world!" });

        // @ts-ignore
        const [err1] = _try(() => validate({}, {
            foo: String.optional.alternatives("bar"),
            bar: String.optional,
        }, "obj3"));
        assert.strictEqual(
            String(err1),
            "Error: obj3 must contain one of these properties: 'foo', 'bar'"
        );
    });

    it("should validate object literals against the associative keyword", () => {
        const obj1 = validate({}, {
            foo: String.optional.associates("foo1"),
            bar: String.optional,
            foo1: String.optional,
        }, "obj1");
        assert.deepStrictEqual(obj1, {});

        const obj2 = validate({ bar: "hello, world!" }, {
            foo: String.optional.associates("foo1"),
            bar: String.optional,
            foo1: String.optional,
        }, "obj2");
        assert.deepStrictEqual(obj2, { bar: "hello, world!" });

        const obj3 = validate({ foo: "hello", foo1: "world" }, {
            foo: String.optional.associates("foo1"),
            bar: String.optional,
            foo1: String.optional,
        }, "obj3");
        assert.deepStrictEqual(obj3, { foo: "hello", foo1: "world" });

        const [err1] = _try(() => validate({ foo: "hello", bar: "world" }, {
            foo: String.optional.associates("foo1"),
            bar: String.optional,
            foo1: String.optional,
        }, "obj4"));
        assert.strictEqual(
            String(err1),
            "Error: obj4 must contain property 'foo1' when property 'foo' is given"
        );
    });

    it("should suppress non-critical errors as warnings", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const obj1 = validate({}, {
            foo: String.optional.alternatives("bar"),
            bar: String.optional,
        }, "obj1", { warnings, suppress: true });
        assert.deepStrictEqual(obj1, {});

        // @ts-ignore
        const obj2 = validate({ foo: "hello", bar: "world" }, {
            foo: String.optional.associates("foo1"),
            bar: String.optional,
            foo1: String.optional,
        }, "obj2", { warnings, suppress: true });

        assert.deepStrictEqual(warnings, [
            {
                path: "obj1",
                message: "obj1 must contain one of these properties: 'foo', 'bar'",
            },
            {
                path: "obj2",
                message: "obj2 must contain property 'foo1' when property 'foo' is given",
            }
        ] as ValidationWarning[]);
    });
});
