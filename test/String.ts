import * as assert from "node:assert";
import { describe, it } from "mocha";
import { validate, ValidationWarning } from "..";

describe("String", () => {
    it("should validate a string", () => {
        const str = validate("hello, world!", String, "str");
        assert.strictEqual(str, "hello, world!");
    });

    it("should validate optional strings", () => {
        // @ts-ignore
        const str1 = validate(null, String.optional, "str1");
        assert.strictEqual(str1, null);

        // @ts-ignore
        const str2 = validate(void 0, String.optional, "str2");
        assert.strictEqual(str2, void 0);

        // @ts-ignore
        const str3 = validate("", String.optional, "str3");
        assert.strictEqual(str3, "");
    });

    it("should validate optional strings with default value", () => {
        // @ts-ignore
        const str1 = validate(null, String.default(""), "str1");
        assert.strictEqual(str1, "");

        // @ts-ignore
        const str2 = validate(void 0, String.default("hello, world!"), "str2");
        assert.strictEqual(str2, "hello, world!");
    });

    it("should report error when the string is empty", () => {
        try {
            // @ts-ignore
            validate(null, String, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: str is required, but no value is provided"
            );
        }

        try {
            // @ts-ignore
            validate(void 0, String, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: str is required, but no value is provided"
            );
        }

        try {
            validate("", String, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "RangeError: str must be provided and cannot be empty");
        }

        try {
            validate("", String.optional.required, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "RangeError: str must be provided and cannot be empty");
        }

        const str1 = validate("", String.default(""), "str1");
        assert.strictEqual(str1, "");
    });

    it("should convert compatible values to strings and record warnings", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const str1 = validate(123, String, "str1", { warnings });
        assert.strictEqual(str1, "123");

        // @ts-ignore
        const str2 = validate(BigInt(123), String, "str2", { warnings });
        assert.strictEqual(str2, "123");

        // @ts-ignore
        const str3 = validate(true, String, "str3", { warnings });
        assert.strictEqual(str3, "true");

        const date = new Date();
        // @ts-ignore
        const str4 = validate(date, String, "str4", { warnings });
        assert.strictEqual(str4, date.toISOString());

        assert.deepStrictEqual(warnings, [
            {
                path: "str1",
                message: "a number at str1 has been converted to string",
            },
            {
                path: "str2",
                message: "a bigint at str2 has been converted to string",
            },
            {
                path: "str3",
                message: "a boolean at str3 has been converted to string",
            },
            {
                path: "str4",
                message: "type of Date at str4 has been converted to string",
            }
        ] as ValidationWarning[]);
    });

    it("should throw error when the value is not compatible", () => {
        try {
            // @ts-ignore
            validate({ hello: "world" }, String, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is expected to be a string, but an object is given");
        }

        try {
            // @ts-ignore
            validate(["hello", "world"], String, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is expected to be a string, but an array is given");
        }

        try {
            // @ts-ignore
            validate(Buffer.from("hello, world!"), String, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is expected to be a string, but type of Buffer is given");
        }

        try {
            // @ts-ignore
            validate(() => "hello, world!", String, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is expected to be a string, but a function is given");
        }
    });

    it("should not convert type when in strict mode", () => {
        try {
            // @ts-ignore
            validate(123, String, "str", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is expected to be a string, but a number is given");
        }

        try {
            // @ts-ignore
            validate(BigInt(123), String, "str", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is expected to be a string, but a bigint is given");
        }

        try {
            // @ts-ignore
            validate(true, String, "str", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is expected to be a string, but a boolean is given");
        }

        try {
            // @ts-ignore
            validate(new Date(), String, "str", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is expected to be a string, but type of Date is given");
        }
    });

    it("should trim leading and tailing spaces of the string", () => {
        const str1 = validate(" hello, world! ", String, "str1");
        assert.strictEqual(str1, " hello, world! ");

        const str2 = validate(" hello, world!", String.trim, "str2");
        assert.strictEqual(str2, "hello, world!");

        const str3 = validate("hello, world! ", String.trim, "str3");
        assert.strictEqual(str3, "hello, world!");

        const str4 = validate("  hello, world!  ", String.trim, "str4");
        assert.strictEqual(str4, "hello, world!");
    });

    it("should remove all spaces of the string", () => {
        const str = validate(" hello, world! ", String.spaceless, "str");
        assert.strictEqual(str, "hello,world!");
    });

    it("should convert the string to UPPER-CASE", () => {
        const str = validate("Hello, World!", String.uppercase, "str");
        assert.strictEqual(str, "HELLO, WORLD!");

        const str1 = validate("Hello, World!", String.lowercase.uppercase, "str1");
        assert.strictEqual(str1, "HELLO, WORLD!");
    });

    it("should convert the string to lower-case", () => {
        const str = validate("Hello, World!", String.lowercase, "str");
        assert.strictEqual(str, "hello, world!");

        const str1 = validate("Hello, World!", String.uppercase.lowercase, "str");
        assert.strictEqual(str1, "hello, world!");
    });

    it("should constrain the length of the string", () => {
        const str1 = validate("hello, world!", String.minLength(10), "str1");
        assert.strictEqual(str1, "hello, world!");

        try {
            validate("hello, world!", String.minLength(20), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "RangeError: str must not be shorter than 20");
        }

        const str2 = validate("hello, world!", String.maxLength(20), "str2");
        assert.strictEqual(str2, "hello, world!");

        try {
            validate("hello, world!", String.maxLength(10), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "RangeError: str must not be longer than 10");
        }

        const str3 = validate("hello, world!", String.minLength(10).maxLength(20), "str3");
        assert.strictEqual(str3, "hello, world!");
    });

    it("should constrain the options of the text value", () => {
        const str1 = validate("hello", String.enum(["hello", "world"] as const), "str1");
        assert.strictEqual(str1, "hello");

        try {
            // @ts-ignore
            validate("hi", String.enum(["hello", "world"] as const), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: str must be one of these values: 'hello', 'world'");
        }
    });

    it("should constrain by a constant string", () => {
        const str1 = validate("hello", "hello" as const, "str1");
        assert.strictEqual(str1, "hello");

        try {
            // @ts-ignore
            validate("hi", "hello" as const, "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: str must be 'hello'");
        }
    });

    it("should match an email address", () => {
        const str = validate("i@hyurl.com", String.match("email"), "str");
        assert.strictEqual(str, "i@hyurl.com");

        try {
            validate("hello, world!", String.match("email"), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is not a valid email address"
            );
        }
    });

    it("should match a phone number", () => {
        const str = validate("13800774500", String.match("phone"), "str");
        assert.strictEqual(str, "13800774500");

        try {
            validate("hello, world!", String.match("phone"), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is not a valid phone number"
            );
        }
    });

    it("should match an IPv4 address", () => {
        const str = validate("127.0.0.1", String.match("ip"), "str");
        assert.strictEqual(str, "127.0.0.1");

        try {
            validate("::1", String.match("ip"), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is not a valid IP address"
            );
        }
    });

    it("should match a URL address", () => {
        const str = validate("https://example.com", String.match("url"), "str");
        assert.strictEqual(str, "https://example.com");

        try {
            validate("//example.com", String.match("url"), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is not a valid URL address"
            );
        }
    });

    it("should match a hostname", () => {
        const str1 = validate("example.com", String.match("hostname"), "str1");
        assert.strictEqual(str1, "example.com");

        const str2 = validate("www.example.com", String.match("hostname"), "str2");
        assert.strictEqual(str2, "www.example.com");

        try {
            validate("//example.com", String.match("hostname"), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is not a valid hostname"
            );
        }
    });

    it("should match a date string", () => {
        const str = validate("2023-04-01", String.match("date"), "str");
        assert.strictEqual(str, "2023-04-01");

        try {
            validate("2023/04/01", String.match("date"), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is not a valid date string (format: YYYY-MM-DD)"
            );
        }
    });

    it("should match a time string", () => {
        const str1 = validate("12:00:00", String.match("time"), "str1");
        assert.strictEqual(str1, "12:00:00");

        const str2 = validate("12:00", String.match("time"), "str2");
        assert.strictEqual(str2, "12:00");

        try {
            validate("12.00.00", String.match("time"), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is not a valid time string (format: HH:mm[:ss])"
            );
        }
    });

    it("should match a datetime string", () => {
        const str1 = validate("2023-04-01 12:00:00", String.match("datetime"), "str1");
        assert.strictEqual(str1, "2023-04-01 12:00:00");

        try {
            validate("2023-04-01 12:00", String.match("datetime"), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: str is not a valid datetime string (format: YYYY-MM-DD HH:mm:ss)"
            );
        }
    });

    it("should match the regex", () => {
        const regex = /[0-9]+/;
        const str = validate("123456", String.match(regex), "str");
        assert.strictEqual(str, "123456");

        try {
            validate("hello, world!", String.match(regex), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: str does not match the pattern: " + String(regex)
            );
        }
    });

    it("should match by a custom function", () => {
        const test = (str: string) => /[0-9]+/.test(str);
        const str = validate("123456", String.match(test), "str");
        assert.strictEqual(str, "123456");

        try {
            validate("hello, world!", String.match(test), "str");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: str does not fulfill the requirement"
            );
        }
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        validate("hello, world!", String.deprecated("will no longer effect"), "str", { warnings });

        assert.deepStrictEqual(warnings, [{
            path: "str",
            message: "str is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });
});
