import * as assert from "assert";
import { describe, it } from "mocha";
import { Any, as, deprecated, Dict, getJSONSchema, param, remarks, returns, StringType, Void } from "..";

Error.stackTraceLimit = 10;

describe("JSONSchema", () => {
    it("should create schema for strings", () => {
        const schema1 = getJSONSchema(String);
        assert.deepStrictEqual(schema1, { type: "string" });

        const schema2 = getJSONSchema(String.remarks("some string"));
        assert.deepStrictEqual(schema2, { type: "string", description: "some string" });

        const schema3 = getJSONSchema(String.default(""));
        assert.deepStrictEqual(schema3, { type: "string", default: "" });

        const schema4 = getJSONSchema(String.deprecated());
        assert.deepStrictEqual(schema4, { type: "string", deprecated: true, });

        const schema5 = getJSONSchema(String.deprecated("no longer functions"));
        assert.deepStrictEqual(schema5, { type: "string", deprecated: true, });

        const schema6 = getJSONSchema(String.minLength(1).maxLength(10));
        assert.deepStrictEqual(schema6, { type: "string", minLength: 1, maxLength: 10 });

        const schema7 = getJSONSchema(String.enum(["hello"] as const));
        assert.deepStrictEqual(schema7, { type: "string", const: "hello" });

        const schema8 = getJSONSchema(String.enum(["hello", "world"] as const));
        assert.deepStrictEqual(schema8, { type: "string", enum: ["hello", "world"] });

        const schema9 = getJSONSchema(String.match("date"));
        assert.deepStrictEqual(schema9, { type: "string", format: "date" });

        const schema10 = getJSONSchema(String.match("datetime"));
        assert.deepStrictEqual(schema10, { type: "string", format: "date-time" });

        const schema11 = getJSONSchema(String.match("email"));
        assert.deepStrictEqual(schema11, { type: "string", format: "email" });

        const schema12 = getJSONSchema(String.match("hostname"));
        assert.deepStrictEqual(schema12, { type: "string", format: "hostname" });

        const schema13 = getJSONSchema(String.match("ip"));
        assert.deepStrictEqual(schema13, { type: "string", format: "ipv4" });

        const schema14 = getJSONSchema(String.match("phone"));
        assert.deepStrictEqual(schema14, { type: "string", pattern: StringType.PhoneRegex.source });

        const schema15 = getJSONSchema(String.match("time"));
        assert.deepStrictEqual(schema15, { type: "string", format: "time" });

        const schema16 = getJSONSchema(String.match("url"));
        assert.deepStrictEqual(schema16, { type: "string", format: "uri" });

        const regex = /[a-z]/;
        const schema17 = getJSONSchema(String.match(regex));
        assert.deepStrictEqual(schema17, { type: "string", pattern: regex.source });
    });

    it("should create schema for numbers", () => {
        const schema1 = getJSONSchema(Number);
        assert.deepStrictEqual(schema1, { type: "number" });

        const schema2 = getJSONSchema(Number.integer);
        assert.deepStrictEqual(schema2, { type: "integer" });

        const schema3 = getJSONSchema(Number.remarks("some number"));
        assert.deepStrictEqual(schema3, { type: "number", description: "some number" });

        const schema4 = getJSONSchema(Number.default(0));
        assert.deepStrictEqual(schema4, { type: "number", default: 0 });

        const schema5 = getJSONSchema(Number.deprecated());
        assert.deepStrictEqual(schema5, { type: "number", deprecated: true });

        const schema6 = getJSONSchema(Number.deprecated("no longer functions"));
        assert.deepStrictEqual(schema6, { type: "number", deprecated: true });

        const schema7 = getJSONSchema(Number.min(0).max(9));
        assert.deepStrictEqual(schema7, { type: "number", minimum: 0, maximum: 9 });

        const schema8 = getJSONSchema(Number.enum([1] as const));
        assert.deepStrictEqual(schema8, { type: "number", const: 1 });

        const schema9 = getJSONSchema(Number.enum([1, 2, 3] as const));
        assert.deepStrictEqual(schema9, { type: "number", enum: [1, 2, 3] });
    });

    it("should create schema for bigints", () => {
        const schema1 = getJSONSchema(BigInt);
        assert.deepStrictEqual(schema1, { type: "integer" });

        const schema3 = getJSONSchema(BigInt.remarks("some number"));
        assert.deepStrictEqual(schema3, { type: "integer", description: "some number" });

        const schema4 = getJSONSchema(BigInt.default(0n));
        assert.deepStrictEqual(schema4, { type: "integer", default: 0 });

        const schema5 = getJSONSchema(BigInt.deprecated());
        assert.deepStrictEqual(schema5, { type: "integer", deprecated: true });

        const schema6 = getJSONSchema(BigInt.deprecated("no longer functions"));
        assert.deepStrictEqual(schema6, { type: "integer", deprecated: true });

        const schema7 = getJSONSchema(BigInt.min(0n).max(9n));
        assert.deepStrictEqual(schema7, { type: "integer", minimum: 0, maximum: 9 });

        const schema8 = getJSONSchema(BigInt.enum([1n] as const));
        assert.deepStrictEqual(schema8, { type: "integer", const: 1 });

        const schema9 = getJSONSchema(BigInt.enum([1n, 2n, 3n] as const));
        assert.deepStrictEqual(schema9, { type: "integer", enum: [1, 2, 3] });
    });

    it("should create schema for booleans", () => {
        const schema1 = getJSONSchema(Boolean);
        assert.deepStrictEqual(schema1, { type: "boolean" });

        const schema2 = getJSONSchema(Boolean.remarks("some boolean"));
        assert.deepStrictEqual(schema2, { type: "boolean", description: "some boolean" });

        const schema3 = getJSONSchema(Boolean.default(false));
        assert.deepStrictEqual(schema3, { type: "boolean", default: false });

        const schema4 = getJSONSchema(Boolean.deprecated());
        assert.deepStrictEqual(schema4, { type: "boolean", deprecated: true });

        const schema5 = getJSONSchema(Boolean.deprecated("no longer functions"));
        assert.deepStrictEqual(schema5, { type: "boolean", deprecated: true });
    });

    it("should create schema for dates", () => {
        const schema1 = getJSONSchema(Date);
        assert.deepStrictEqual(schema1, { type: "string", format: "date-time" });

        const schema2 = getJSONSchema(Date.remarks("some date"));
        assert.deepStrictEqual(schema2, {
            type: "string",
            format: "date-time",
            description: "some date",
        });

        const date = new Date();
        const schema3 = getJSONSchema(Date.default(date));
        assert.deepStrictEqual(schema3, {
            type: "string",
            format: "date-time",
            default: date.toISOString(),
        });

        const schema4 = getJSONSchema(Date.deprecated());
        assert.deepStrictEqual(schema4, {
            type: "string",
            format: "date-time",
            deprecated: true,
        });

        const schema5 = getJSONSchema(Date.deprecated("no longer functions"));
        assert.deepStrictEqual(schema5, {
            type: "string",
            format: "date-time",
            deprecated: true,
        });
    });

    it("should create schema for values of objects", () => {
        const schema1 = getJSONSchema(Object);
        assert.deepStrictEqual(schema1, { type: "object" });

        const schema2 = getJSONSchema(Object.remarks("some object"));
        assert.deepStrictEqual(schema2, { type: "object", description: "some object" });

        const schema3 = getJSONSchema(Object.default(null));
        assert.deepStrictEqual(schema3, { type: "object", default: null });

        const schema4 = getJSONSchema(Object.deprecated());
        assert.deepStrictEqual(schema4, { type: "object", deprecated: true });

        const schema5 = getJSONSchema(Object.deprecated("no longer functions"));
        assert.deepStrictEqual(schema5, { type: "object", deprecated: true });
    });

    it("should create schema for object literals", () => {
        const schema1 = getJSONSchema({ foo: String, bar: Number });
        assert.deepStrictEqual(schema1, {
            type: "object",
            properties: {
                foo: { type: "string" },
                bar: { type: "number" }
            },
            required: ["foo", "bar"],
            additionalProperties: false
        });

        const schema2 = getJSONSchema({ foo: String, bar: Number.optional });
        assert.deepStrictEqual(schema2, {
            type: "object",
            properties: {
                foo: { type: "string" },
                bar: { type: "number" }
            },
            required: ["foo"],
            additionalProperties: false
        });

        const schema3 = getJSONSchema({
            foo: String.enum(["hello", "world"] as const),
            bar: Number.optional.enum([1] as const)
        });
        assert.deepStrictEqual(schema3, {
            type: "object",
            properties: {
                foo: { type: "string", enum: ["hello", "world"] },
                bar: { type: "number", const: 1 }
            },
            required: ["foo"],
            additionalProperties: false
        });

        const schema4 = getJSONSchema(as({ foo: String, bar: Number }).remarks("some data"));
        assert.deepStrictEqual(schema4, {
            type: "object",
            description: "some data",
            properties: {
                foo: { type: "string" },
                bar: { type: "number" }
            },
            required: ["foo", "bar"],
            additionalProperties: false
        });

        // @ts-ignore
        const schema5 = getJSONSchema(as({ foo: String, bar: Number }).default({ foo: "", bar: 0 }));
        assert.deepStrictEqual(schema5, {
            type: "object",
            default: { foo: "", bar: 0 },
            properties: {
                foo: { type: "string" },
                bar: { type: "number" }
            },
            required: ["foo", "bar"],
            additionalProperties: false
        });

        const schema6 = getJSONSchema(as({ foo: String, bar: Number }).deprecated());
        assert.deepStrictEqual(schema6, {
            type: "object",
            deprecated: true,
            properties: {
                foo: { type: "string" },
                bar: { type: "number" }
            },
            required: ["foo", "bar"],
            additionalProperties: false
        });

        const schema7 = getJSONSchema(as({
            foo: String,
            bar: Number,
        }).deprecated("no longer functions"));
        assert.deepStrictEqual(schema7, {
            type: "object",
            deprecated: true,
            properties: {
                foo: { type: "string" },
                bar: { type: "number" }
            },
            required: ["foo", "bar"],
            additionalProperties: false
        });

        const schema8 = getJSONSchema({
            foo: String,
            bar: [Number],
        });
        assert.deepStrictEqual(schema8, {
            type: "object",
            properties: {
                foo: { type: "string" },
                bar: {
                    type: "array",
                    items: { type: "number" },
                },
            },
            required: ["foo", "bar"],
            additionalProperties: false
        });
    });

    it("should create schema for values of any type", () => {
        const anyTypes = ["string", "number", "integer", "boolean", "object", "array", "null"];

        const schema1 = getJSONSchema(Any);
        assert.deepStrictEqual(schema1, { type: anyTypes });

        const schema2 = getJSONSchema(Any.remarks("some value"));
        assert.deepStrictEqual(schema2, { type: anyTypes, description: "some value" });

        const schema3 = getJSONSchema(Any.default(null));
        assert.deepStrictEqual(schema3, { type: anyTypes, default: null });

        const schema4 = getJSONSchema(Any.deprecated());
        assert.deepStrictEqual(schema4, { type: anyTypes, deprecated: true });

        const schema5 = getJSONSchema(Any.deprecated("no longer functions"));
        assert.deepStrictEqual(schema5, { type: anyTypes, deprecated: true });
    });

    it("should create schema for void", () => {
        const schema1 = getJSONSchema(Void);
        assert.deepStrictEqual(schema1, { type: "null" });

        const schema2 = getJSONSchema(Void.remarks("some placeholder"));
        assert.deepStrictEqual(schema2, { type: "null", description: "some placeholder" });

        const schema3 = getJSONSchema(Void.default(null));
        assert.deepStrictEqual(schema3, { type: "null", default: null });

        const schema4 = getJSONSchema(Void.deprecated());
        assert.deepStrictEqual(schema4, { type: "null", deprecated: true });

        const schema5 = getJSONSchema(Void.deprecated("no longer functions"));
        assert.deepStrictEqual(schema5, { type: "null", deprecated: true });
    });

    it("should create schema for custom types", () => {
        const schema1 = getJSONSchema(Buffer);
        assert.deepStrictEqual(schema1, { type: "object" });

        const schema2 = getJSONSchema(as(Buffer));
        assert.deepStrictEqual(schema2, { type: "object" });

        const schema3 = getJSONSchema(as(Buffer).remarks("some buffer"));
        assert.deepStrictEqual(schema3, { type: "object", description: "some buffer" });

        const buf = Buffer.from([]);
        const schema4 = getJSONSchema(as(Buffer).default(buf));
        assert.deepStrictEqual(schema4, { type: "object", default: buf.toJSON() });

        const schema5 = getJSONSchema(as(Buffer).deprecated());
        assert.deepStrictEqual(schema5, { type: "object", deprecated: true });

        const schema6 = getJSONSchema(as(Buffer).deprecated("no longer functions"));
        assert.deepStrictEqual(schema6, { type: "object", deprecated: true });
    });

    it("should create schema for union types", () => {
        const schema1 = getJSONSchema(as(String, Buffer));
        assert.deepStrictEqual(schema1, { type: ["string", "object"] });

        const schema2 = getJSONSchema(as(String, Buffer).remarks("some data"));
        assert.deepStrictEqual(schema2, { type: ["string", "object"], description: "some data" });

        const schema3 = getJSONSchema(as(String, Buffer).default("hello, world"));
        assert.deepStrictEqual(schema3, {
            type: ["string", "object"],
            default: "hello, world",
        });

        const schema4 = getJSONSchema(
            as(String.enum(["hello", "world"] as const), Buffer).default("hello"));
        assert.deepStrictEqual(schema4, {
            type: ["string", "object"],
            default: "hello",
            oneOf: [
                { type: "string", enum: ["hello", "world"] },
                { type: "object" }
            ]
        });

        const schema5 = getJSONSchema(as(String, Buffer).deprecated());
        assert.deepStrictEqual(schema5, {
            type: ["string", "object"],
            deprecated: true,
        });

        const schema6 = getJSONSchema(as(String, Buffer).deprecated("no longer functions"));
        assert.deepStrictEqual(schema6, {
            type: ["string", "object"],
            deprecated: true,
        });
    });

    it("should create schema for constant values", () => {
        const schema1 = getJSONSchema("hello" as const);
        assert.deepStrictEqual(schema1, { type: "string", const: "hello" });

        const schema2 = getJSONSchema(as("hello" as const));
        assert.deepStrictEqual(schema2, { type: "string", const: "hello" });

        const schema3 = getJSONSchema(as("hello" as const, "world" as const));
        assert.deepStrictEqual(schema3, {
            type: "string",
            enum: ["hello", "world"]
        });

        const schema4 = getJSONSchema(as(1 as const, 2 as const));
        assert.deepStrictEqual(schema4, {
            type: "number",
            enum: [1, 2]
        });

        const schema5 = getJSONSchema(as(1n as const, 2n as const));
        assert.deepStrictEqual(schema5, {
            type: "integer",
            enum: [1, 2]
        });

        const schema6 = getJSONSchema(as(true as const, false as const));
        assert.deepStrictEqual(schema6, { type: "boolean" });

        const schema7 = getJSONSchema(as(
            "hello" as const,
            "world" as const,
            1 as const,
            true as const
        ));
        assert.deepStrictEqual(schema7, {
            type: ["string", "number", "boolean"],
            oneOf: [
                { type: "string", const: "hello" },
                { type: "string", const: "world" },
                { type: "number", const: 1 },
                { type: "boolean", const: true }
            ],
        });

        const schema8 = getJSONSchema(as(1 as const).remarks("some value"));
        assert.deepStrictEqual(schema8, {
            type: "number",
            const: 1,
            description: "some value",
        });

        const schema9 = getJSONSchema(as(true as const).deprecated());
        assert.deepStrictEqual(schema9, {
            type: "boolean",
            const: true,
            deprecated: true,
        });

        const schema10 = getJSONSchema(as(1n as const).deprecated("no longer functions"));
        assert.deepStrictEqual(schema10, {
            type: "integer",
            const: 1,
            deprecated: true,
        });
    });

    it("should create schema for dict objects", () => {
        const schema1 = getJSONSchema(Dict(String, Number));
        assert.deepStrictEqual(schema1, { type: "object" });

        const schema2 = getJSONSchema(Dict(String.enum(["foo", "bar"] as const), Number));
        assert.deepStrictEqual(schema2, {
            type: "object",
            properties: {
                foo: { type: "number" },
                bar: { type: "number" }
            },
            required: ["foo", "bar"],
            additionalProperties: false,
        });

        const schema3 = getJSONSchema(Dict(String, Number.enum([0, 1] as const)));
        assert.deepStrictEqual(schema3, { type: "object" });

        const schema4 = getJSONSchema(Dict(
            String.enum(["foo", "bar"] as const),
            Number.enum([0, 1] as const)
        ));
        assert.deepStrictEqual(schema4, {
            type: "object",
            properties: {
                foo: { type: "number", enum: [0, 1] },
                bar: { type: "number", enum: [0, 1] }
            },
            required: ["foo", "bar"],
            additionalProperties: false,
        });

        const schema5 = getJSONSchema(Dict(
            String.enum(["foo", "bar"] as const),
            as(String, Number)
        ));
        assert.deepStrictEqual(schema5, {
            type: "object",
            properties: {
                foo: { type: ["string", "number"] },
                bar: { type: ["string", "number"] }
            },
            required: ["foo", "bar"],
            additionalProperties: false,
        });

        const schema6 = getJSONSchema(Dict(String, Number).remarks("some data"));
        assert.deepStrictEqual(schema6, { type: "object", description: "some data" });

        const schema7 = getJSONSchema(Dict(String, Number).default({ foo: 1 }));
        assert.deepStrictEqual(schema7, { type: "object", default: { foo: 1 } });

        const schema8 = getJSONSchema(Dict(String, Number).deprecated());
        assert.deepStrictEqual(schema8, { type: "object", deprecated: true });

        const schema9 = getJSONSchema(Dict(String, Number).deprecated("no longer functions"));
        assert.deepStrictEqual(schema9, { type: "object", deprecated: true });
    });

    it("should create schema for values of arrays", () => {
        const schema1 = getJSONSchema(Array);
        assert.deepStrictEqual(schema1, { type: "array" });

        const schema2 = getJSONSchema(Array.remarks("some object"));
        assert.deepStrictEqual(schema2, { type: "array", description: "some object" });

        const schema3 = getJSONSchema(Array.default([]));
        assert.deepStrictEqual(schema3, { type: "array", default: [] });

        const schema4 = getJSONSchema(Array.deprecated());
        assert.deepStrictEqual(schema4, { type: "array", deprecated: true });

        const schema5 = getJSONSchema(Array.deprecated("no longer functions"));
        assert.deepStrictEqual(schema5, { type: "array", deprecated: true });

        const schema6 = getJSONSchema(Array(String));
        assert.deepStrictEqual(schema6, { type: "array", items: { type: "string" } });
    });

    it("should create schema for array literals", () => {
        const schema1 = getJSONSchema([]);
        assert.deepStrictEqual(schema1, { type: "array" });

        const schema2 = getJSONSchema([Any]);
        assert.deepStrictEqual(schema2, { type: "array" });

        const schema3 = getJSONSchema([String]);
        assert.deepStrictEqual(schema3, { type: "array", items: { type: "string" } });

        const schema4 = getJSONSchema([String, Number]);
        assert.deepStrictEqual(schema4, { type: "array", items: { type: ["string", "number"] } });

        const schema5 = getJSONSchema([String, Number.enum([1, 2, 3] as const)]);
        assert.deepStrictEqual(schema5, {
            type: "array",
            oneOf: [
                { type: "string" },
                { type: "number", enum: [1, 2, 3] }
            ],
        });

        const schema6 = getJSONSchema(["hello", Number.enum([1, 2, 3] as const)]);
        assert.deepStrictEqual(schema6, {
            type: "array",
            oneOf: [
                { type: "string", const: "hello" },
                { type: "number", enum: [1, 2, 3] }
            ],
        });

        const schema7 = getJSONSchema([String].remarks("some list"));
        assert.deepStrictEqual(schema7, {
            type: "array",
            description: "some list",
            items: { type: "string" }
        });

        const schema8 = getJSONSchema([String].default([]));
        assert.deepStrictEqual(schema8, {
            type: "array",
            default: [],
            items: { type: "string" }
        });

        const schema9 = getJSONSchema([String].deprecated());
        assert.deepStrictEqual(schema9, {
            type: "array",
            deprecated: true,
            items: { type: "string" }
        });

        const schema10 = getJSONSchema([String].deprecated("no longer functions"));
        assert.deepStrictEqual(schema10, {
            type: "array",
            deprecated: true,
            items: { type: "string" }
        });
    });

    it("should create schema for tuples", () => {
        const schema1 = getJSONSchema(as([String, Number] as const));
        assert.deepStrictEqual(schema1, {
            type: "array",
            minItems: 2,
            maxItems: 2,
            prefixItems: [
                { type: "string" },
                { type: "number" }
            ],
        });

        const schema2 = getJSONSchema(as([String, Number.optional] as const));
        assert.deepStrictEqual(schema2, {
            type: "array",
            minItems: 1,
            maxItems: 2,
            prefixItems: [
                { type: "string" },
                { type: "number" }
            ],
        });

        const schema3 = getJSONSchema(as([String, Number] as const).remarks("some tuple"));
        assert.deepStrictEqual(schema3, {
            type: "array",
            description: "some tuple",
            minItems: 2,
            maxItems: 2,
            prefixItems: [
                { type: "string" },
                { type: "number" }
            ],
        });

        const schema4 = getJSONSchema(as([String, Number] as const).default(["", 0]));
        assert.deepStrictEqual(schema4, {
            type: "array",
            default: ["", 0],
            minItems: 2,
            maxItems: 2,
            prefixItems: [
                { type: "string" },
                { type: "number" }
            ],
        });

        const schema5 = getJSONSchema(as([String, Number] as const).deprecated());
        assert.deepStrictEqual(schema5, {
            type: "array",
            deprecated: true,
            minItems: 2,
            maxItems: 2,
            prefixItems: [
                { type: "string" },
                { type: "number" }
            ],
        });

        const schema6 = getJSONSchema(as([String, Number] as const).deprecated("no longer functions"));
        assert.deepStrictEqual(schema6, {
            type: "array",
            deprecated: true,
            minItems: 2,
            maxItems: 2,
            prefixItems: [
                { type: "string" },
                { type: "number" }
            ],
        });
    });

    it("should create a root schema document", () => {
        const $id = "https://example.com/example.schema.json";
        const schema1 = getJSONSchema({
            foo: String,
            bar: [Number].optional,
        }, {
            $id,
        });
        assert.deepStrictEqual(schema1, {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            $id,
            type: "object",
            properties: {
                foo: { type: "string" },
                bar: { type: "array", items: { type: "number" } }
            },
            required: ["foo"],
            additionalProperties: false,
        });

        const schema2 = getJSONSchema({
            foo: String,
            bar: [Number].optional,
        }, {
            $id,
            title: "My Schema",
            description: "This is an example schema",
        });
        assert.deepStrictEqual(schema2, {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            $id,
            title: "My Schema",
            description: "This is an example schema",
            type: "object",
            properties: {
                foo: { type: "string" },
                bar: { type: "array", items: { type: "number" } }
            },
            required: ["foo"],
            additionalProperties: false,
        });
    });

    it("should create a super schema for class method", () => {
        class Example {
            test(text: string) {
                return text;
            }

            @param("data", { text: String })
            @returns({ text: String })
            test1(data: { text: string; }) {
                return data;
            }

            @param(Void)
            @returns({ text: String })
            test2() {
                return { text: "hello, world!" };
            }

            @param("data", { text: String })
            @returns(Void)
            test3(data: { text: string; }) {
                return;
            }

            @remarks("This function does something")
            test4(data: { text: string; }) {
                return data.text;
            }

            @deprecated()
            test5(data: { text: string; }) {
                return data.text;
            }

            @deprecated("will no longer functions")
            test6(data: { text: string; }) {
                return data.text;
            }

            @remarks("This function does something")
            @deprecated("will no longer functions")
            @param("data", { text: String })
            @returns(String)
            test7(data: { text: string; }) {
                return data.text;
            }
        }

        const schema = Example.prototype.test.getJSONSchema();
        assert.strictEqual(schema, null);

        const $schema = "https://json-schema.org/draft/2020-12/schema";
        const schema1 = Example.prototype.test1.getJSONSchema();
        assert.deepStrictEqual(schema1, {
            $schema,
            $id: "Example.test1",
            title: "Example.test1",
            type: "function",
            parameters: {
                data: {
                    $schema,
                    $id: "Example.test1.parameters.data",
                    title: "Example.test1.parameters.data",
                    type: "object",
                    properties: {
                        text: { type: "string" },
                    },
                    required: ["text"],
                    additionalProperties: false,
                },
            },
            returns: {
                $schema,
                $id: "Example.test1.returns",
                title: "Example.test1.returns",
                type: "object",
                properties: {
                    text: { type: "string" },
                },
                required: ["text"],
                additionalProperties: false,
            },
        });

        const schema2 = new Example().test2.getJSONSchema({
            $id: "https://example.com/example.test2.schema.json"
        });
        assert.deepStrictEqual(schema2, {
            $schema,
            $id: "https://example.com/example.test2.schema.json",
            title: "Example.test2",
            type: "function",
            parameters: null,
            returns: {
                $schema,
                $id: "https://example.com/example.test2.returns.schema.json",
                title: "Example.test2.returns",
                type: "object",
                properties: {
                    text: { type: "string" },
                },
                required: ["text"],
                additionalProperties: false,
            },
        });

        const schema3 = new Example().test3.getJSONSchema({
            $id: "https://example.com/example.test3.schema.json",
            title: "example.test3"
        });
        assert.deepStrictEqual(schema3, {
            $schema,
            $id: "https://example.com/example.test3.schema.json",
            title: "example.test3",
            type: "function",
            parameters: {
                data: {
                    $schema,
                    $id: "https://example.com/example.test3.parameters.data.schema.json",
                    title: "example.test3.parameters.data",
                    type: "object",
                    properties: {
                        text: { type: "string" },
                    },
                    required: ["text"],
                    additionalProperties: false,
                },
            },
            returns: null,
        });

        const schema4 = new Example().test4.getJSONSchema({
            $id: "https://example.com/example.test4.schema.json",
            title: "example.test4"
        });
        assert.deepStrictEqual(schema4, {
            $schema,
            $id: "https://example.com/example.test4.schema.json",
            title: "example.test4",
            type: "function",
            description: "This function does something",
            parameters: null,
            returns: null,
        });

        const schema5 = new Example().test5.getJSONSchema({
            $id: "https://example.com/example.test5.schema.json",
            title: "example.test5"
        });
        assert.deepStrictEqual(schema5, {
            $schema,
            $id: "https://example.com/example.test5.schema.json",
            title: "example.test5",
            type: "function",
            deprecated: true,
            parameters: null,
            returns: null,
        });

        const schema6 = new Example().test6.getJSONSchema({
            $id: "https://example.com/example.test6.schema.json",
            title: "example.test6"
        });
        assert.deepStrictEqual(schema6, {
            $schema,
            $id: "https://example.com/example.test6.schema.json",
            title: "example.test6",
            type: "function",
            deprecated: true,
            parameters: null,
            returns: null,
        });

        const schema7 = new Example().test7.getJSONSchema({
            $id: "https://example.com/example.test7.schema.json",
            title: "example.test7"
        });
        assert.deepStrictEqual(schema7, {
            $schema,
            $id: "https://example.com/example.test7.schema.json",
            title: "example.test7",
            type: "function",
            description: "This function does something",
            deprecated: true,
            parameters: {
                data: {
                    $schema,
                    $id: "https://example.com/example.test7.parameters.data.schema.json",
                    title: "example.test7.parameters.data",
                    type: "object",
                    properties: {
                        text: { type: "string" },
                    },
                    required: ["text"],
                    additionalProperties: false,
                },
            },
            returns: {
                $schema,
                $id: "https://example.com/example.test7.returns.schema.json",
                title: "example.test7.returns",
                type: "string",
            },
        });
    });

    it("should handle recursive structure properly", () => {
        type FamilyTree = {
            name: string;
            children: FamilyTree[];
        };
        const FamilyTree = {
            name: String,
            children: null as any,
        };
        FamilyTree["children"] = [FamilyTree];

        const schema1 = getJSONSchema(FamilyTree);
        assert.deepStrictEqual(schema1, {
            type: "object",
            properties: {
                name: { type: "string" },
                children: {
                    type: "array",
                    items: { $ref: "#" },
                },
            },
            required: ["name", "children"],
            additionalProperties: false,
        });

        type LinkedList = {
            data: any;
            next?: LinkedList;
        };
        const LinkedList = {
            data: String,
            next: null as any,
        };
        LinkedList["next"] = as(LinkedList).optional;

        const schema2 = getJSONSchema(LinkedList);
        assert.deepStrictEqual(schema2, {
            type: "object",
            properties: {
                data: { type: "string" },
                next: { $ref: "#" },
            },
            required: ["data"],
            additionalProperties: false,
        });
    });
});
