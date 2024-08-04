import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "@ayonli/jsext/try";
import { as, validate, ValidationWarning, Void } from "../src";

describe("UnionType", () => {
    it("should validate values of union types with as() function", () => {
        // @ts-ignore
        const value1 = validate("hello, world!", as(String, Number, Boolean), "str");
        assert.strictEqual(value1, "hello, world!");

        const value2 = validate(123, as(String, Number, Boolean), "value2");
        assert.strictEqual(value2, 123);

        const value3 = validate(true, as(String, Number, Boolean), "value3");
        assert.strictEqual(value3, true);

        const date = new Date();
        const value4 = validate(date, as(String, Number, Boolean, Date), "value3");
        assert.strictEqual(value4, date);

        const obj = { foo: "hello", bar: "world" };
        const value5 = validate(obj, as(String, { foo: String, bar: String }), "value3");
        assert.deepStrictEqual(value5, obj);

        const value6 = validate("hello, world!", as(String, { foo: String, bar: String }), "value3");
        assert.deepStrictEqual(value6, "hello, world!");

        const [err1] = _try(() => validate(null, as(String, Number), "value"));
        assert.strictEqual(String(err1), "Error: value is required, but no value is given");

        const buf = Buffer.from("hello, world!");
        const [err2] = _try(() => validate(buf, as(String, Number), "value"));
        assert.strictEqual(
            String(err2),
            "TypeError: value is expected to be a string or number, but a Buffer is given"
        );
    });

    it("should validate optional value of union type", () => {
        const value = validate(null, as(String, Number).optional, "value");
        assert.strictEqual(value, null);
    });

    it("should validate value of union type with default value", () => {
        const value = validate(null, as(String, Number).default("hello, world!"), "value");
        assert.strictEqual(value, "hello, world!");
    });

    it("should validate null against union type with Void", () => {
        const nil1 = validate(void 0, as(String, Number, Void), "nill");
        assert.strictEqual(nil1, void 0);

        const nil2 = validate(null, as(String, Number, Void), "nill");
        assert.strictEqual(nil2, null);
    });

    it("should validate arrays of union types", () => {
        const arr1 = validate(["hello", "world", 1, 2], [String, Number], "arr1");
        assert.deepStrictEqual(arr1, ["hello", "world", 1, 2]);

        const arr2 = validate([["hello", 1], ["world", 2]], [[String, Number]], "arr2");
        assert.deepStrictEqual(arr2, [["hello", 1], ["world", 2]]);

        const arr3 = validate([["hello", "world"], [1, 2]], [[String], [Number]], "arr3");
        assert.deepStrictEqual(arr3, [["hello", "world"], [1, 2]]);

        const date = new Date();
        const arr8 = validate([
            { foo: "hello", bar: 123 },
            { foo1: true, bar1: date },
        ], [{
            foo: String,
            bar: Number
        }, {
            foo1: Boolean,
            bar1: Date,
        }], "arr8");
        assert.deepStrictEqual(arr8, [
            { foo: "hello", bar: 123 },
            { foo1: true, bar1: date },
        ]);

        const [err3] = _try(() => validate([{}], [String, Number], "arr"));
        assert.strictEqual(
            String(err3),
            "TypeError: arr[0] is expected to be a string or number, but an object is given"
        );

        const [err5] = _try(() => validate([
            { foo: "hello", bar: 123 },
            { foo1: true, bar1: "Not a date" },
        ], [{
            foo: String,
            bar: Number
        }, {
            foo1: Boolean,
            bar1: Date,
        }], "arr"));
        assert.strictEqual(
            String(err5),
            "TypeError: arr[1].bar1 is expected to be a Date, but a string is given"
        );

        const [err6] = _try(() => validate([
            "hello",
            "world",
            { foo: "hello", bar: 123 },
            { foo: "world", bar: "Not a Number" },
        ], [String, {
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err6),
            "TypeError: arr[3].bar is expected to be a number, but a string is given"
        );

        const [err7] = _try(() => validate([
            { foo: "hello", bar: 123 },
            { foo: "world", bar: 345 },
            "hello",
            Buffer.from("world"),
        ], [String, {
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err7),
            "TypeError: arr[3] is expected to be a string or object, but a Buffer is given"
        );

        const [err8] = _try(() => validate([
            { foo: "hello", bar: 123 },
            { foo: "world", bar: "Not a number" },
            "hello",
            { foo: "world", bar: 345 },
        ], [String, {
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err8),
            "TypeError: arr[1].bar is expected to be a number, but a string is given"
        );

        const [err9] = _try(() => validate([
            { foo: "hello", bar: 123 },
            { foo: "world" },
            "hello",
            { foo: "world", bar: 345 },
        ], [String, {
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err9),
            "Error: arr[1].bar is required, but no value is given"
        );

        const [err10] = _try(() => validate([
            null,
            { foo: "world" },
            "hello",
            { foo: "world", bar: 345 },
        ], [String, {
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err10),
            "Error: arr[0] is required, but no value is given"
        );

        const [err11] = _try(() => validate([
            { foo: "world" },
            "hello",
            null,
            { foo: "world", bar: 345 },
        ], [String, {
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err11),
            "Error: arr[0].bar is required, but no value is given"
        );

        const [err12] = _try(() => validate([
            { foo: "world", bar: 123 },
            "hello",
            null,
            { foo: "world", bar: 345 },
        ], [String, {
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err12),
            "Error: arr[2] is required, but no value is given"
        );

        const [err13] = _try(() => validate([
            { foo: "world", bar: 123 },
            "hello",
            Buffer.from("hello, world!"),
            { foo: "world" },
        ], [String, {
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err13),
            "TypeError: arr[2] is expected to be a string or object, but a Buffer is given"
        );

        const [err14] = _try(() => validate([
            { foo: "world", bar: 123 },
            "hello",
            { foo: "world", bar: Buffer.from([1, 2, 3]) },
        ], [String, {
            foo: String,
            bar: as(Number, String),
        }], "arr"));
        assert.strictEqual(
            String(err14),
            "TypeError: arr[2].bar is expected to be a number or string, but a Buffer is given"
        );

        const [err15] = _try(() => validate([
            "hello",
            { foo: "world", bar: [Buffer.from([1, 2, 3])] },
        ], [String, {
            foo: String,
            bar: [Number, String],
        }], "arr"));
        assert.strictEqual(
            String(err15),
            "TypeError: arr[1].bar[0] is expected to be a number or string, but a Buffer is given"
        );
    });

    it("should validate union types of constant values", () => {
        const value1 = validate("hello", as("hello" as const, "world" as const), "value1");
        assert.strictEqual(value1, "hello");

        const _value1 = validate(void 0,
            as("hello" as const, "world" as const).optional,
            "value1");
        assert.strictEqual(_value1, void 0);

        const __value1 = validate(void 0,
            as("hello" as const, "world" as const).default("hello"),
            "value1");
        assert.strictEqual(__value1, "hello");

        const [err1] = _try(() => validate("hi", as("hello" as const, "world" as const), "value1"));
        assert.strictEqual(
            String(err1),
            "TypeError: value1 is expected to be 'hello' or 'world', but 'hi' is given"
        );

        const value2 = validate(1, as(1 as const, 2 as const), "value2");
        assert.strictEqual(value2, 1);

        const _value2 = validate(void 0, as(1 as const, 2 as const).optional, "value2");
        assert.strictEqual(_value2, void 0);

        const __value2 = validate(void 0, as(1 as const, 2 as const).default(1), "value2");
        assert.strictEqual(__value2, 1);

        const [err2] = _try(() => validate(3, as(1 as const, 2 as const), "value2"));
        assert.strictEqual(
            String(err2),
            "TypeError: value2 is expected to be 1 or 2, but 3 is given"
        );

        const value3 = validate(1n, as(1n as const, 2n as const), "value3");
        assert.strictEqual(value3, 1n);

        const _value3 = validate(void 0, as(1n as const, 2n as const).optional, "value3");
        assert.strictEqual(_value3, void 0);

        const __value3 = validate(void 0, as(1n as const, 2n as const).default(1n), "value3");
        assert.strictEqual(__value3, 1n);

        const [err3] = _try(() => validate(3n, as(1n as const, 2n as const), "value3"));
        assert.strictEqual(
            String(err3),
            "TypeError: value3 is expected to be 1 or 2, but 3 is given"
        );

        const value4 = validate(true, as(true as const, false as const), "value4");
        assert.strictEqual(value4, true);

        const _value4 = validate(void 0, as(true as const, false as const).optional, "value4");
        assert.strictEqual(_value4, void 0);

        const __value4 = validate(void 0, as(true as const, false as const).default(true), "value4");
        assert.strictEqual(__value4, true);

        const [err4] = _try(() => validate("yes", as(true as const, false as const), "value4"));
        assert.strictEqual(
            String(err4),
            "TypeError: value4 is expected to be true or false, but a string is given"
        );
    });

    it("should emit various warnings", () => {
        const warnings: ValidationWarning[] = [];

        const value1 = validate(
            "hello, world!",
            as(String, Number, Void).deprecated("will no longer effect"),
            "value1",
            {
                warnings,
            }
        );
        assert.deepStrictEqual(value1, "hello, world!");

        const value2 = validate(123, as(String, Number).deprecated(), "value2", { warnings });
        assert.deepStrictEqual(value2, 123);

        const date = new Date();
        const value3 = validate(date, as(String, Number), "value3", { warnings });
        assert.strictEqual(value3, date.toISOString());

        const value4 = validate([
            1,
            "2",
            3,
            "4",
            "hello",
            "world"
        ], [Number, String].maxItems(5), "value4", {
            warnings,
            removeUnknownItems: true,
        });
        assert.deepStrictEqual(value4, [1, "2", 3, "4", "hello"]);

        const value5 = validate([
            1,
            "2",
            3,
            "4",
            "hello",
            "world",
            5,
            6,
        ], [Number, String].maxItems(5), "value5", {
            warnings,
            removeUnknownItems: true,
        });
        assert.deepStrictEqual(value5, [1, "2", 3, "4", "hello"]);

        const value6 = validate([
            { foo: "hello", bar: "123" },
            { foo1: true, bar1: date.valueOf() },
            { foo1: true, bar1: date.toISOString() },
        ], [{
            foo: String,
            bar: Number
        }, {
            foo1: Boolean,
            bar1: Date,
        }], "value6", { warnings });
        assert.deepStrictEqual(value6, [
            { foo: "hello", bar: 123 },
            { foo1: true, bar1: date },
            { foo1: true, bar1: date },
        ]);

        assert.deepStrictEqual(warnings, [
            {
                path: "value1",
                message: "value1 is deprecated: will no longer effect"
            },
            {
                path: "value2",
                message: "value2 is deprecated"
            },
            {
                path: "value3",
                message: "a Date at value3 has been converted to string"
            },
            {
                path: "value4",
                message: "outranged element value4[5] has been removed"
            },
            {
                path: "value5",
                message: "outranged elements value5[5...7] have been removed"
            },
            {
                path: "value6[0].bar",
                message: "a string at value6[0].bar has been converted to number"
            },
            {
                path: "value6[1].bar1",
                message: "a number at value6[1].bar1 has been converted to Date"
            }
        ] as ValidationWarning[]);
    });
});
