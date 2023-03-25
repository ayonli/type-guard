import * as assert from "node:assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { Any, validate, ValidationWarning } from "..";

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
        const arr1 = validate(["hello", "world"], [String], "arr1");
        assert.deepStrictEqual(arr1, ["hello", "world"]);

        const arr2 = validate([1, 2, 3], [Number], "arr2");
        assert.deepStrictEqual(arr2, [1, 2, 3]);

        const arr3 = validate([true, false], [Boolean], "arr3");
        assert.deepStrictEqual(arr3, [true, false]);

        const date = new Date();
        const arr4 = validate([date], [Date], "arr4");
        assert.deepStrictEqual(arr4, [date]);

        const obj1 = { foo: "hello", bar: 123 };
        const obj2 = { foo: "world", bar: 456 };
        const arr5 = validate([obj1, obj2], [{ foo: String, bar: Number }], "arr5");
        assert.deepStrictEqual(arr5, [obj1, obj2]);

        const buf = Buffer.from("hello, world!");
        const arr6 = validate(["hello", 1, true, date, buf, obj1, obj2], [Any], "arr6");
        assert.deepStrictEqual(arr6, ["hello", 1, true, date, buf, obj1, obj2]);

        const arr7 = validate([], [String], "arr7");
        assert.deepStrictEqual(arr7, []);
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
        const [err4] = _try(() => validate([{ foo: "hello" }], Array({
            foo: String,
            bar: Number,
        }), "arr"));
        assert.strictEqual(
            String(err4),
            "Error: arr[0].bar is required, but no value is given"
        );

        // @ts-ignore
        const [err5] = _try(() => validate([{ foo: "hello" }], [{
            foo: String,
            bar: Number,
        }], "arr"));
        assert.strictEqual(
            String(err5),
            "Error: arr[0].bar is required, but no value is given"
        );
    });

    it("should validate arrays with length limits", () => {
        const arr0 = validate(["hello", "world"], [String].minItems(1).maxItems(2), "arr0");
        assert.deepStrictEqual(arr0, ["hello", "world"]);

        const [err1] = _try(() => validate([], Array.minItems(1), "arr1"));
        assert.strictEqual(String(err1), "RangeError: arr1 is expected to contain at least 1 item");

        const [err2] = _try(() => validate([], [].minItems(2), "arr2"));
        assert.strictEqual(String(err2), "RangeError: arr2 is expected to contain at least 2 items");

        const [err3] = _try(() => validate(["hello", "world", 1, 2], Array.maxItems(1), "arr3"));
        assert.strictEqual(String(err3), "RangeError: arr3 is expected to contain no more than 1 item");

        const [err4] = _try(() => validate([
            "hello",
            "world",
            1,
            2
        ], [String, Number].maxItems(2), "arr3"));
        assert.strictEqual(String(err4), "RangeError: arr3 is expected to contain no more than 2 items");
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
