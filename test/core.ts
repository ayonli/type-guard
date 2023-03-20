import "@hyurl/utils/types";
import * as assert from "node:assert";
import { describe, it } from "mocha";
import { Any, Dict, ExtractInstanceType, validate, Void, wrap } from "..";

const Type = {
    str: String.optional.enum(["A", "B", "C"] as const),
};
// @ts-ignore
type Type = ExtractInstanceType<typeof Type>;

const value: Type = {
    str: "A",
};

console.log(validate(value, Type));


// const _StringEnum = String.enum(["A", "B", "C"] as const);
// type _StringEnum = ExtractInstanceType<typeof _StringEnum>;

// function sum(num1: number, num2: number, num3?: number) {
//     const warnings: ValidationWarning[] = [];
//     num1 = validate(num1, Number, "num1", { warnings });
//     num2 = validate(num2, Number, "num2", { warnings });
//     num3 = validate(num3, Number.optional, "num3", { warnings });
// }

const wrappedSum = wrap(
    { num1: Number, num2: Number, num3: Number.optional },
    Number
)(({ num1, num2, num3 }) => {
    return num1 + num2 + (num3 || 0);
});

console.log(wrappedSum({ num1: 100, num2: 200, num3: 0 }));

// function getDefinedValue(target: any, prop: string) {
//     const desc = Object.getOwnPropertyDescriptor(target, prop);

//     console.log(desc);

//     return desc?.value || desc?.get || null;
// }

