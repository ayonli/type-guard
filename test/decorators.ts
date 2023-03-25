import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { param, returns, setWarningHandler, ValidationWarning, Void } from "..";

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
            }
        ] as ValidationWarning[]);
    });

    describe("@param()", () => {
        it("should constrain the method to accept values of specific types", () => {
            class Example {
                @param(String, "text")
                // @ts-ignore
                test1(text: string) {
                    return { args: [...arguments] };
                }

                @param(Number, "num")
                // @ts-ignore
                test2(num: Number) {
                    return { args: [...arguments] };
                }

                @param("date", Date)
                // @ts-ignore
                test3(date: string) {
                    return { args: [...arguments] };
                }

                @param("ok", Boolean)
                // @ts-ignore
                test4(ok: boolean) {
                    return { args: [...arguments] };
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
        });

        it("should constrain the method to accept no arguments", () => {
            class Example {
                @param(Void)
                // @ts-ignore
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
    });

    describe("@returns", () => {
        it("should constrain the method to return values of specific types", () => {
            class Example {
                @returns(String)
                // @ts-ignore
                test1() {
                    return "hello, world!";
                }

                @returns(Number)
                // @ts-ignore
                test2() {
                    return "123";
                }

                @returns(Boolean)
                // @ts-ignore
                test3() {
                    return Buffer.from([]);
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
        });

        it("should constrain the method to have no return value", () => {
            class Example {
                @returns(Void)
                // @ts-ignore
                test1() {
                    return;
                }

                @returns(Void)
                // @ts-ignore
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
    });
});
