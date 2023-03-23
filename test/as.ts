import * as assert from "node:assert";
import { describe, it } from "mocha";
import { as, validate, ValidationWarning } from "..";

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
});
