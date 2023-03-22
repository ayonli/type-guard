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

    it("should emit warnings", () => {
        const warnings: ValidationWarning[] = [];

        const arr1 = validate([], Array.deprecated("no longer effect"), "arr1", { warnings });
        assert.deepStrictEqual(arr1, []);

        const arr2 = validate([], Array.deprecated(), "arr2", { warnings });
        assert.deepStrictEqual(arr2, []);

        // @ts-ignore
        const arr3 = validate(["123"], [Number], "arr3", { warnings });
        assert.deepStrictEqual(arr3, [123]);

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
            }
        ] as ValidationWarning[]);
    });
});
