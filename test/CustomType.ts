import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { as, validate, ValidationWarning } from "..";

describe("CustomType", () => {
    it("should validate values of custom types without as() function", () => {
        const buf = Buffer.from("hello, world");
        // @ts-ignore
        const buf1 = validate(buf, Buffer, "buf1");
        assert.strictEqual(buf1, buf);

        // @ts-ignore
        const [err1] = _try(() => validate(null, Buffer, "buf"));
        assert.strictEqual(String(err1), "Error: buf is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate("hello, world!", Buffer, "buf"));
        assert.strictEqual(
            String(err2),
            "TypeError: buf is expected to be a Buffer, but a string is given"
        );
    });

    it("should validate values of custom types with as() function", () => {
        const buf = Buffer.from("hello, world");
        const buf1 = validate(buf, as(Buffer), "buf1");
        assert.strictEqual(buf1, buf);

        // @ts-ignore
        const [err1] = _try(() => validate(null, as(Buffer), "buf4"));
        assert.strictEqual(String(err1), "Error: buf4 is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate("hello, world!", as(Buffer), "buf5"));
        assert.strictEqual(
            String(err2),
            "TypeError: buf5 is expected to be a Buffer, but a string is given"
        );
    });

    it("should validate optional value custom type", () => {
        // @ts-ignore
        const buf1 = validate(null, as(Buffer).optional, "buf1");
        assert.strictEqual(buf1, null);
    });

    it("should validate value of custom type with default value", () => {
        const buf = Buffer.from("hello, world");

        // @ts-ignore
        const buf1 = validate(null, as(Buffer).default(buf), "buf1");
        assert.strictEqual(buf1, buf);
    });

    it("should validate custom types of constant values", () => {
        const value1 = validate("hello", as("hello" as const), "value1");
        assert.strictEqual(value1, "hello");

        // @ts-ignore
        const [err1] = _try(() => validate("hi", as("hello" as const), "value1"));
        assert.strictEqual(
            String(err1),
            "TypeError: value1 is expected to be 'hello', but 'hi' is given"
        );

        const value2 = validate(1, as(1 as const), "value2");
        assert.strictEqual(value2, 1);

        // @ts-ignore
        const [err2] = _try(() => validate(3, as(1 as const), "value2"));
        assert.strictEqual(
            String(err2),
            "TypeError: value2 is expected to be 1, but 3 is given"
        );

        const value3 = validate(1n, as(1n as const), "value3");
        assert.strictEqual(value3, 1n);

        // @ts-ignore
        const [err3] = _try(() => validate(3n, as(1n as const), "value3"));
        assert.strictEqual(
            String(err3),
            "TypeError: value3 is expected to be 1, but 3 is given"
        );

        const value4 = validate(true, as(true as const), "value4");
        assert.strictEqual(value4, true);

        // @ts-ignore
        const [err4] = _try(() => validate(false, as(true as const), "value4"));
        assert.strictEqual(
            String(err4),
            "TypeError: value4 is expected to be true, but false is given"
        );
    });

    it("should validate custom types with a custom guard function", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const buf1 = validate("hello, world", as(Buffer).guard((data, path, warnings) => {
            const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

            if (buf !== data) {
                warnings.push({
                    path,
                    message: `a ${typeof data} has been converted to Buffer at ${path}`,
                });
            }

            return buf;
        }), "buf1", { warnings });
        assert(Buffer.isBuffer(buf1));
        assert.strictEqual(buf1.toString(), "hello, world");

        assert.deepStrictEqual(warnings, [
            {
                path: "buf1",
                message: `a string has been converted to Buffer at buf1`,
            }
        ] as ValidationWarning[]);
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const obj = validate({
            str: "hello, world!",
            num: 123,
            bool: true,
        }, as({
            str: String,
            num: Number,
            bool: Boolean,
        }).deprecated("will no longer effect"), "obj", {
            warnings,
        });
        assert.deepStrictEqual(obj, {
            str: "hello, world!",
            num: 123,
            bool: true,
        });

        assert.deepStrictEqual(warnings, [{
            path: "obj",
            message: "obj is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });
});