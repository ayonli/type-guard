import * as assert from "node:assert";
import { describe, it } from "mocha";
import { Any, as, validate, ValidationWarning, Void } from "..";

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
            const buf3 = validate(null, as(Buffer).default(buf), "buf3");
            assert.strictEqual(buf3, buf);

            let err1: any;
            try {
                // @ts-ignore
                validate(null, as(Buffer), "buf4");
            } catch (err) {
                err1 = err;
                assert.strictEqual(
                    String(err),
                    "Error: buf4 is required, but no value is given"
                );
            }
            assert(err1 instanceof Error);

            let err2: any;
            try {
                // @ts-ignore
                validate("hello, world!", as(Buffer), "buf5");
            } catch (err) {
                err2 = err;
                assert.strictEqual(
                    String(err),
                    "TypeError: buf5 is expected to be of type Buffer, but a string is given"
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
                    "Error: buf2 is required, but no value is given"
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
                    "Error: value is required, but no value is given"
                );
            }
            assert(err1 instanceof Error);

            let err2: any;
            try {
                // @ts-ignore
                validate(Buffer.from("hello, world!"), as(String, Number), "value");
            } catch (err) {
                err2 = err;
                assert.strictEqual(
                    String(err),
                    "TypeError: value is expected to be a string or number, but a Buffer is given"
                );
            }
            assert(err2 instanceof TypeError);
        });

        it("should validate null against union types with Void", () => {
            const nil1 = validate(void 0, as(String, Number, Void), "nill");
            assert.strictEqual(nil1, void 0);

            // @ts-ignore
            const nil2 = validate(null, as(String, Number, Void), "nill");
            assert.strictEqual(nil2, null);
        });
    });

    describe("TupleType", () => {
        it("should validate tuples with as() function", () => {
            const value1 = validate(["hello, world", 123], as([String, Number] as const), "value1");
            assert.deepStrictEqual(value1, ["hello, world", 123]);

            const value2 = validate(["foo", 1], as(["foo", 1] as const), "value2");
            assert.deepStrictEqual(value2, ["foo", 1]);

            // @ts-ignore
            const value3 = validate(null, as([String, Number] as const).optional, "value3");
            assert.strictEqual(value3, null);

            // @ts-ignore
            const value4 = validate(void 0, as([String, Number] as const).default(["hello", 1]), "value4");
            assert.deepStrictEqual(value4, ["hello", 1]);

            let err1: any;
            try {
                // @ts-ignore
                validate(null, as([String, Number] as const), "value");
            } catch (err) {
                err1 = err;
                assert.strictEqual(
                    String(err),
                    "Error: value is required, but no value is given"
                );
            }
            assert(err1 instanceof Error);

            let err2: any;
            try {
                // @ts-ignore
                validate(["hello", Buffer.from([1, 2, 3])], as([String, Number] as const), "value");
            } catch (err) {
                err2 = err;
                assert.strictEqual(
                    String(err),
                    "TypeError: value[1] is expected to be a number, but a Buffer is given"
                );
            }
            assert(err2 instanceof TypeError);

            let err3: any;
            try {
                // @ts-ignore
                validate(["hello"], as([String, Number] as const), "value");
            } catch (err) {
                err3 = err;
                assert.strictEqual(
                    String(err),
                    "Error: value[1] is required, but no value is given"
                );
            }
            assert(err3 instanceof Error);

            let err4: any;
            try {
                // @ts-ignore
                validate(["hello", 1, 2, 3], as([String, Number] as const), "value");
            } catch (err) {
                err4 = err;
                assert.strictEqual(
                    String(err),
                    "Error: value must contain no more than 2 items"
                );
            }
            assert(err4 instanceof Error);
        });

        it("should emit warnings when items are outranged", () => {
            const warnings: ValidationWarning[] = [];

            // @ts-ignore
            const value1 = validate(["foo", 1, "bar"], as([String, Number] as const), "value1", {
                warnings,
                removeUnknownProps: true,
            });
            assert.deepStrictEqual(value1, ["foo", 1]);

            // @ts-ignore
            const value2 = validate(["foo", 1, "bar", 2, 3], as([String, Number] as const), "value2", {
                warnings,
                removeUnknownProps: true,
            });
            assert.deepStrictEqual(value2, ["foo", 1]);

            assert.deepStrictEqual(warnings, [
                {
                    path: "value1",
                    message: "unknown element value1[2] has been removed",
                },
                {
                    path: "value2",
                    message: "unknown elements value2[2...4] have been removed",
                }
            ] as ValidationWarning[]);
        });

        it("should silence element removing warnings when suppressed", () => {
            const warnings: ValidationWarning[] = [];

            // @ts-ignore
            const value1 = validate(["foo", 1, "bar"], as([String, Number] as const), "value1", {
                warnings,
                removeUnknownProps: true,
                suppress: true,
            });
            assert.deepStrictEqual(value1, ["foo", 1]);

            assert.deepStrictEqual(warnings, [] as ValidationWarning[]);
        });
    });

    describe("as-is", () => {
        it("should return the input type if they are validateable by self", () => {
            const type1 = as(String);
            assert.strictEqual(type1, String);

            const type2 = as(Number);
            assert.strictEqual(type2, Number);

            const type3 = as(BigInt);
            assert.strictEqual(type3, BigInt);

            const type4 = as(Boolean);
            assert.strictEqual(type4, Boolean);

            const type5 = as(Date);
            assert.strictEqual(type5, Date);

            const type6 = as(Object);
            assert.strictEqual(type6, Object);

            const type7 = as(Array);
            assert.strictEqual(type7, Array);

            const type8 = as(Any);
            assert.strictEqual(type8, Any);

            const type9 = as(Void);
            assert.strictEqual(type9, Void);

            const type10 = as(String.optional);
            assert.strictEqual(type10, String.optional);

            const BufferType = as(Buffer);
            const type11 = as(BufferType);
            assert.strictEqual(type11, BufferType);
        });
    });
});
