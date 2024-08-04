import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "@ayonli/jsext/try";
import { validate, ValidationWarning } from "../src";

describe("String", () => {
    it("should validate a string", () => {
        const str = validate("hello, world!", String, "str");
        assert.strictEqual(str, "hello, world!");
    });

    it("should report error when the string is not provided or empty", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, String, "str"));
        assert.strictEqual(String(err1), "Error: str is required, but no value is given");

        const [err2] = _try(() => validate(void 0, String, "str"));
        assert.strictEqual(String(err2), "Error: str is required, but no value is given");

        const [err3] = _try(() => validate("", String, "str"));
        assert.strictEqual(String(err3), "Error: str is expected to be a non-empty string");

        const [err4] = _try(() => validate("", String.optional.required, "str"));
        assert.strictEqual(String(err4), "Error: str is expected to be a non-empty string");

        const str1 = validate("", String.default(""), "str1");
        assert.strictEqual(str1, "");
    });

    it("should validate optional strings", () => {
        const str1 = validate(null, String.optional, "str1");
        assert.strictEqual(str1, null);

        const str2 = validate(void 0, String.optional, "str2");
        assert.strictEqual(str2, void 0);

        const str3 = validate("", String.optional, "str3");
        assert.strictEqual(str3, "");
    });

    it("should validate optional strings with default value", () => {
        const str1 = validate(null, String.default(""), "str1");
        assert.strictEqual(str1, "");

        const str2 = validate(void 0, String.default("hello, world!"), "str2");
        assert.strictEqual(str2, "hello, world!");
    });

    it("should convert compatible values to strings and emit warnings", () => {
        const warnings: ValidationWarning[] = [];

        const str1 = validate(123, String, "str1", { warnings });
        assert.strictEqual(str1, "123");

        const str2 = validate(123n, String, "str2", { warnings });
        assert.strictEqual(str2, "123");

        const str3 = validate(true, String, "str3", { warnings });
        assert.strictEqual(str3, "true");

        const date = new Date();
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
                message: "a Date at str4 has been converted to string",
            }
        ] as ValidationWarning[]);
    });

    it("should throw error when the value is not compatible", () => {
        const [err1] = _try(() => validate({ hello: "world" }, String, "str"));
        assert.strictEqual(
            String(err1),
            "TypeError: str is expected to be a string, but an object is given"
        );

        const [err2] = _try(() => validate(["hello", "world"], String, "str"));
        assert.strictEqual(
            String(err2),
            "TypeError: str is expected to be a string, but an array is given"
        );

        const [err3] = _try(() => validate(Buffer.from("hello, world!"), String, "str"));
        assert.strictEqual(
            String(err3),
            "TypeError: str is expected to be a string, but a Buffer is given"
        );

        const [err4] = _try(() => validate(() => "hello, world!", String, "str"));
        assert.strictEqual(
            String(err4),
            "TypeError: str is expected to be a string, but a function is given"
        );
    });

    it("should not convert type when in strict mode", () => {
        const [err1] = _try(() => validate(123, String, "str", { strict: true }));
        assert.strictEqual(
            String(err1),
            "TypeError: str is expected to be a string, but a number is given"
        );

        const [err2] = _try(() => validate(123n, String, "str", { strict: true }));
        assert.strictEqual(
            String(err2),
            "TypeError: str is expected to be a string, but a bigint is given"
        );

        const [err3] = _try(() => validate(true, String, "str", { strict: true }));
        assert.strictEqual(
            String(err3),
            "TypeError: str is expected to be a string, but a boolean is given"
        );

        const [err4] = _try(() => validate(new Date(), String, "str", { strict: true }));
        assert.strictEqual(
            String(err4),
            "TypeError: str is expected to be a string, but a Date is given"
        );
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

        const [err1] = _try(() => validate("hello, world!", String.minLength(20), "str"));
        assert.strictEqual(String(err1), "Error: str is expected to contain at least 20 characters");

        const str2 = validate("hello, world!", String.maxLength(20), "str2");
        assert.strictEqual(str2, "hello, world!");

        const [err2] = _try(() => validate("hello, world!", String.maxLength(10), "str"));
        assert.strictEqual(
            String(err2),
            "Error: str is expected to contain no more than 10 characters"
        );

        const str3 = validate("hello, world!", String.minLength(10).maxLength(20), "str3");
        assert.strictEqual(str3, "hello, world!");
    });

    it("should constrain the options of the text value", () => {
        const str1 = validate("hello", String.enum(["hello", "world"] as const), "str1");
        assert.strictEqual(str1, "hello");

        const [err1] = _try(() => validate("hi", String.enum(["hello", "world"] as const), "str"));
        assert.strictEqual(
            String(err1),
            "TypeError: str is expected to be 'hello' or 'world', but 'hi' is given"
        );
    });

    it("should constrain by a constant string", () => {
        const str1 = validate("hello", "hello" as const, "str1");
        assert.strictEqual(str1, "hello");

        const [err1] = _try(() => validate("hi", "hello" as const, "str"));
        assert.strictEqual(
            String(err1),
            "TypeError: str is expected to be 'hello', but 'hi' is given"
        );
    });

    it("should match an email address", () => {
        const str = validate("the@ayon.li", String.match("email"), "str");
        assert.strictEqual(str, "the@ayon.li");

        const [err] = _try(() => validate("hello, world!", String.match("email"), "str"));
        assert.strictEqual(String(err), "TypeError: str is not a valid email address");
    });

    it("should match a phone number", () => {
        const str = validate("13800774500", String.match("phone"), "str");
        assert.strictEqual(str, "13800774500");

        const [err] = _try(() => validate("hello, world!", String.match("phone"), "str"));
        assert.strictEqual(String(err), "TypeError: str is not a valid phone number");
    });

    it("should match an IPv4 address", () => {
        const str = validate("127.0.0.1", String.match("ip"), "str");
        assert.strictEqual(str, "127.0.0.1");

        const [err] = _try(() => validate("::1", String.match("ip"), "str"));
        assert.strictEqual(String(err), "TypeError: str is not a valid IP address");
    });

    it("should match a URL address", () => {
        const str = validate("https://example.com", String.match("url"), "str");
        assert.strictEqual(str, "https://example.com");

        const [err] = _try(() => validate("//example.com", String.match("url"), "str"));
        assert.strictEqual(String(err), "TypeError: str is not a valid URL address");
    });

    it("should match a hostname", () => {
        const str1 = validate("example.com", String.match("hostname"), "str1");
        assert.strictEqual(str1, "example.com");

        const str2 = validate("www.example.com", String.match("hostname"), "str2");
        assert.strictEqual(str2, "www.example.com");

        const [err] = _try(() => validate("//example.com", String.match("hostname"), "str"));
        assert.strictEqual(String(err), "TypeError: str is not a valid hostname");
    });

    it("should match a date string", () => {
        const str = validate("2023-04-01", String.match("date"), "str");
        assert.strictEqual(str, "2023-04-01");

        const [err] = _try(() => validate("2023/04/01", String.match("date"), "str"));
        assert.strictEqual(
            String(err),
            "TypeError: str is not a valid date string (format: YYYY-MM-DD)"
        );
    });

    it("should match a time string", () => {
        const str1 = validate("12:00:00", String.match("time"), "str1");
        assert.strictEqual(str1, "12:00:00");

        const str2 = validate("12:00", String.match("time"), "str2");
        assert.strictEqual(str2, "12:00");

        const [err] = _try(() => validate("12.00.00", String.match("time"), "str"));
        assert.strictEqual(
            String(err),
            "TypeError: str is not a valid time string (format: HH:mm[:ss])"
        );
    });

    it("should match a datetime string", () => {
        const str1 = validate("2023-04-01 12:00:00", String.match("datetime"), "str1");
        assert.strictEqual(str1, "2023-04-01 12:00:00");

        const [err] = _try(() => validate("2023-04-01 12:00", String.match("datetime"), "str"));
        assert.strictEqual(
            String(err),
            "TypeError: str is not a valid datetime string (format: YYYY-MM-DD HH:mm:ss)"
        );
    });

    it("should match a uuid", () => {
        const str1 = validate("6a2f41a3-c54c-fce8-32d2-0324e1c32e22", String.match("uuid"), "str1");
        assert.strictEqual(str1, "6a2f41a3-c54c-fce8-32d2-0324e1c32e22");

        const [err] = _try(() => validate("not a uuid", String.match("uuid"), "str"));
        assert.strictEqual(
            String(err),
            "TypeError: str is not a valid UUID"
        );
    });

    it("should match the regex", () => {
        const regex = /[0-9]+/;
        const str = validate("123456", String.match(regex), "str");
        assert.strictEqual(str, "123456");

        const [err] = _try(() => validate("hello, world!", String.match(regex), "str"));
        assert.strictEqual(
            String(err),
            "Error: str does not match the pattern: " + String(regex)
        );
    });

    it("should match by a custom function", () => {
        const test = (str: string) => /[0-9]+/.test(str);
        const str = validate("123456", String.match(test), "str");
        assert.strictEqual(str, "123456");

        const [err] = _try(() => validate("hello, world!", String.match(test), "str"));
        assert.strictEqual(String(err), "Error: str does not fulfill the requirement");
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        const str = validate("hello, world!", String.deprecated("will no longer effect"), "str", {
            warnings,
        });
        assert.strictEqual(str, "hello, world!");

        assert.deepStrictEqual(warnings, [{
            path: "str",
            message: "str is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });

    it("should suppress non-critical errors as warnings", () => {
        const warnings: ValidationWarning[] = [];

        const str1 = validate("", String, "str1", { warnings, suppress: true });
        assert.strictEqual(str1, "");

        const str2 = validate("hello, world!", String.minLength(20), "str2", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(str2, "hello, world!");

        const str3 = validate("hello, world!", String.maxLength(10), "str3", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(str3, "hello, world!");

        const str4 = validate("hi", String.enum(["hello", "world"] as const), "str4", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(str4, "hi");

        const str5 = validate("hi", "hello" as const, "str5", { warnings, suppress: true });
        assert.strictEqual(str5, "hi");

        const str10 = validate("2023-04-01 12:00", String.match("datetime"), "str10", {
            warnings,
            suppress: true,
        });
        assert.strictEqual(str10, "2023-04-01 12:00");

        assert.deepStrictEqual(warnings, [
            {
                path: "str1",
                message: "str1 is expected to be a non-empty string"
            },
            {
                path: "str2",
                message: "str2 is expected to contain at least 20 characters"
            },
            {
                path: "str3",
                message: "str3 is expected to contain no more than 10 characters"
            },
            {
                path: "str4",
                message: "str4 is expected to be 'hello' or 'world', but 'hi' is given"
            },
            {
                path: "str5",
                message: "str5 is expected to be 'hello', but 'hi' is given"
            },
            {
                path: "str10",
                message: "str10 is not a valid datetime string (format: YYYY-MM-DD HH:mm:ss)"
            }
        ] as ValidationWarning[]);
    });
});
