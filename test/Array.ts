import * as assert from "node:assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { Any, as, validate, ValidationWarning } from "..";

describe("Array", () => {
    it("should validate arrays of Any type of items", () => {
        const arr1 = validate([], Array, "arr1");
        assert.deepStrictEqual(arr1, []);

        const arr2 = validate([], [], "Arr2");
        assert.deepStrictEqual(arr2, []);

        const date = new Date();
        const buf = Buffer.from("hello, world!");
        const arr3 = validate(["hello", 1, true, date, buf], Array, "arr3");
        assert.deepStrictEqual(arr3, ["hello", 1, true, date, buf]);

        const arr4 = validate(["hello", 1, true, date, buf], [] as any[], "arr4");
        assert.deepStrictEqual(arr4, ["hello", 1, true, date, buf]);
    });

    it("should report error when the value is not provided", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, Array, "arr"));
        assert.strictEqual(String(err1), "Error: arr is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate(void 0, [], "arr"));
        assert.strictEqual(String(err2), "Error: arr is required, but no value is given");
    });

    it("should validate optional arrays", () => {
        // @ts-ignore
        const arr1 = validate(null, Array.optional, "arr1");
        assert.strictEqual(arr1, null);

        // @ts-ignore
        const aar2 = validate(void 0, [].optional, "arr2");
        assert.deepStrictEqual(aar2, void 0);
    });

    it("should validate arrays with default values", () => {
        const arr = [];
        // @ts-ignore
        const arr1 = validate(null, Array.default(arr), "arr1");
        assert.strictEqual(arr1, arr);

        // @ts-ignore
        const aar2 = validate(void 0, [].default(arr), "arr2");
        assert.deepStrictEqual(aar2, arr);
    });

    it("should validate structures of array literals", () => {
        const arr = validate(["hello", "world"], [String], "arr");
        assert.deepStrictEqual(arr, ["hello", "world"]);

        // @ts-ignore
        const arr1 = validate(null, [].optional, "arr1");
        assert.strictEqual(arr1, null);

        // @ts-ignore
        const arr2 = validate(null, [].default(["hello", "world"]), "arr2");
        assert.deepStrictEqual(arr2, ["hello", "world"]);

        const arr3 = validate(["hello", "world", 1, 2], [String, Number], "arr3");
        assert.deepStrictEqual(arr3, ["hello", "world", 1, 2]);

        const arr4 = validate([["hello", 1], ["world", 2]], [[String, Number]], "arr4");
        assert.deepStrictEqual(arr4, [["hello", 1], ["world", 2]]);

        const arr5 = validate([["hello", "world"], [1, 2]], [[String], [Number]], "arr4");
        assert.deepStrictEqual(arr5, [["hello", "world"], [1, 2]]);

        const date = new Date();
        const buf = Buffer.from("hello, world!");
        const arr6 = validate(["hello", 1, true, date, buf], [Any], "arr6");
        assert.deepStrictEqual(arr6, ["hello", 1, true, date, buf]);

        const arr7 = validate([], [String], "arr7");
        assert.deepStrictEqual(arr7, []);

        const arr8 = validate([
            // @ts-ignore
            { foo: "hello", bar: 123 },
            // @ts-ignore
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
    });

    it("should validate arrays defined by Array constructor as generics", () => {
        const arr1 = validate(["hello", "world"], Array(String), "arr1");
        assert.deepStrictEqual(arr1, ["hello", "world"]);

        const arr2 = validate([1, 2, 3], Array(Number), "arr2");
        assert.deepStrictEqual(arr2, [1, 2, 3]);

        const arr3 = validate([true, false], Array(Boolean), "arr3");
        assert.deepStrictEqual(arr3, [true, false]);

        const date = new Date();
        const arr4 = validate([date], Array(Date), "arr4");
        assert.deepStrictEqual(arr4, [date]);

        const buf = Buffer.from("hello, world!");
        const arr5 = validate(["hello", 1, true, date, buf], Array(Any), "arr3");
        assert.deepStrictEqual(arr5, ["hello", 1, true, date, buf]);

        const arr6 = validate([{ foo: "hello", bar: 123 }], Array({
            foo: String,
            bar: Number,
        }), "arr6");
        assert.deepStrictEqual(arr6, [{ foo: "hello", bar: 123 }]);
    });

    it("should report errors occurred in arrays", () => {
        // @ts-ignore
        const [err1] = _try(() => validate("hello, world", [String], "arr"));
        assert.strictEqual(
            String(err1),
            "TypeError: arr is expected to be an array, but a string is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate([{}], [String], "arr"));
        assert.strictEqual(
            String(err2),
            "TypeError: arr[0] is expected to be a string, but an object is given"
        );

        // @ts-ignore
        const [err3] = _try(() => validate([{}], [String, Number], "arr"));
        assert.strictEqual(
            String(err3),
            "TypeError: arr[0] is expected to be a string or number, but an object is given"
        );

        // @ts-ignore
        const [err4] = _try(() => validate([{ foo: "hello" }], Array({
            foo: String,
            bar: Number,
        }), "arr"));
        assert.strictEqual(
            String(err4),
            "Error: arr[0].bar is required, but no value is given"
        );

        const [err5] = _try(() => validate([
            // @ts-ignore
            { foo: "hello", bar: 123 },
            // @ts-ignore
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
            "TypeError: arr[1].bar1 is expected to be of type Date, but a string is given"
        );

        const [err6] = _try(() => validate([
            "hello",
            "world",
            { foo: "hello", bar: 123 },
            // @ts-ignore
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
            // @ts-ignore
            { foo: "world", bar: 345 },
            "hello",
            // @ts-ignore
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
            // @ts-ignore
            { foo: "world", bar: "Not a number" },
            "hello",
            // @ts-ignore
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
            // @ts-ignore
            { foo: "world" },
            "hello",
            // @ts-ignore
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
            // @ts-ignore
            null,
            // @ts-ignore
            { foo: "world" },
            "hello",
            // @ts-ignore
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
            // @ts-ignore
            { foo: "world" },
            "hello",
            // @ts-ignore
            null,
            // @ts-ignore
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
            // @ts-ignore
            { foo: "world", bar: 123 },
            "hello",
            // @ts-ignore
            null,
            // @ts-ignore
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
            // @ts-ignore
            { foo: "world", bar: 123 },
            "hello",
            // @ts-ignore
            Buffer.from("hello, world!"),
            // @ts-ignore
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
            // @ts-ignore
            { foo: "world", bar: 123 },
            "hello",
            // @ts-ignore
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
            // @ts-ignore
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

    it("should validate arrays with length limits", () => {
        const arr0 = validate(["hello", "world"], [String].minItems(1).maxItems(2), "arr0");
        assert.deepStrictEqual(arr0, ["hello", "world"]);

        const [err1] = _try(() => validate([], Array.minItems(1), "arr1"));
        assert.strictEqual(String(err1), "Error: arr1 is expected to contain at least 1 item");

        const [err2] = _try(() => validate([], [].minItems(2), "arr2"));
        assert.strictEqual(String(err2), "Error: arr2 is expected to contain at least 2 items");

        const [err3] = _try(() => validate(["hello", "world", 1, 2], Array.maxItems(1), "arr3"));
        assert.strictEqual(String(err3), "Error: arr3 is expected to contain no more than 1 item");

        const [err4] = _try(() => validate([
            "hello",
            "world",
            1,
            2
        ], [String, Number].maxItems(2), "arr3"));
        assert.strictEqual(String(err4), "Error: arr3 is expected to contain no more than 2 items");
    });

    it("should validate the arrays with unique constraint", () => {
        const arr = validate(["hello", "world"], [String].uniqueItems, "arr");
        assert.deepStrictEqual(arr, ["hello", "world"]);

        const [err1] = _try(() => validate(["hello", "hello"], [String].uniqueItems, "arr1"));
        assert.strictEqual(String(err1), "Error: arr1 is expected to contain unique items");
    });

    it("should emit various warnings", () => {
        const warnings: ValidationWarning[] = [];

        const arr1 = validate([], Array.deprecated("no longer effect"), "arr1", { warnings });
        assert.deepStrictEqual(arr1, []);

        const arr2 = validate([], Array.deprecated(), "arr2", { warnings });
        assert.deepStrictEqual(arr2, []);

        // @ts-ignore
        const arr3 = validate(["123"], [Number], "arr3", { warnings });
        assert.deepStrictEqual(arr3, [123]);

        const arr4 = validate([1, 2, 3, 4, 5, 6], [Number].maxItems(5), "arr4", {
            warnings,
            removeUnknownProps: true,
        });
        assert.deepStrictEqual(arr4, [1, 2, 3, 4, 5]);

        const arr5 = validate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [Number].maxItems(5), "arr5", {
            warnings,
            removeUnknownProps: true,
        });
        assert.deepStrictEqual(arr5, [1, 2, 3, 4, 5]);

        assert.deepStrictEqual(warnings, [
            {
                path: "arr1",
                message: "arr1 is deprecated: no longer effect",
            },
            {
                path: "arr2",
                message: "arr2 is deprecated",
            },
            {
                path: "arr3[0]",
                message: "a string at arr3[0] has been converted to number",
            },
            {
                path: "arr4",
                message: "outranged element arr4[5] has been removed",
            },
            {
                path: "arr5",
                message: "outranged elements arr5[5...9] have been removed",
            }
        ] as ValidationWarning[]);
    });

    it("should silence element removing when suppressed", () => {
        const warnings: ValidationWarning[] = [];

        const arr1 = validate([1, 2, 3, 4, 5, 6], [Number].maxItems(5), "arr4", {
            warnings,
            removeUnknownProps: true,
            suppress: true,
        });
        assert.deepStrictEqual(arr1, [1, 2, 3, 4, 5]);

        const arr2 = validate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [Number].maxItems(5), "arr5", {
            warnings,
            removeUnknownProps: true,
            suppress: true,
        });
        assert.deepStrictEqual(arr2, [1, 2, 3, 4, 5]);

        assert.deepStrictEqual(warnings, []);
    });

    it("should suppress non-critical errors as warnings", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const arr1 = validate([1, 2, 3, 4, 5, 6], [Number].maxItems(5), "arr1", {
            warnings,
            suppress: true,
        });
        assert.deepStrictEqual(arr1, [1, 2, 3, 4, 5, 6]);

        assert.deepStrictEqual(warnings, [
            {
                path: "arr1",
                message: "arr1 is expected to contain no more than 5 items",
            }
        ] as ValidationWarning[]);
    });

    it("should validate arrays with a custom guard function", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const arr1 = validate("hello,world", [String].guard((data, path, warnings) => {
            const arr = Array.isArray(data) ? data : String(data).split(",");

            if (arr !== data) {
                warnings.push({
                    path,
                    message: `a ${typeof data} has been converted to Array at ${path}`,
                });
            }

            return arr;
        }), "arr1", { warnings });
        assert.deepStrictEqual(arr1, ["hello", "world"]);

        assert.deepStrictEqual(warnings, [
            {
                path: "arr1",
                message: `a string has been converted to Array at arr1`,
            }
        ] as ValidationWarning[]);
    });
});
