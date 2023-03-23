import * as assert from "node:assert";
import { describe, it } from "mocha";
import { as, validate, ValidationWarning } from "..";

describe("Object", () => {
    it("should validate objects as mixed type of values", () => {
        const obj1 = validate({}, Object, "obj1");
        assert.deepStrictEqual(obj1, {});

        // @ts-ignore
        const obj2 = validate(null, Object.optional, "obj2");
        assert.strictEqual(obj2, null);

        // @ts-ignore
        const obj3 = validate(null, Object.default({}), "obj3");
        assert.deepStrictEqual(obj3, {});

        const buf = Buffer.from([]);
        const obj4 = validate(buf, Object, "obj4");
        assert.strictEqual(obj4, buf);

        const obj = { foo: "hello", bar: "world" };
        const obj5 = validate(obj, Object, "obj4");
        assert.strictEqual(obj5, obj);

        let err1: any;
        try {
            // @ts-ignore
            validate(null, Object, "obj");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "Error: obj is required, but no value is provided"
            );
        }
        assert(err1 instanceof Error);

        let err2: any;
        try {
            // @ts-ignore
            validate("hello, world!", Object, "obj");
        } catch (err) {
            err2 = err;
            assert.strictEqual(
                String(err),
                "TypeError: obj is expected to be an object, but a string is given"
            );
        }
        assert(err2 instanceof TypeError);
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

        let err1: any;
        try {
            // @ts-ignore
            validate({}, { str: String, str1: String.optional }, "obj");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "Error: obj.str is required, but no value is provided"
            );
        }
        assert(err1 instanceof Error);

        let err2: any;
        try {
            // @ts-ignore
            validate(null, { str: String, str1: String.optional }, "obj");
        } catch (err) {
            err2 = err;
            assert.strictEqual(
                String(err),
                "Error: obj is required, but no value is provided"
            );
        }
        assert(err2 instanceof Error);

        let err3: any;
        try {
            // @ts-ignore
            const obj3 = validate({ foo: {} }, {
                foo: {
                    foo1: String,
                    bar1: Number.optional,
                },
                bar: Number.optional,
            }, "obj");
            assert.deepStrictEqual(obj3, { foo: { foo1: "hello, world!" } });
        } catch (err) {
            err3 = err;
            assert.strictEqual(
                String(err),
                "Error: obj.foo.foo1 is required, but no value is provided"
            );
        }
        assert(err3 instanceof Error);

        let err4: any;
        try {
            // @ts-ignore
            validate("hello, world!", { foo: String, bar: Number }, "obj");
        } catch (err) {
            err4 = err;
            assert.strictEqual(
                String(err),
                "TypeError: obj is expected to be an object, but a string is given"
            );
        }
        assert(err4 instanceof TypeError);

        let err5: any;
        try {
            // @ts-ignore
            validate({ foo: {} }, { foo: String }, "obj");
        } catch (err) {
            err5 = err;
            assert.strictEqual(
                String(err),
                "TypeError: obj.foo is expected to be a string, but an object is given"
            );
        }
        assert(err5 instanceof TypeError);
    });

    it("should emit warnings", () => {
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
            }
        ] as ValidationWarning[]);
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

        let err1: any;
        try {
            // @ts-ignore
            validate({}, {
                foo: String.optional.alternatives("bar"),
                bar: String.optional,
            }, "obj3");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "Error: obj3 must contain one of these properties: 'foo', 'bar'"
            );
        }
        assert(err1 instanceof Error);
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

        let err1: any;
        try {
            validate({ foo: "hello", bar: "world" }, {
                foo: String.optional.associates("foo1"),
                bar: String.optional,
                foo1: String.optional,
            }, "obj4");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "Error: obj4 must contain property 'foo1' when property 'foo' is provided"
            );
        }
        assert(err1 instanceof Error);
    });
});