describe("Core Features", () => {
    it("should add features to the String constructor", () => {
        assert.strictEqual(typeof String.optional, "object");
        assert.strictEqual(String(String.optional), "[object OptionalStringType]");
        assert.strictEqual(String.optional, String.optional);

        assert.strictEqual(typeof String.required, "object");
        assert.strictEqual(String(String.required), "[object StringType]");
        assert.strictEqual(String.required, String.required);
        assert(String.optional.required !== String.required);

        assert.strictEqual(typeof String.default, "function");
        assert.strictEqual(String(String.default("")), "[object OptionalStringType]");

        assert.strictEqual(typeof String.deprecated, "function");
        assert.strictEqual(typeof String.alternatives, "function");
        assert.strictEqual(typeof String.associates, "function");
        assert.strictEqual(typeof String.minLength, "function");
        assert.strictEqual(typeof String.maxLength, "function");
        assert.strictEqual(typeof String.trim, "object");
        assert.strictEqual(typeof String.spaceless, "object");
        assert.strictEqual(typeof String.lowercase, "object");
        assert.strictEqual(typeof String.uppercase, "object");

        assert.strictEqual(typeof String.enum, "function");
        assert.strictEqual(String(String.enum(["A", "B", "C"])), "[object StringEnum]");
        assert.strictEqual(String(String.optional.enum(["A", "B", "C"])), "[object OptionalStringEnum]");
        assert.strictEqual(String(String.enum(["A", "B", "C"]).optional), "[object OptionalStringEnum]");

        assert.strictEqual(typeof String.match, "function");
    });

    it("should add features to the Number constructor", () => {
        assert.strictEqual(typeof Number.optional, "object");
        assert.strictEqual(String(Number.optional), "[object OptionalNumberType]");
        assert.strictEqual(Number.optional, Number.optional);

        assert.strictEqual(typeof Number.required, "object");
        assert.strictEqual(String(Number.required), "[object NumberType]");
        assert.strictEqual(Number.required, Number.required);
        assert(Number.optional.required !== Number.required);

        assert.strictEqual(typeof Number.deprecated, "function");
        assert.strictEqual(typeof Number.alternatives, "function");
        assert.strictEqual(typeof Number.associates, "function");
        assert.strictEqual(typeof Number.min, "function");
        assert.strictEqual(typeof Number.max, "function");

        assert.strictEqual(typeof Number.enum, "function");
        assert.strictEqual(String(Number.enum([-1, 0, 1])), "[object NumberEnum]");
        assert.strictEqual(String(Number.optional.enum([-1, 0, 1])), "[object OptionalNumberEnum]");
        assert.strictEqual(String(Number.enum([-1, 0, 1]).optional), "[object OptionalNumberEnum]");
    });

    it("should add features to the BigInt constructor", () => {
        assert.strictEqual(typeof BigInt.optional, "object");
        assert.strictEqual(String(BigInt.optional), "[object OptionalBigIntType]");
        assert.strictEqual(BigInt.optional, BigInt.optional);

        assert.strictEqual(typeof BigInt.required, "object");
        assert.strictEqual(String(BigInt.required), "[object BigIntType]");
        assert.strictEqual(BigInt.required, BigInt.required);
        assert(BigInt.optional.required !== BigInt.required);

        assert.strictEqual(typeof BigInt.deprecated, "function");
        assert.strictEqual(typeof BigInt.alternatives, "function");
        assert.strictEqual(typeof BigInt.associates, "function");
        assert.strictEqual(typeof BigInt.min, "function");
        assert.strictEqual(typeof BigInt.max, "function");

        assert.strictEqual(typeof BigInt.enum, "function");
        assert.strictEqual(String(BigInt.enum([-1, 0, 1])), "[object BigIntEnum]");
        assert.strictEqual(String(BigInt.optional.enum([-1, 0, 1])), "[object OptionalBigIntEnum]");
        assert.strictEqual(String(BigInt.enum([-1, 0, 1]).optional), "[object OptionalBigIntEnum]");
    });

    it("should add features to the Boolean constructor", () => {
        assert.strictEqual(typeof Boolean.optional, "object");
        assert.strictEqual(String(Boolean.optional), "[object OptionalBooleanType]");
        assert.strictEqual(Boolean.optional, Boolean.optional);

        assert.strictEqual(typeof Boolean.required, "object");
        assert.strictEqual(String(Boolean.required), "[object BooleanType]");
        assert.strictEqual(Boolean.required, Boolean.required);
        assert(Boolean.optional.required !== Boolean.required);

        assert.strictEqual(typeof Boolean.deprecated, "function");
        assert.strictEqual(typeof Boolean.alternatives, "function");
        assert.strictEqual(typeof Boolean.associates, "function");
    });

    it("should add features to the Date constructor", () => {
        assert.strictEqual(typeof Date.optional, "object");
        assert.strictEqual(String(Date.optional), "[object OptionalDateType]");
        assert.strictEqual(Date.optional, Date.optional);

        assert.strictEqual(typeof Date.required, "object");
        assert.strictEqual(String(Date.required), "[object DateType]");
        assert.strictEqual(Date.required, Date.required);
        assert(Date.optional.required !== Date.required);

        assert.strictEqual(typeof Date.deprecated, "function");
        assert.strictEqual(typeof Date.alternatives, "function");
        assert.strictEqual(typeof Date.associates, "function");
    });

    it("should add features to the Object constructor", () => {
        assert.strictEqual(typeof Object.optional, "object");
        assert.strictEqual(String(Object.optional), "[object OptionalMixedType]");
        assert.strictEqual(Object.optional, Object.optional);

        assert.strictEqual(typeof Object.required, "object");
        assert.strictEqual(String(Object.required), "[object MixedType]");
        assert.strictEqual(Object.required, Object.required);
        assert(Object.optional.required !== Object.required);

        assert.strictEqual(typeof Object.deprecated, "function");
        assert.strictEqual(typeof Object.alternatives, "function");
        assert.strictEqual(typeof Object.associates, "function");
    });

    it("should add features to the Array prototype", () => {
        assert.strictEqual(typeof Array.prototype.optional, "object");
        assert.strictEqual(String(Array.prototype.optional), "[object OptionalArrayType]");

        assert.strictEqual(typeof Array.prototype.required, "object");
        assert.strictEqual(String(Array.prototype.required), "[object ArrayType]");
        assert.strictEqual(typeof Array.prototype.deprecated, "function");
        assert.strictEqual(typeof Array.prototype.alternatives, "function");
        assert.strictEqual(typeof Array.prototype.associates, "function");
    });

    it("should import Dict type", () => {
        assert.strictEqual(typeof Dict, "function");
        assert.strictEqual(String(Dict(String, String)), "[object DictType]");
        assert.strictEqual(String(Dict(String, String).optional), "[object OptionalDictType]");
        assert.strictEqual(String(Dict(String, String).optional.required), "[object DictType]");
    });

    it("should import Any type", () => {
        assert.strictEqual(typeof Any, "object");
        assert.strictEqual(String(Any), "[object AnyType]");
        assert.strictEqual(String(Any.optional), "[object OptionalAnyType]");
        assert.strictEqual(String(Any.required), "[object AnyType]");
    });

    it("should import Void type", () => {
        assert.strictEqual(typeof Void, "object");
        assert.strictEqual(String(Void), "[object VoidType]");
        assert.strictEqual(String(Void.optional), "[object VoidType]");

        try {
            Void.required;
        } catch (err) {
            assert(String(err).includes("VoidType is always optional"));
        }
    });
});
