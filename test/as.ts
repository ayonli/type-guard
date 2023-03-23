import * as assert from "node:assert";
import { describe, it } from "mocha";
import { as, validate, ValidationWarning, Void } from "..";

describe("as()", () => {
    describe("CustomType", () => {
        it("should validate custom types with as() function", () => {
            const buf = Buffer.from("hello, world");
            const buf1 = validate(buf, as(Buffer), "buf1");
            assert.strictEqual(buf1, buf);

            // @ts-ignore
            const buf2 = validate(null, as(Buffer).optional, "bu2");
            assert.strictEqual(buf2, null);

            // @ts-ignore
            const buf3 = validate(null, as(Buffer).optional, "buf3");
            assert.strictEqual(buf3, null);

            // @ts-ignore
            const buf4 = validate(null, as(Buffer).default(buf), "buf4");
            assert.strictEqual(buf4, buf);

            let err1: any;
            try {
                // @ts-ignore
                validate(null, as(Buffer), "buf2");
            } catch (err) {
                err1 = err;
                assert.strictEqual(
                    String(err),
                    "Error: buf2 is required, but no value is provided"
                );
            }
            assert(err1 instanceof Error);

            let err2: any;
            try {
                // @ts-ignore
                validate("hello, world!", as(Buffer), "buf3");
            } catch (err) {
                err2 = err;
                assert.strictEqual(
                    String(err),
                    "TypeError: buf3 is expected to be of type Buffer, but a string is given"
                );
            }
            assert(err2 instanceof TypeError);
        });

        it("should validate custom types without as() function", () => {
            const buf = Buffer.from("hello, world");
            const buf1 = validate(buf, Buffer, "buf1");
            assert.strictEqual(buf1, buf);

            let err1: any;
            try {
                // @ts-ignore
                validate(null, Buffer, "buf2");
            } catch (err) {
                err1 = err;
                assert.strictEqual(
                    String(err),
                    "Error: buf2 is required, but no value is provided"
                );
            }
            assert(err1 instanceof Error);

            let err2: any;
            try {
                // @ts-ignore
                validate("hello, world!", Buffer, "buf3");
            } catch (err) {
                err2 = err;
                assert.strictEqual(
                    String(err),
                    "TypeError: buf3 is expected to be of type Buffer, but a string is given"
                );
            }
            assert(err2 instanceof TypeError);
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
    });

    describe("UnionType", () => {
        it("should validate union types with as() function", () => {
            const value1 = validate("hello, world!", as(String, Number, Boolean), "str");
            assert.strictEqual(value1, "hello, world!");

            const value2 = validate(123, as(String, Number, Boolean), "value2");
            assert.strictEqual(value2, 123);

            const value3 = validate(true, as(String, Number, Boolean), "value3");
            assert.strictEqual(value3, true);

            const date = new Date();
            const value4 = validate(date, as(String, Number, Boolean, Date), "value3");
            assert.strictEqual(value4, date);

            // @ts-ignore
            const value5 = validate(null, as(String, Number).optional, "value5");
            assert.strictEqual(value5, null);

            // @ts-ignore
            const value6 = validate(null, as(String, Number).default("hello, world!"), "value6");
            assert.strictEqual(value6, "hello, world!");

            let err1: any;
            try {
                // @ts-ignore
                validate(null, as(String, Number), "value");
            } catch (err) {
                err1 = err;
                assert.strictEqual(
                    String(err),
                    "Error: value is required, but no value is provided"
                );
            }
            assert(err1 instanceof Error);
        });

        it("should validate null against union types with Void", () => {
            const nil1 = validate(void 0, as(String, Number, Void), "nill");
            assert.strictEqual(nil1, void 0);

            // @ts-ignore
            const nil2 = validate(null, as(String, Number, Void), "nill");
            assert.strictEqual(nil2, null);
        });

        it("should validate union types with a custom guard function", () => {
            const warnings: ValidationWarning[] = [];

            // @ts-ignore
            const value1 = validate(Date.now(), as(String, Date).guard((data, path, warnings) => {
                if (data instanceof Date || typeof data === "string") {
                    return data;
                } else if (typeof data === "number") {
                    warnings.push({
                        path,
                        message: `a number has been converted to Date at ${path}`,
                    });

                    return new Date(data);
                } else {
                    warnings.push({
                        path,
                        message: `a ${typeof data} has been converted to string at ${path}`,
                    });

                    return String(data);
                }
            }), "value1", { warnings });
            assert(value1 instanceof Date);

            assert.deepStrictEqual(warnings, [
                {
                    path: "value1",
                    message: `a number has been converted to Date at value1`,
                }
            ] as ValidationWarning[]);
        });
    });
});
