import * as assert from "assert";
import { describe, it, before, after } from "mocha";
import _try from "dotry";
import { as, deprecated, param, remarks, returns, setWarningHandler, throws, ValidationWarning, Void } from "..";

describe("decorators", () => {
    const warnings: ValidationWarning[] = [];

    before(() => {
        setWarningHandler(function (_warnings) {
            warnings.push(..._warnings);
        });
    });

    after(() => {
        assert.deepStrictEqual(warnings, [
            {
                path: "parameters.num",
                message: "a string at parameters.num has been converted to number"
            },
            {
                path: "parameters.param1",
                message: "unknown property parameters.param1 has been removed"
            },
            {
                path: "parameters.param1",
                message: "unknown property parameters.param1 has been removed"
            },
            {
                path: "test()",
                message: "test() is expected to have no argument, but a string is given"
            },
            {
                path: "parameters.param0",
                message: "unknown property parameters.param0 has been removed"
            },
            {
                path: "returns",
                message: "a string at returns has been converted to number"
            },
            {
                path: "returns",
                message: "a string at returns has been converted to number"
            },
            {
                path: "test1()",
                message: "test1() is deprecated: use test3() instead"
            },
            {
                path: "test2()",
                message: "test2() is deprecated"
            }
        ] as ValidationWarning[]);
    });

    describe("@param()", () => {
        it("should constrain the method to accept values of specific types", async () => {
            class Example {
                @param(String, "text")
                test1(text: string) {
                    return { args: [...arguments] };
                }

                @param(Number, "num")
                test2(num: Number) {
                    return { args: [...arguments] };
                }

                @param("date", Date)
                test3(date: string) {
                    return { args: [...arguments] };
                }

                @param("ok", Boolean)
                test4(ok: boolean) {
                    return { args: [...arguments] };
                }

                @param("ok", Boolean)
                async test5(ok: boolean) {
                    return await Promise.resolve({ args: [...arguments] });
                }
            }

            const example = new Example();

            const result1 = example.test1("hello, world!");
            assert.deepStrictEqual(result1, { args: ["hello, world!"] });

            // @ts-ignore
            const result2 = example.test2("12345");
            assert.deepStrictEqual(result2, { args: [12345] });

            const date = new Date();
            // @ts-ignore
            const result3 = example.test3(date.toISOString());
            assert.deepStrictEqual(result3, { args: [date] });

            // @ts-ignore
            const result4 = example.test4(true, "extra note");
            assert.deepStrictEqual(result4, { args: [true] });

            // @ts-ignore
            const [err1] = _try(() => example.test1(Buffer.from("hello, world")));
            assert.deepStrictEqual(
                String(err1),
                "TypeError: parameters.text is expected to be a string, but a Buffer is given"
            );

            // @ts-ignore
            const result5 = await example.test5(true, "extra note");
            assert.deepStrictEqual(result5, { args: [true] });

            // @ts-ignore
            const [err2] = await _try(() => example.test5("hello, world"));
            assert.deepStrictEqual(
                String(err2),
                "TypeError: parameters.ok is expected to be a boolean, but a string is given"
            );
        });

        it("should constrain the method to accept no arguments", () => {
            class Example {
                @param(Void)
                test() {
                    return { args: [...arguments] };
                }
            }

            const example = new Example();

            const result1 = example.test();
            assert.deepStrictEqual(result1, { args: [] });

            // @ts-ignore
            const result2 = example.test("hello, world");
            assert.deepStrictEqual(result2, { args: [] });
        });

        it("should keep original function signature after using the decorator", () => {
            class Example {
                @param(String, "text")
                test1(text: string) {
                    return { args: [...arguments] };
                }
            }

            const example = new Example();

            assert.strictEqual(example.test1.name, "test1");
            assert.strictEqual(example.test1.length, 1);
            assert.strictEqual(example.test1.toString(), `test1(text) {
                    return { args: [...arguments] };
                }`);

            assert.strictEqual(Example.prototype.test1.name, "test1");
            assert.strictEqual(Example.prototype.test1.length, 1);
            assert.strictEqual(Example.prototype.test1.toString(), `test1(text) {
                    return { args: [...arguments] };
                }`);
        });

        it("should trace the correct call stack after using the decorator", async () => {
            class Example {
                @param(String, "text")
                test1(text: string) {
                    return { args: [...arguments] };
                }

                @param(String, "text")
                async test2(text: string) {
                    return await Promise.resolve({ args: [...arguments] });
                }
            }

            const example = new Example();
            // @ts-ignore
            const [err1] = _try(() => example.test1(Buffer.from("hello, world!")));
            assert.strictEqual(
                String(err1),
                "TypeError: parameters.text is expected to be a string, but a Buffer is given"
            );
            assert.strictEqual(err1.stack?.split("\n")[1], `    at ${__filename}:178:47`);

            // @ts-ignore
            const [err2] = await _try(() => example.test2(Buffer.from("hello, world!")));
            assert.strictEqual(
                String(err2),
                "TypeError: parameters.text is expected to be a string, but a Buffer is given"
            );
            assert.strictEqual(err2.stack?.split("\n")[1], `    at ${__filename}:186:53`);
        });
    });

    describe("@returns", () => {
        it("should constrain the method to return values of specific types", async () => {
            class Example {
                @returns(String)
                test1() {
                    return "hello, world!";
                }

                @returns(Number)
                test2() {
                    return "123";
                }

                @returns(Boolean)
                test3() {
                    return Buffer.from([]);
                }

                @returns(Number)
                async test4() {
                    return await Promise.resolve("123");
                }

                @returns(Boolean)
                async test5() {
                    return await Promise.resolve(Buffer.from([]));
                }
            }

            const example = new Example();

            const result1 = example.test1();
            assert.strictEqual(result1, "hello, world!");

            const result2 = example.test2();
            assert.strictEqual(result2, 123);

            const [err1] = _try(() => example.test3());
            assert.strictEqual(
                String(err1),
                "TypeError: returns is expected to be a boolean, but a Buffer is given"
            );

            const result3 = await example.test4();
            assert.strictEqual(result3, 123);

            const [err2] = await _try(() => example.test5());
            assert.strictEqual(
                String(err2),
                "TypeError: returns is expected to be a boolean, but a Buffer is given"
            );
        });

        it("should constrain the method to have no return value", () => {
            class Example {
                @returns(Void)
                test1() {
                    return;
                }

                @returns(Void)
                test2() {
                    return "hello, world!";
                }
            }

            const example = new Example();

            const result1 = example.test1();
            assert.deepStrictEqual(result1, void 0);

            const [err1] = _try(() => example.test2());
            assert.strictEqual(
                String(err1),
                "TypeError: returns is expected to be void, but a string is given"
            );
        });

        it("should keep original function signature after using the decorator", () => {
            class Example {
                @returns(String)
                test1() {
                    return "hello, world!";
                }
            }

            const example = new Example();

            assert.strictEqual(example.test1.name, "test1");
            assert.strictEqual(example.test1.length, 0);
            assert.strictEqual(example.test1.toString(), `test1() {
                    return "hello, world!";
                }`);

            assert.strictEqual(Example.prototype.test1.name, "test1");
            assert.strictEqual(Example.prototype.test1.length, 0);
            assert.strictEqual(Example.prototype.test1.toString(), `test1() {
                    return "hello, world!";
                }`);
        });

        it("should trace the correct call stack after using the decorator", async () => {
            class Example {
                @returns(String)
                test1() {
                    return Buffer.from("hello, world!");
                }

                @returns(String)
                async test2() {
                    return await Promise.resolve(Buffer.from("hello, world!"));
                }
            }

            const example = new Example();
            // @ts-ignore
            const [err1] = _try(() => example.test1(Buffer.from("hello, world!")));
            assert.strictEqual(
                String(err1),
                "TypeError: returns is expected to be a string, but a Buffer is given"
            );
            assert.strictEqual(err1.stack?.split("\n")[1], `    at ${__filename}:311:47`);

            // @ts-ignore
            const [err2] = await _try(() => example.test2(Buffer.from("hello, world!")));
            assert.strictEqual(
                String(err2),
                "TypeError: returns is expected to be a string, but a Buffer is given"
            );
            assert.strictEqual(err2.stack?.split("\n")[1], `    at async Context.<anonymous> (${__filename}:319:28)`);
        });
    });

    describe("@throws", () => {
        it("should constrain the method to throw specific types of error", async () => {
            class Example {
                @throws(ReferenceError)
                test1() {
                    throw new ReferenceError("shall not use this");
                }

                @throws(ReferenceError)
                test2() {
                    throw new TypeError("type is incorrect");
                }

                @throws(as(ReferenceError, TypeError))
                test3() {
                    throw new TypeError("type is incorrect");
                }

                @throws(as(ReferenceError, TypeError))
                test4() {
                    throw new RangeError("out of range");
                }

                @throws(String)
                test5() {
                    throw "something went wrong";
                }

                @throws(String)
                test6() {
                    throw new Error("something went wrong");
                }

                @throws(ReferenceError)
                async test7() {
                    await Promise.resolve(null);
                    throw new ReferenceError("shall not use this");
                }

                @throws(ReferenceError)
                async test8() {
                    await Promise.resolve(null);
                    throw new TypeError("type is incorrect");
                }
            }

            const example = new Example();

            const [err1] = _try(() => example.test1());
            assert.strictEqual(String(err1), "ReferenceError: shall not use this");

            const [err2] = _try(() => example.test2());
            assert.strictEqual(
                String(err2),
                "TypeError: throws is expected to be a ReferenceError, but a TypeError is given"
            );

            const [err3] = _try(() => example.test3());
            assert.strictEqual(String(err3), "TypeError: type is incorrect");

            const [err4] = _try(() => example.test4());
            assert.strictEqual(
                String(err4),
                "TypeError: throws is expected to be a ReferenceError or TypeError, but a RangeError is given"
            );

            const [err5] = _try(() => example.test5());
            assert.strictEqual(String(err5), "something went wrong");

            const [err6] = _try(() => example.test6());
            assert.strictEqual(
                String(err6),
                "TypeError: throws is expected to be a string, but an Error is given"
            );

            const [err7] = await _try(() => example.test7());
            assert.strictEqual(String(err7), "ReferenceError: shall not use this");

            const [err8] = await _try(() => example.test8());
            assert.strictEqual(
                String(err8),
                "TypeError: throws is expected to be a ReferenceError, but a TypeError is given"
            );
        });

        it("should keep original function signature after using the decorator", () => {
            class Example {
                @throws(ReferenceError)
                test1() {
                    throw new ReferenceError("shall not use this");
                }
            }

            const example = new Example();

            assert.strictEqual(example.test1.name, "test1");
            assert.strictEqual(example.test1.length, 0);
            assert.strictEqual(example.test1.toString(), `test1() {
                    throw new ReferenceError("shall not use this");
                }`);

            assert.strictEqual(Example.prototype.test1.name, "test1");
            assert.strictEqual(Example.prototype.test1.length, 0);
            assert.strictEqual(Example.prototype.test1.toString(), `test1() {
                    throw new ReferenceError("shall not use this");
                }`);
        });

        it("should trace the correct call stack after using the decorator", async () => {
            class Example {
                @throws(ReferenceError)
                test1() {
                    throw new ReferenceError("shall not use this");
                }

                @throws(ReferenceError)
                test2() {
                    throw new TypeError("type is incorrect");
                }

                test3() {
                    throw new ReferenceError("shall not use this");
                }

                @throws(ReferenceError)
                async test4() {
                    await Promise.resolve(null);
                    throw new ReferenceError("shall not use this");
                }

                @throws(ReferenceError)
                async test5() {
                    await Promise.resolve(null);
                    throw new TypeError("type is incorrect");
                }
            }

            const example = new Example();

            const [err1] = _try(() => example.test1());
            assert.strictEqual(String(err1), "ReferenceError: shall not use this");
            assert.strictEqual(err1.stack?.split("\n")[1], `    at Example.test1 (${__filename}:440:27)`);

            const [err2] = _try(() => example.test2());
            assert.strictEqual(
                String(err2),
                "TypeError: throws is expected to be a ReferenceError, but a TypeError is given"
            );
            assert.strictEqual(err2.stack?.split("\n")[1], `    at ${__filename}:471:47`);

            const [err3] = _try(() => example.test3());
            assert.strictEqual(String(err3), "ReferenceError: shall not use this");
            assert.strictEqual(err3.stack?.split("\n")[1], `    at Example.test3 (${__filename}:449:27)`);

            // @ts-ignore
            const [err4] = await _try(() => example.test4());
            assert.strictEqual(String(err4), "ReferenceError: shall not use this");
            assert.strictEqual(err4.stack?.split("\n")[1], `    at Example.test4 (${__filename}:455:27)`);

            // @ts-ignore
            const result = await _try(() => example.test5());
            const [err5] = result;
            assert.strictEqual(
                String(err5),
                "TypeError: throws is expected to be a ReferenceError, but a TypeError is given"
            );
            assert.strictEqual(err5.stack?.split("\n")[1], `    at async Context.<anonymous> (${__filename}:488:28)`);
        });
    });

    describe("@deprecated", () => {
        it("should deprecated the method with a message", () => {
            class Example {
                @deprecated("use test3() instead")
                test1() {
                    return this.test3();
                }

                @deprecated()
                test2() {
                    return this.test3();
                }

                test3() {
                    return "hello, world!";
                }
            }

            const example = new Example();

            const result1 = example.test1();
            assert.strictEqual(result1, "hello, world!");

            const result2 = example.test2();
            assert.strictEqual(result2, "hello, world!");
        });

        it("should keep original function signature after using the decorator", () => {
            class Example {
                @deprecated("use test3() instead")
                test1() {
                    return "hello, world!";
                }
            }

            const example = new Example();

            assert.strictEqual(example.test1.name, "test1");
            assert.strictEqual(example.test1.length, 0);
            assert.strictEqual(example.test1.toString(), `test1() {
                    return "hello, world!";
                }`);

            assert.strictEqual(Example.prototype.test1.name, "test1");
            assert.strictEqual(Example.prototype.test1.length, 0);
            assert.strictEqual(Example.prototype.test1.toString(), `test1() {
                    return "hello, world!";
                }`);
        });
    });

    describe("@remarks", () => {
        it("should keep original function signature after using the decorator", () => {
            class Example {
                @remarks("this function does something")
                test1() {
                    return "hello, world!";
                }
            }

            const example = new Example();

            assert.strictEqual(example.test1.name, "test1");
            assert.strictEqual(example.test1.length, 0);
            assert.strictEqual(example.test1.toString(), `test1() {
                    return "hello, world!";
                }`);

            assert.strictEqual(Example.prototype.test1.name, "test1");
            assert.strictEqual(Example.prototype.test1.length, 0);
            assert.strictEqual(Example.prototype.test1.toString(), `test1() {
                    return "hello, world!";
                }`);
        });
    });
});
