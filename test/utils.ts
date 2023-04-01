import "@hyurl/utils/types";
import * as assert from "assert";
import _try from "dotry";
import { describe, it } from "mocha";
import { Dict, ensured, optional, partial, required, validate } from "..";

describe("utils", () => {
    describe("partial()", () => {
        it("should repack a type definition with all properties optional", () => {
            const Type = {
                str: String,
                num: Number.optional,
            };
            const NewType1 = partial(Type);
            const obj = validate({}, NewType1, "obj");
            assert.deepEqual(obj, {});
        });

        it("should work with StringEnum", () => {
            const Type = Dict(String.enum(["foo", "bar"] as const), String);
            const NewType = partial(Type);
            const obj = validate({}, NewType, "obj");
            assert.deepEqual(obj, {});
        });
    });

    describe("required()", () => {
        it("should repack a type definition with all properties required", () => {
            const Type = {
                str: String,
                num: Number.optional,
            };
            const NewType = required(Type);
            const obj = validate({ str: "hello, world!", num: 123 }, NewType, "obj");
            assert.deepEqual(obj, { str: "hello, world!", num: 123 });

            // @ts-ignore
            const [err1] = _try(() => validate({}, NewType, "obj"));
            assert.strictEqual(
                String(err1),
                "Error: obj.str is required, but no value is given"
            );

            const [err2] = _try(() => validate({ str: "hello, world!" }, NewType, "obj"));
            assert.strictEqual(
                String(err2),
                "Error: obj.num is required, but no value is given"
            );
        });
    });

    describe("optional()", () => {
        it("should pick the properties to be optional", () => {
            const Type = {
                str: String,
                num: Number,
            };
            const NewType = optional(Type, ["num"]);
            const obj = validate({ str: "hello, world!" }, NewType, "obj");
            assert.deepStrictEqual(obj, { str: "hello, world!" });

            const [err1] = _try(() => validate({}, NewType, "obj"));
            assert.deepStrictEqual(
                String(err1),
                "Error: obj.str is required, but no value is given"
            );
        });
    });

    describe("ensured()", () => {
        it("should pick the properties to be required", () => {
            const Type = {
                str: String.optional,
                num: Number.optional,
            };
            const NewType = ensured(Type, ["str"]);
            const obj1 = validate({ str: "hello, world!" }, NewType, "obj1");
            assert.deepEqual(obj1, { str: "hello, world!" });

            // @ts-ignore
            const [err1] = _try(() => validate({}, NewType, "obj"));
            assert.strictEqual(
                String(err1),
                "Error: obj.str is required, but no value is given"
            );
        });
    });
});
