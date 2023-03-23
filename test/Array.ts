import * as assert from "node:assert";
import { describe, it } from "mocha";
import { validate, ValidationWarning } from "..";

describe("Object", () => {
    it("should validate array as any type of elements", () => {
        const arr1 = validate([], Array, "arr1");
        assert.deepStrictEqual(arr1, []);

        // @ts-ignore
        const arr2 = validate(null, Array.optional, "arr2");
        assert.strictEqual(arr2, null);

        // @ts-ignore
        const arr3 = validate(null, Array.default([]), "arr3");
        assert.deepStrictEqual(arr3, []);

        const arr = ["hello", "world", 1, 2, true];
        const arr4 = validate(arr, Array, "arr4");
        assert.deepStrictEqual(arr4, arr);

        let err1: any;
        try {
            // @ts-ignore
            validate(null, Array, "arr");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "Error: arr is required, but no value is provided"
            );
        }
        assert(err1 instanceof Error);

        let err2: any;
        try {
            // @ts-ignore
            validate("hello, world!", Array, "arr");
        } catch (err) {
            err2 = err;
            assert.strictEqual(
                String(err),
                "TypeError: arr is expected to be an array, but a string is given"
            );
        }
        assert(err2 instanceof TypeError);
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

        const arr6 = validate([], [String], "arr6");
        assert.deepStrictEqual(arr6, []);

        const _arr7 = ["hello", "world", 1, 2, true];
        const arr7 = validate(_arr7, [] as any[], "arr7");
        assert.deepStrictEqual(arr7, _arr7);

        const _arr8 = ["hello", "world"];
        const arr8 = validate(_arr8, Array(String), "arr8");
        assert.deepStrictEqual(arr8, _arr8);

        let err1: any;
        try {
            // @ts-ignore
            validate("hello, world", [String], "arr");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "TypeError: arr is expected to be an array, but a string is given"
            );
        }
        assert(err1 instanceof TypeError);

        let err2: any;
        try {
            // @ts-ignore
            validate([{}], [String], "arr");
        } catch (err) {
            err2 = err;
            assert.strictEqual(
                String(err),
                "TypeError: arr[0] is expected to be a string, but an object is given"
            );
        }
        assert(err2 instanceof TypeError);

        let err3: any;
        try {
            // @ts-ignore
            validate([{}], [String, Number], "arr");
        } catch (err) {
            err3 = err;
            assert.strictEqual(
                String(err),
                "TypeError: arr[0] is expected to be a string or number, but an object is given"
            );
        }
        assert(err3 instanceof TypeError);
    });

    it("should validate arrays with length limits", () => {
        const arr0 = validate(["hello", "world"], [String].minItems(1).maxItems(2), "arr0");
        assert.deepStrictEqual(arr0, ["hello", "world"]);

        let err1: any;
        try {
            validate([], Array.minItems(1), "arr1");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "Error: arr1 must contain at least 1 item"
            );
        }
        assert(err1 instanceof Error);

        let err2: any;
        try {
            validate([], [].minItems(2), "arr2");
        } catch (err) {
            err2 = err;
            assert.strictEqual(
                String(err),
                "Error: arr2 must contain at least 2 items"
            );
        }
        assert(err2 instanceof Error);

        let err3: any;
        try {
            validate(["hello", "world", 1, 2], Array.maxItems(1), "arr3");
        } catch (err) {
            err3 = err;
            assert.strictEqual(
                String(err),
                "Error: arr3 must contain no more than 1 item"
            );
        }
        assert(err3 instanceof Error);

        let err4: any;
        try {
            validate(["hello", "world", 1, 2], [String, Number].maxItems(2), "arr3");
        } catch (err) {
            err4 = err;
            assert.strictEqual(
                String(err),
                "Error: arr3 must contain no more than 2 items"
            );
        }
        assert(err4 instanceof Error);
    });

    it("should validate the arrays with unique constraint", () => {
        const arr = validate(["hello", "world"], [String].uniqueItems, "arr");
        assert.deepStrictEqual(arr, ["hello", "world"]);

        let err1: any;
        try {
            validate(["hello", "hello"], [String].uniqueItems, "arr1");
        } catch (err) {
            err1 = err;
            assert.strictEqual(
                String(err),
                "Error: arr1 must contain unique items"
            );
        }
        assert(err1 instanceof Error);
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

    it("should suppress errors as warnings", () => {
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
                message: "arr1 must contain no more than 5 items",
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
