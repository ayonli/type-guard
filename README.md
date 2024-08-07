# Type Guard

Runtime type checking for JavaScript variables and functions.

*Inspired by TypeScript, JSDoc and JSON Schema.*

## Table of Contents

- [Install](#install)
- [But Why?](#but-why)
    - [Vulnerable Code](#vulnerable-code)
    - [Optimized Code](#optimized-code)
- [Concept](#concept)
- [Extends JavaScript Basic Type Constructors](#extends-javascript-basic-type-constructors)
    - [Core Types](#core-types)
    - [Additional Types](#additional-types)
- [Core Features](#core-features)
- [String Specials](#string-specials)
- [Number Specials](#number-specials)
- [BigInt Specials](#bigint-specials)
- [Array Specials](#array-specials)
- [CustomType Specials](#customtype-specials)
- [as()](#as)
    - [Example of CustomType](#example-of-customtype)
    - [Example of UnionType and TupleType](#example-of-uniontype-and-tupletype)
- [Decorators](#decorators)
- [Validation](#validation)
    - [Dealing With TS2589 Error](#dealing-with-ts2589-error)
- [Set Warning Handler](#set-warning-handler)
- [Advanced Usage](#advanced-usage)
    - [Extending Types or Intersection Types](#extending-types-or-intersection-types)
    - [Generic Types](#generic-types)
- [Utility Functions](#utility-functions)
    - [Utility Types](#utility-types)
- [Working with Common Functions](#working-with-common-functions)
- [Working with JSON Schema](#working-with-json-schema)
    - [JSON Schema for Functions](#json-schema-for-functions)

## Install

```sh
npm i @ayonli/type-guard
```


## But Why?

Why do we need this? Since we already have TypeScript.

Well, TypeScript can only guarantee your code during compile-time, but imaging
your function is called remotely, especially when designing an API. Just look
this piece of code:

### Vulnerable Code

```ts
export default class ExampleApi {
    async sum(data: { num1: number; num2: number; }) {
        return { result: data.num1 + data.num2 };
    }
}
```

Looks perfect. However, what if an HTTP client is trying to call the function
with malformed input:

```http
POST /api/ExampleApi.echo

Content-Type: application/json

{"num1":"100","num2":"200"}
```

Things could turn out ugly. We cannot guarantee what kind of data the client
may provide, especially when it's in a different programming language.

So how do we solve this? This is where Type-Guard comes in.

### Optimized Code

```ts
import { param, returns } from "@ayonli/type-guard";

export default class ExampleApi {
    @param({ num1: Number, num2: Number }, "data")
    @returns({ result: Number })
    async sum(data: { num1: number; num2: number; }) {
        return { result: data.num1 + data.num2 };
    }
}
```

Now the program will run properly.

## Concept

Type-Guard provides a security layer for the data provided by unknown input
source. It converts any thing it recognizes, and report errors when they are not
compatible.

## Extends JavaScript Basic Type Constructors

Type-Guard adds a set of keywords to the general type constructors like
`String`, `Number`, `Boolean`, etc. for type constraints. We can group them to
form schema-like type definitions, and reuse them anywhere we want.

### Core Types

- `String`
- `Number` and `BigInt`
- `Boolean`
- `Date`
- `Object` for objects (exclude array)
- `Array` for an array of any type of items
- `{}` and `[]` literals are used to define deep structures
  - Specifically, an empty `[]` literal serves as the same as `Array`


### Additional Types

These types can be imported from this package:

- `Dict(Key, Value)` the value is of `Record<K, V>`
- `Any` the value can be anything (except `null` and `undefined`)
- `Void` the value is `null` or `undefined`. This type are mainly for functions
    that takes no argument or returns nothing. For example:
    - `@param(Void)` will constrain the method to take no argument.
    - `@returns(Void)` will constrain the method to return nothing.

And these abstract types can be created via the wrapper function `as()`:

- `CustomType`
- `UnionType`
- `TupleType`

## Core Features

- `optional` Marks the current variable/property/parameter as optional.
- `required` Marks the current variable/property/parameter as required. NOTE: by
    default, the variable/property/parameter is required, this option is used to
    remark an optional type when it is reused somewhere else.
- `default(value)` Sets the default value for the current
    variable/property/parameter when it is omitted. NOTE: this function will
    implicitly force `optional`.
- `remarks(note: string)` Adds a remark message to the variable/property/parameter.
    This could be useful when generating JSON Schema.
- `deprecated(message?: string)` Marks the current variable/property/parameter
    as deprecated and provide a message.
- `alternatives(...props: string[])` Sets the current property and other
    properties to be alternatives, and only one of them are required. This
    function must be used along with `optional` keyword and only have to be
    set on one of the alternative properties.
- `associates(...props: string[])` Sets the current property to be associated
    with other properties, if this property is set, all others must be provided
    as well.

*All these keywords are chainable, we can use several of them to form a*
*specific constraint.*

```ts
import { as, Any, Dict, Void } from "@ayonli/type-guard";

const Str1 = String.optional; // an optional string
const Str2 = String.default(""); // an optional string with default value ''

const Structure = {
    str1: Str1, // reuse the type definition
    str2: Str2.required, // Str2 is optional, but we want 'str2' to be required
    num1: Number.optional.deprecated("use 'num2' instead"), // deprecated with message
    num2: Number.optional.alternatives("num3"), // 'num2' and 'num3' are alternatives
    num3: BigInt.optional.associates("bool1"), // 'num3' must be paired with 'bool1'
    bool1: Boolean,
    bool2: Boolean.default(false), // optional boolean type with default value: false
    date1: Date,
    date2: Date.optional,
    obj1: { // deep structures are supported and unlimited
        // ...
    },
    obj2: as({ // use as().optional to form an optional object literal structure
        // ...
    }).optional,
    arr1: [String].default([]), // array can use these features directly
    arr2: [String, Number, BigInt], // array of many types: (string | number | bigint)[]
    arr3: [], // array of any types: any[]
    arr4: Array(String), // is the same as [String]
    arr5: Array, // is the same as []
    union1: as(String, Number), // as() can be used to form Union Types: string | number
    tuple1: as([String, Number] as const), // as() can be used to form tuples: [string, number]
    my1: MyClass, // custom types are supported
    my2: as(MyClass).optional, // use as().optional to form an optional custom type
    any: Any, // any type of value
    obj: Object, // object type
    dict1: Dict(String, Number), // equivalent to Record<string, number> in TypeScript
    dict2: Dict(String.enum(["foo", "bar"] as const), String), // Record<"foo" | "bar", number>
    nil: Void, // void type: null or undefined
    const1: "hello" as const, // string constant
    const2: 100 as const, // number constant
};
```

*Each reference of the keywords will create a new constraint, so they can be*
*reused without worrying about context pollution. In the above example,*
*`Str2.required` will create a new string constraint and leave the `Str2` untouched.*

## String Specials

Apart from the standard core features, the `String` constructor includes the
following additional properties and methods.

- `minLength(length: number)` Sets the minimal length of the text.
- `maxLength(length: number)` Sets the maximal length of the text.
- `trim` Removes the leading and tailing spaces of the text.
- `spaceless` Removes all spaces of the text.
- `lowercase` Converts the text to lower-case style.
- `uppercase` Converts the text to upper-case style.
- `enum(values: string[])` Sets the enum options of which the text
    can be.
- `match(pattern)` Sets a pattern to test whether the text fulfills the
    requirements, or sets a custom function to do the test. `pattern` can be
    one of this values:
    - `email` Standard email address with latin characters.
    - `phone` Telephone numbers with various formats.
    - `ip` IPv4 address.
    - `url` Standard URL address with latin characters.
    - `hostname` Standard hostname with latin characters.
    - `date` Date string with format: `YYYY-MM-DD`.
    - `time` Time string with format: `HH:mm:ss` or `HH:mm`.
    - `datetime` Datetime string with format: `YYYY-MM-DD HH:mm:ss`.
    - a regular expression
    - a function with signature `(value: string) => boolean`.

```ts
const Str1 = String.minLength(1).maxLength(100); // string of limited length
const Str2 = String.trim; // string that trims leading and tailing spaces
const Str3 = String.match("phone").spaceless; // phone number with no spaces
const Str4 = String.match("email").lowercase; // email should be lowercased
const Str5 = String.enum(["A", "B", "C"] as const); // enum values/union types: 'A' | 'B' | 'C'
// Pay attention to the `as const` part, this gives us more hints in TypeScript.
```

## Number Specials

Apart from the core features, the `Number` constructor includes the following
additional properties and methods.

- `integer` Restrains the number to be an integer.
- `min(value: number)` Sets the minimal value of the number.
- `max(value: number)` Sets the maximal value of the number.
- `enum(values: number[])` Sets the enum options of which the number can be.

```ts
const Num1 = Number.integer; // number of integer
const Num2 = Number.min(1).max(100); // number of limit range
const Num3 = Number.enum([-1, 0, 1] as const); // enum values/union types: -1 | 0 | 1
// Pay attention to the `as const` part, this gives us more hints in TypeScript.
```

## BigInt Specials

Apart from the core features, the `BigInt` constructor includes the following
additional properties and methods.

- `min(value: bigint)` Sets the minimal value of the number.
- `max(value: bigint)` Sets the maximal value of the number.
- `enum(values: bigint[])` Sets the enum options of which the number can be.

```ts
const Int1 = BigInt.min(1n).max(100n); // number of limit range
const Int2 = BigInt.enum([-1n, 0n, 1n] as const); // enum values/union types: -1n | 0n | 1n
// Pay attention to the `as const` part, this gives us more hints in TypeScript.
```

## Array Specials

Apart from the core features, the array includes the following additional
properties and methods.

- `guard(transform: (data: any, path: string, warnings: ValidationWarning[]) => any)`
    Defines a function that transforms the input data to the desired type.
- `minItems(count: number)` Sets the minimum items of the array.
- `maxItems(count: number)` Sets the maximum items of the array.
- `uniqueItems` Restrains the array to have unique items.

```ts
const Arr1 = [String].minItems(1).maxItems(10).uniqueItems;
```

## CustomType Specials

Apart from the core features, the CustomType include the following additional
properties and methods.

- `guard(transform: (data: any, path: string, warnings: ValidationWarning[]) => any)`
    Defines a function that transforms the input data to the desired type.

## `as()`

By default, any class (aka, type constructors) and object literals can be
directly used for type checking, but they lacks the ability to be optional,
setting default values, or use any other features that general types support.

By wrapping them in the `as()` function, which returns a `CustomType`, we can
bring the additional features to any type constructors we want.

### Example of CustomType

```ts
import { as } from "@ayonli/type-guard";

class Avatar {
    constructor(data: any) {
        Object.assign(this, data);
    }
}

const Type = {
    buf: as(Buffer).optional,
    avatar: as(Avatar).guard(data => data instanceof Avatar ? data : new Avatar(data)),
    obj: as({
        foo: String.optional,
        bar: Number.optional,
    }).default({}),
};
```

`as()` function is also used to create union types and tuples.

### Example of UnionType and TupleType

```ts
import { as } from "@ayonli/type-guard";

const Type = {
    union: as(String, Number), // string | number
    tuple: as([String, Number] as const), // [string, number]
};
```

## Decorators

There are two decorators for most use cases, as long as you're coding in
TypeScript or with Babel.

- `@param(type: any, name?: string, remarks?: string)`
- `@param(name: string, type: any, remarks?: string)` A decorator that
    restrains the input arguments of the method.
    - `type` The type of the argument, can be a class, a type constructor
        (including `as()`), an object or array literal that specifies deep
        structure.
    - `name` The argument name, used to address where the error is reported.
    - `remarks` The remark message of the parameter. Useful when generating JSON
        Schema.

    NOTE: the order of using `@param()` must consist with order of which the
    parameter is present.

    Specifically, `@param(Void)` will constrain the method to take no argument.
- `@returns(type: any, remarks?: string)` A decorator that restrains the
    return value of the method.
    - `type` The type of the return value, can be a class, a type constructor
        (including `as()`), an object or array literal that specifies deep
        structure.
    - `remark` the remark message of the return value.  Useful when generating
        JSON Schema.

    NOTE: if the method returns a Promise, this function restrains the resolved
    value instead.

    Specifically, `@returns(Void)` will constrain the method to return nothing.

There are also other non-frequently used decorators:

- `@throws(type: any)` A decorator that restrains the thrown error of the 
    method. 
    - `type` The type of the thrown error, usually a class or a string.
- `@remarks(note: string)` A decorator that adds remark message to the method.
    Useful when generating JSON Schema.
- `@deprecated(message?: string)` A decorator that deprecates the method and
    emit a warning message when the method is called.
    - `message` The warning message, can be used to provide suggestions.

```ts
import { param, returns, deprecated } from "@ayonli/type-guard";

export default class ExampleApi {
    @param("data", { num1: Number, num2: Number })
    @returns({ result: Number })
    async sum(data: { num1: number; num2: number; }) {
        return { result: data.num1 + data.num2 };
    }

    @deprecated("use sum() instead")
    @param(Number, "num1")
    @param(Number, "num2")
    @returns(Number)
    async oldSum(num1: number, num2: number) {
        return this.sum({ num1, num2 });
    }
}
```

## Validation

Of course, decorators will work without any configuration (except enabling it in
`tsconfig.json`). In other scenarios, we can use the `validate()` function to
check the value we want.

- `validate(value: any, type: any, variable?: string, options?)`
    - `value` The input value that needs to be validated.
    - `type` Can be a class, a type constructor (including `as()`), an object or
        array literal that specifies deep structure.
    - `variable` The variable name that the input value is assigned to, useful
        for reporting errors. If not specified, `$` will be used.
    - `options`
        - `strict?: boolean` Use strict mode, will disable any implicit type
            conversion.
        - `suppress?: boolean` Suppress non-critical errors as warnings, or
            suppress unknown property/item removing warnings (when enabled).
        - `warnings?: ValidationWarning[]` A list used to
            store all the warnings occurred during the validation process.
        - `removeUnknownItems?: boolean` Remove unknown properties in the object
            or the items that exceed the length limit of the array.

NOTE: Both `@param()` and `@returns()` will set `removeUnknownItems` to `true`.
`@returns()` sets `suppress` as well.

```ts 
import { validate, as } from "@ayonli/type-guard";

const str = "Hello, World!";
validate(str, String, "str"); // => "Hello, World!";
validate(str, Number, "str"); // throw type error

const num = 123;
validate(num, Number, "num"); // => 123
validate(num, String, "num"); // => "123"
validate(num, String, "num", { strict: true}); // throw type error

class MyClass {}

const obj = { str: "Hello, World!", num: [123] };
validate(obj, {
    str: String,
    num: [Number],
    bool: Boolean.default(false),
    date: Date.optional,
    // @ts-ignore
    deep: as({
        buf: as(Buffer).default(Buffer.from("")),
        deeper: [{
           foo1: Uint8Array,
           bar2: MyClass,
        }].optional
    }).optional,
}, "obj"); // => { str: "Hello, World!", num: [123], bool: false }
```

### Dealing With TS2589 Error

Sometimes when calling the `as()` function, the `validate()` function,
the `def()` function, or using the `ExtractInstanceType<T>` (the real reason)
utility type, the TypeScript compiler may throw an error:

```
error TS2589: Type instantiation is excessively deep and possibly infinite.
```

This error just says that the compiler detects some recursive type inference is
very deep (exceeding the limit of 50 recursions, as mentioned
[here](https://github.com/microsoft/TypeScript/issues/34933#issuecomment-552500444)),
and to prevent possible infinite call stack (which is not), it stops the
compilation process, we can simply use `// @ts-ignore` directive to bypass the
error and continue, just as the above example shows.

## Set Warning Handler

All decorators emit warnings during validation process, by default, warnings are
logged to the stdout/console, but if the function is called as an HTTP API, we
may want to attach the warnings to the response so the client can adjust its
calls.

```ts
import { setWarningHandler } from "@ayonli/type-guard";

export default class ApiController {
    // All API controllers are inherited from the base ApiController.
}

function isApiResponse(returns: any) {
    return returns
        && typeof returns === "object"
        && typeof returns["code"] === "number"
        && ("data" in returns || "message" in returns);
}

setWarningHandler(function (this, warnings, returns) {
    if (warnings.length && (this instanceof ApiController) && isApiResponse(returns)) {
        returns["warnings"] ??= [];
        (returns["warnings"] as string[]).push(...warnings.map(item => item.message));
    } else {
        for (const { message } of warnings) {
            console.warn(message);
        }
    }
});
```

## Advanced Usage

### Extending Types or Intersection Types

Since the type structure is just a plain object, you can reuse them via spread
syntax (`...`) to extend types.

```ts
const BaseType = {
    str: String,
    num: Number,
};

const ChildType = {
    ...BaseType,
    bool: Boolean,
    date: Date,
};

// Which is similar to:

type BaseType = {
    str: string;
    num: number;
}

type ChildType = BaseType & {
    bool: boolean;
    date: Date;
};

// or:
interface BaseType {
    str: string;
    num: number;
}

interface ChildType extends BaseType {
    bool: boolean;
    date: Date;
}
```

### Generic Types

Even more, you can use functions to achieve generic types.

```ts
import { as, param, returns } from "@ayonli/type-guard";

export type ApiResponse<T> = {
    code: number;
    data?: T;
    message?: string;
    warnings?: string[];
}
export function ApiResponse<T>(data: T) {
    return {
        code: Number,
        data: !Array.isArray(data)
            ? as(data).optional // as() can wrap anything, actually
            : data.optional, // but do not wrap an array since as() treats it as tuple
        message: String.optional,
        warnings: [String].optional,
    };
}

class ExampleApi extends ApiController {
    @param(Number, "num1")
    @param(Number, "num2")
    @param(Number.optional, "num3")
    @returns(ApiResponse(Number))
    async sum(num1: number, num2: number, num3?: number): Promise<ApiResponse<number>> {
        return {
            code: 0,
            data: num1 + num2 + (num3 || 0),
        };
    }
}
```

## Utility Functions

This package also comes with several utility functions which we can use to
achieve similar functionalities of their TypeScript equivalents.

- `partial(type: T extends (Record<string, unknown> | DictType<IndexableType, unknown>))`
- `required(type: T extends Record<string, unknown>)`
- `optional<T extends Record<string, unknown>, K extends keyof T>(type: T, props: K[])`
- `ensured<T extends Record<string, unknown>, K extends keyof T>(type: T, props: K[])`

And we can also use `pick` and `omit` from [JsExt](https://github.com/ayonli/jsext).

```ts
import { partial, required, optional, ensured } from "@ayonli/type-guard";
import { pick, omit } from "@ayonli/jsext/object";

const Type = {
    foo: String,
    bar: Number,
};

const Type1 = partial(Type); // => { foo: String.optional, bar: Number.optional }

const Type2 = required(Type1);
// => { foo: String.optional.required, bar: Number.optional.required }

const Type3 = optional(Type, ["bar"]); // => { foo: String, bar: Number.optional }

const Type4 = ensured(Type1, ["bar"]);
// => { foo: String.optional, bar: Number.optional.required }

const Type5 = pick(Type, ["foo"]); // => { foo: String }

const Type6 = omit(Type, ["foo"]); // => { bar: Number }
```

### Utility Types

For better TypeScript integration, there is also a useful utility type that we
can use to infer type from a JavaScript type definition.

- `ExtractInstanceType<T>`

```ts
import { ExtractInstanceType } from "@ayonli/type-guard";

type MyStringType = ExtractInstanceType<typeof String>;
// will resolve in: string

const MyStringEnum = String.enum(["A", "B", "C"] as const);
type MyStringEnum = ExtractInstanceType<typeof MyStringEnum>;
// will resolve in: "A" | "B" | "C";

const Struct = {
    foo: String,
    bar: Number.optional,
    deep: {
        foo1: Date,
        bar2: Object.optional,
    },
};
type Struct = ExtractInstanceType<typeof Struct>;
// will resolve in: { foo: string; bar?: number; deep: { foo1: Date; bar2?: object; } }
```

## Working with Common Functions

Well, decorators only work on class methods, if we want to use type validation
in common functions, there are two ways to do so:

1. Use `decorate()` function to simulate decorator features on a function.
2. Use `def()` function to create a wrapped function with type checking features.

```ts
import { decorate, def, param, returns } from "@ayonli/type-guard";

const sum = decorate(
    param("num1", Number),
    param("num2", Number),
    param("num3", Number.optional),
    returns(Number)
)(function sum(num1: number, num2: number, num3?: number) {
    return num1 + num2 + (num3 ?? 0);
});

const sum2 = def(
    ({ num1, num2, num3 }) => { // the actual function
        return num1 + num2 + (num3 ?? 0);
    },
    [{ num1: Number, num2: Number, num3: Number.optional }] as const, // parameters
    Number // returns
);
```

## Working with JSON Schema

The type definition can be easily converted to JSON Schema, and exported to
other clients or languages for wider adoption.

```ts
import { getJSONSchema } from "@ayonli/type-guard";

const Article = {
    id: Number.remarks("The ID of article"),
    title: String.remarks("The title of the article"),
    content: String.remarks("The content of the article"),
    status: String.enum(["created", "published", "archived"] as const).remarks("The status of the article"),
    tags: [String].optional.remarks("The tags of the article"),
};

const ArticleSchema = getJSONSchema(Article, { // and JSON schema
    $id: "https://myapi.com/article.schema.json",
    title: "Article",
    description: "",
});
// will generate something like this:
// {
//     "$schema": "https://json-schema.org/draft/2020-12/schema",
//     "$id": "https://myapi.com/article.schema.json",
//     "title": "Article",
//     "type": "object",
//     "description": "",
//     "properties": {
//         "id": {
//             "type": "number",
//             "description": "The ID of article",
//             "enum": null
//         },
//         "title": {
//             "type": "string",
//             "description": "The title of the article",
//             "enum": null,
//             "minLength": 0
//         },
//         "content": {
//             "type": "string",
//             "description": "The content of the article",
//             "enum": null,
//             "minLength": 0
//         },
//         "status": {
//             "type": "string",
//             "description": "The status of the article",
//             "enum": [
//                 "created",
//                 "published",
//                 "archived"
//             ],
//             "minLength": 0
//         },
//         "tags": {
//             "type": "array",
//             "description": "The tags of the article",
//             "items": {
//                 "type": "string"
//             },
//             "minItems": 0,
//             "uniqueItems": false
//         }
//     },
//     "required": [
//         "id",
//         "title",
//         "content",
//         "status"
//     ]
// }
```

### JSON Schema for Functions

As we've used decorators to add constraint features to class methods, it would be
much better if we can annotate the method via plain JSON Schema as an API.
This's why this package also added a `getJSONSchema()` function to the
`Function.prototype`, which retrieves a super schema of the function design.

```ts
import { ExtractInstanceType, remarks, param, returns } from "@ayonli/type-guard";

const Article = {
    id: Number.remarks("The ID of article"),
    title: String.remarks("The title of the article"),
    content: String.remarks("The content of the article"),
    status: String.enum(["created", "published", "archived"] as const).remarks("The status of the article"),
    tags: [String].optional.remarks("The tags of the article"),
};
type Article = ExtractInstanceType<typeof Article>;

class ArticleController {
    @remarks("Create a new article")
    @param(Article, "article")
    @returns(Article)
    async create(article: Article) {
        return article;
    }
}

console.log(JSON.stringify(ArticleController.prototype.create.getJSONSchema(), null, "    "));
// will output something like this:
// {
//     "$schema": "https://json-schema.org/draft/2020-12/schema",
//     "$id": "ArticleController.create",
//     "title": "ArticleController.create",
//     "type": "function",
//     "description": "Create a new article",
//     "parameters": {
//         "article": {
//             "$schema": "https://json-schema.org/draft/2020-12/schema",
//             "$id": "ArticleController.create.parameters.article",
//             "title": "ArticleController.create.parameters.article",
//             "type": "object",
//             "description": "",
//             "properties": {
//                 // refer to the previous example
//             },
//             "required": [
//                 "id",
//                 "title",
//                 "content",
//                 "status"
//             ]
//         }
//     },
//     "returns": {
//         "$schema": "https://json-schema.org/draft/2020-12/schema",
//         "$id": "ArticleController.create.returns",
//         "title": "ArticleController.create.returns",
//         "type": "object",
//         "description": "",
//         "properties": {
//             // refer to the previous example
//         },
//         "required": [
//             "id",
//             "title",
//             "content",
//             "status"
//         ]
//     }
// }
```
