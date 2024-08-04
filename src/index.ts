import { Constructor } from "@ayonli/jsext/types";
import { omit, pick, isValid } from "@ayonli/jsext/object";

const jsonSchemaDraftLink = "https://json-schema.org/draft/2020-12/schema";
export type JSONSchemaType = "string" | "number" | "integer" | "boolean" | "array" | "object" | "null";
export type JSONSchema = {
    $ref?: string;
    type?: JSONSchemaType | JSONSchemaType[];
    description?: string;
    default?: any;
    deprecated?: boolean;
    [x: string]: any;
};

export abstract class ValidateableType<T> {
    protected _optional = false;
    protected _default: T = void 0;
    protected _remarks: string = void 0;
    protected _deprecated: string = void 0;
    private _alternatives: string[] = null;
    private _associates: string[] = null;

    /**
     * Marks the current variable/property/parameter as required.
     * 
     * NOTE: by default, the variable/property/parameter is required, this
     * option is used to remark an optional type when it is reused somewhere else.
     */
    get required() {
        return this.deriveWith({ _optional: false });
    }

    /** Marks the current variable/property/parameter as optional. */
    abstract get optional(): ThisType<this>;

    /**
     * Sets the default value for the current variable/property/parameter when
     * it is omitted.
     * 
     * NOTE: this function will implicitly force `optional`.
     */
    abstract default(value: ExtractInstanceType<T>): ThisType<this>;

    /** Adds a remark message to the variable/property/parameter. */
    remarks(note: string) {
        return this.deriveWith({ _remarks: note });
    }

    /**
     * Marks the current variable/property/parameter as deprecated and provide
     * a message.
     */
    deprecated(message = "") {
        return this.deriveWith({ _deprecated: message });
    }

    alternatives(): string[];
    /**
     * Sets the current property and other properties to be alternatives, and
     * only one of them are required. This function must be used along with
     * `optional` keyword and only have to be set on one of the alternative
     * properties.
     */
    alternatives(...props: string[]): this;
    alternatives(...props: string[]) {
        if (props.length) {
            return this.deriveWith({ _alternatives: props });
        } else {
            return this._alternatives;
        }
    }

    associates(): string[];
    /**
     * Sets the current property to be associated with other properties, if this
     * property is set, all others must be provided as well.
     */
    associates(...props: string[]): this;
    associates(...props: string[]) {
        if (props.length) {
            return this.deriveWith({ _associates: props });
        } else {
            return this._associates;
        }
    }

    /** @internal */
    validate(path: string, value: any, options: {
        warnings?: ValidationWarning[];
        suppress?: boolean;
    } = null): T | never {
        if (value === null || value === void 0 || Object.is(value, NaN)) {
            if (this._default !== void 0) {
                return this._default;
            } else if (this._optional) {
                return Object.is(value, NaN) ? null : value;
            } else if (!options?.suppress) {
                throw new Error(`${path} is required, but no value is given`);
            }
        } else if (isValid(this._deprecated) && options?.warnings) {
            const message = this._deprecated
                ? `${path} is deprecated: ${this._deprecated}`
                : `${path} is deprecated`;

            if (!options.warnings.some(item => item.path === path && item.message === message)) {
                options.warnings.push({ path, message });
            }
        }

        return value;
    }

    /** @internal */
    abstract toJSONSchema(parent?: any): JSONSchema;

    protected deriveWith(props: object): this;
    protected deriveWith<T>(props: object, ins: T): T;
    protected deriveWith(props: object, ins: any = null) {
        if (!ins) {
            const ctor = this.constructor as Constructor<this>;
            ins = new ctor();
        }

        Object.assign(ins, this, props);
        return ins;
    }

    protected createTypeError(
        path: string,
        value: any,
        expectedType: string | string[],
        asConst = false
    ) {
        const _expectedType = read(expectedType);
        const actualType = readType(value, asConst);

        return new TypeError(
            `${path} is expected to be ${_expectedType}, but ${actualType} is given`
        );
    }

    protected conversionWarning(path: string, value: any, expectedType: string) {
        expectedType = read(expectedType, true);
        const actualType = readType(value);
        return `${actualType} at ${path} has been converted to ${expectedType}`;
    }
}

export class StringType extends ValidateableType<string> {
    private _minLength: number = void 0;
    private _maxLength: number = void 0;
    private _trim = false;
    private _spaceless = false;
    private _lowercase = false;
    private _uppercase = false;
    protected _enum: string[] = null;
    private _match: "email"
        | "phone"
        | "ip"
        | "url"
        | "hostname"
        | "date"
        | "time"
        | "datetime"
        | "uuid"
        | RegExp | ((value: string) => boolean) = null;
    static EmailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    static PhoneRegex = /^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/;
    static IpRegex = /^(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))$/;
    static UrlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
    static HostnameRegex = /^localhost$|^(([a-z0-9A-Z]\.)*[a-z0-9-]+\.)?([a-z0-9]{2,24})+(\.co\.([a-z0-9]{2,24})|\.([a-z0-9]{2,24}))$/;
    static DateRegex = /^(19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)$/;
    static TimeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
    static DatetimeRegex = /^(19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31) ([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
    static UuidRegex = /^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}$/;

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "StringType" {
        return "StringType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalStringType());
    }

    default(value: string) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalStringType());
    }

    /** Sets the minimal length of the text. */
    minLength(length: number) {
        if (length < 0 || !Number.isInteger(length)) {
            throw new RangeError(`length must be a non-negative integer`);
        }

        return this.deriveWith({ _minLength: length });
    }

    /** Sets the maximal length of the text. */
    maxLength(length: number) {
        if (length < 0 || !Number.isInteger(length)) {
            throw new RangeError(`length must be a non-negative integer`);
        }

        return this.deriveWith({ _maxLength: length });
    }

    /** Removes the leading and tailing spaces of the text. */
    get trim() {
        return this.deriveWith({ _trim: true });
    }

    /** Removes all spaces of the text. */
    get spaceless() {
        return this.deriveWith({ _spaceless: true });
    }

    /** Converts the text to lower-case style. */
    get lowercase() {
        return this.deriveWith({ _lowercase: true, _uppercase: false });
    }

    /** Converts the text to upper-case style. */
    get uppercase() {
        return this.deriveWith({ _lowercase: false, _uppercase: true });
    }

    /** Sets the enum options of which the text can be. */
    enum<T>(values: T) {
        return this.deriveWith({ _enum: values }, new StringEnum<T>());
    }

    /**
     * Sets a pattern to test whether the text fulfills the requirements, or
     * sets a custom function to do the test.
     */
    match(pattern: "email"
        | "phone"
        | "ip"
        | "url"
        | "hostname"
        | "date"
        | "time"
        | "datetime"
        | "uuid"
        | RegExp
        | ((value: string) => boolean)
    ) {
        return this.deriveWith({ _match: pattern });
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
    } = null): string | never {
        value = super.validate(path, value, options);
        let _value: string;
        let err: Error;

        if (value === null || value === void 0) {
            return value;
        } else if (options?.strict && typeof value !== "string") {
            throw this.createTypeError(path, value, "string");
        } else if (typeof value === "number" ||
            typeof value === "bigint" ||
            typeof value === "boolean"
        ) {
            _value = String(value);
        } else if (value instanceof Date) {
            _value = value.toISOString();
        } else if (typeof value !== "string") {
            throw this.createTypeError(path, value, "string");
        } else {
            _value = value;
        }

        if (_value !== value) {
            options?.warnings?.push({
                path,
                message: this.conversionWarning(path, value, "string")
            });
        }

        if (this._spaceless) {
            _value = _value.replace(/\s/g, "");
        } else if (this._trim) {
            _value = _value.trim();
        }

        this._lowercase && (_value = _value.toLowerCase());
        this._uppercase && (_value = _value.toUpperCase());

        if (!_value) {
            if (this._optional || this._default === "" || this._enum?.includes("")) {
                return _value;
            } else {
                err = new Error(`${path} is expected to be a non-empty string`);
            }
        } else if (this._minLength && _value.length < this._minLength) {
            const unit = this._minLength === 1 ? "character" : `characters`;
            err = new Error(`${path} is expected to contain at least ${this._minLength} ${unit}`);
        } else if (this._maxLength && _value.length > this._maxLength) {
            const unit = this._maxLength === 1 ? "character" : `characters`;
            err = new Error(`${path} is expected to contain no more than ${this._maxLength} ${unit}`);
        } else if (this._enum?.length && !this._enum.includes(_value)) {
            const asConst = typeof value === "string";

            if (this._enum.length === 1) {
                err = this.createTypeError(path, value, `'${this._enum[0]}'`, asConst);
            } else {
                const types = this._enum.map(value => `'${value}'`);
                err = this.createTypeError(path, value, types, asConst);
            }
        } else if (this._match === "email" && !StringType.EmailRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid email address`);
        } else if (this._match === "ip" && !StringType.IpRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid IP address`);
        } else if (this._match === "url" && !StringType.UrlRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid URL address`);
        } else if (this._match === "hostname" && !StringType.HostnameRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid hostname`);
        } else if (this._match === "phone" && !StringType.PhoneRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid phone number`);
        } else if (this._match === "date" && !StringType.DateRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid date string (format: YYYY-MM-DD)`);
        } else if (this._match === "time" && !StringType.TimeRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid time string (format: HH:mm[:ss])`);
        } else if (this._match === "datetime" && !StringType.DatetimeRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid datetime string (format: YYYY-MM-DD HH:mm:ss)`);
        } else if (this._match === "uuid" && !StringType.UuidRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid UUID`);
        } else if (this._match instanceof RegExp && !this._match.test(_value)) {
            err = new Error(`${path} does not match the pattern: ${this._match}`);
        } else if (typeof this._match === "function" && !this._match(_value)) {
            err = new Error(`${path} does not fulfill the requirement`);
        }

        if (err) {
            if (!options?.suppress) {
                throw err;
            } else {
                options?.warnings?.push({ path, message: err.message });
            }
        }

        return _value;
    }

    toJSONSchema(): JSONSchema {
        let format: string;
        let pattern: RegExp;

        if (this._match === "email") {
            format = this._match;
        } else if (this._match === "phone") {
            pattern = StringType.PhoneRegex;
        } else if (this._match === "ip") {
            format = "ipv4";
        } else if (this._match === "hostname") {
            format = "hostname";
        } else if (this._match === "url") {
            format = "uri";
        } else if (this._match === "date") {
            format = "date";
        } else if (this._match === "time") {
            format = "time";
        } else if (this._match === "datetime") {
            format = "date-time";
        } else if (this._match === "uuid") {
            format = "uuid";
        } else if (this._match instanceof RegExp) {
            pattern = this._match;
        }

        const schema: JSONSchema = {
            type: "string",
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
            minLength: this._minLength,
            maxLength: this._maxLength,
            format,
            pattern: pattern?.source,
        };

        if (this._enum) {
            if (this._enum.length === 1) {
                schema["const"] = this._enum[0];
            } else {
                schema["enum"] = this._enum;
            }
        }

        return omitUndefined(schema);
    }
}

export class OptionalStringType extends StringType {
    protected _optional = true;

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalStringType" {
        return "OptionalStringType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new StringType());
    }

    // @ts-ignore
    enum<T>(values: T) {
        return this.deriveWith({ _enum: values }, new OptionalStringEnum<T>());
    }
}

export class StringEnum<T> extends StringType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "StringEnum" {
        return "StringEnum";
    }

    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalStringEnum<T>());
    }

    // @ts-ignore
    default(value: T extends (infer U) ? (U extends readonly (infer V)[] ? V : U) : string) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalStringEnum<T>());
    }

    // @ts-ignore
    enum(): T;
    enum<T>(values: T): StringEnum<T>;
    enum(values: string[] = void 0) {
        if (values !== void 0) {
            return super.enum(values);
        } else {
            return this._enum;
        }
    }
}

export class OptionalStringEnum<T> extends StringEnum<T> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalStringEnum" {
        return "OptionalStringEnum";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new StringEnum<T>());
    }

    // @ts-ignore
    enum(): T;
    // @ts-ignore
    enum<T>(values: T): OptionalStringEnum<T>;
    // @ts-ignore
    enum(values: string[] = void 0) {
        return super.enum(values);
    }
}

export class NumberType extends ValidateableType<number> {
    private _integer = false;
    private _min: number = void 0;
    private _max: number = void 0;
    protected _enum: number[] = null;

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "NumberType" {
        return "NumberType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalNumberType());
    }

    /** Restrains the number to be an integer. */
    get integer() {
        return this.deriveWith({ _integer: true });
    }

    default(value: number) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalNumberType());
    }

    /** Sets the minimal value of the number. */
    min(value: number) {
        if (this._integer && !Number.isInteger(value)) {
            throw new RangeError("value must be an integer when `integer` option is set");
        }

        return this.deriveWith({ _min: value });
    }

    /** Sets the maximal value of the number. */
    max(value: number) {
        if (this._integer && !Number.isInteger(value)) {
            throw new RangeError("value must be an integer when `integer` option is set");
        }

        return this.deriveWith({ _max: value });
    }

    /** Sets the enum options of which the number can be. */
    enum<T>(values: T) {
        return this.deriveWith({ _enum: values }, new NumberEnum<T>());
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
    } = null): number | never {
        value = super.validate(path, value, options);
        let _value: number;
        let err: Error;

        if (value === null || value === void 0) {
            return value;
        } else if (options?.strict && typeof value !== "number") {
            throw this.createTypeError(path, value, "number");
        } else if (typeof value === "bigint") {
            if (value <= Number.MAX_SAFE_INTEGER) {
                _value = Number(value);
            } else {
                throw this.createTypeError(path, value, "number");
            }
        } else if (typeof value === "boolean") {
            _value = Number(value);
        } else if (typeof value === "string") {
            _value = Number(value);

            if (Number.isNaN(_value) || _value > Number.MAX_SAFE_INTEGER) {
                throw this.createTypeError(path, value, "number");
            }
        } else if (value instanceof Date) {
            _value = value.valueOf();
        } else if (typeof value !== "number") {
            throw this.createTypeError(path, value, "number");
        } else {
            _value = value;
        }

        if (_value !== value) {
            options?.warnings?.push({
                path,
                message: this.conversionWarning(path, value, "number")
            });
        }

        if (this._integer && !Number.isInteger(_value)) {
            err = new TypeError(`${path} is expected to be an integer`);
        } else if (this._min && _value < this._min) {
            err = new RangeError(`${path} is expected not to be less than ${this._min}`);
        } else if (this._max && _value > this._max) {
            err = new RangeError(`${path} is expected not to be greater than ${this._max}`);
        } else if (this._enum?.length && !this._enum.includes(_value)) {
            const asConst = ["number", "bigint"].includes(typeof value);

            if (this._enum.length === 1) {
                err = this.createTypeError(path, value, String(this._enum[0]), asConst);
            } else {
                err = this.createTypeError(path, value, this._enum.map(String), asConst);
            }
        }

        if (err) {
            if (!options?.suppress) {
                throw err;
            } else {
                options?.warnings?.push({ path, message: err.message });
            }
        }

        return _value;
    }

    toJSONSchema(): JSONSchema {
        const schema: JSONSchema = {
            type: this._integer ? "integer" : "number",
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
            minimum: this._min,
            maximum: this._max,
        };

        if (this._enum) {
            if (this._enum.length === 1) {
                schema["const"] = this._enum[0];
            } else {
                schema["enum"] = this._enum;
            }
        }

        return omitUndefined(schema);
    }
}

export class OptionalNumberType extends NumberType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalNumberType" {
        return "OptionalNumberType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new NumberType());
    }

    // @ts-ignore
    enum<T>(values: T) {
        return this.deriveWith({ _enum: values }, new OptionalNumberEnum<T>());
    }
}

export class NumberEnum<T> extends NumberType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "NumberEnum" {
        return "NumberEnum";
    }

    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalNumberEnum<T>());
    }

    // @ts-ignore
    default(value: T extends (infer U) ? (U extends readonly (infer V)[] ? V : U) : number) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalNumberEnum<T>());
    }

    // @ts-ignore
    enum(): T;
    enum<T>(values: T): NumberEnum<T>;
    enum(values: number[] = void 0) {
        if (values !== void 0) {
            return super.enum(values);
        } else {
            return this._enum;
        }
    }
}

export class OptionalNumberEnum<T> extends NumberEnum<T> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalNumberEnum" {
        return "OptionalNumberEnum";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new NumberEnum<T>());
    }

    // @ts-ignore
    enum(): T;
    // @ts-ignore
    enum<T>(values: T): OptionalNumberEnum<T>;
    // @ts-ignore
    enum(values: number[] = void 0) {
        return super.enum(values);
    }
}

export class BigIntType extends ValidateableType<bigint> {
    private _min: bigint = void 0;
    private _max: bigint = void 0;
    protected _enum: bigint[] = null;

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "BigIntType" {
        return "BigIntType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalBigIntType());
    }

    default(value: bigint) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalBigIntType());
    }

    /** Sets the minimal value of the number. */
    min(value: bigint) {
        return this.deriveWith({ _min: value });
    }

    /** Sets the maximal value of the number. */
    max(value: bigint) {
        return this.deriveWith({ _max: value });
    }

    /** Sets the enum options of which the number can be. */
    enum<T>(values: T) {
        return this.deriveWith({ _enum: values }, new BigIntEnum<T>());
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
    } = null): bigint | never {
        value = super.validate(path, value, options);
        let _value: bigint;
        let err: Error;

        if (value === null || value === void 0) {
            return value;
        } else if (options?.strict && typeof value !== "bigint") {
            throw this.createTypeError(path, value, "bigint");
        } else if (typeof value === "number") {
            _value = BigInt(value);
        } else if (typeof value === "boolean") {
            _value = BigInt(value);
        } else if (typeof value === "string" && !Number.isNaN(Number(value))) {
            _value = BigInt(value);
        } else if (typeof value !== "bigint") {
            throw this.createTypeError(path, value, "bigint");
        } else {
            _value = value;
        }

        if (_value !== value) {
            options?.warnings?.push({
                path,
                message: this.conversionWarning(path, value, "bigint")
            });
        }

        if (this._min && _value < this._min) {
            err = new RangeError(`${path} is expected not to be less than ${this._min}`);
        } else if (this._max && _value > this._max) {
            err = new RangeError(`${path} is expected not to be greater than ${this._max}`);
        } else if (this._enum?.length && !this._enum.includes(_value)) {
            const asConst = ["number", "bigint"].includes(typeof value);

            if (this._enum.length === 1) {
                err = this.createTypeError(path, value, String(this._enum[0]), asConst);
            } else {
                err = this.createTypeError(path, value, this._enum.map(String), asConst);
            }
        }

        if (err) {
            if (!options?.suppress) {
                throw err;
            } else {
                options?.warnings?.push({ path, message: err.message });
            }
        }

        return _value;
    }

    toJSONSchema(): JSONSchema {
        const schema: JSONSchema = {
            type: "integer",
            description: this._remarks,
            default: !isValid(this._default) ? void 0 : Number(this._default),
            deprecated: !isValid(this._deprecated) ? void 0 : true,
            minimum: !isValid(this._min) ? void 0 : Number(this._min),
            maximum: !isValid(this._max) ? void 0 : Number(this._max),
        };

        if (this._enum) {
            if (this._enum.length === 1) {
                schema["const"] = Number(this._enum[0]);
            } else {
                schema["enum"] = this._enum.map(Number);
            }
        }

        return omitUndefined(schema);
    }
}

export class OptionalBigIntType extends BigIntType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalBigIntType" {
        return "OptionalBigIntType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new BigIntType());
    }

    // @ts-ignore
    enum<T>(values: T) {
        return this.deriveWith({ _enum: values }, new OptionalBigIntEnum<T>());
    }
}

export class BigIntEnum<T> extends BigIntType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "BigIntEnum" {
        return "BigIntEnum";
    }

    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalBigIntEnum<T>());
    }

    // @ts-ignore
    default(value: T extends (infer U) ? (U extends readonly (infer V)[] ? V : U) : bigint) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalBigIntEnum<T>());
    }

    // @ts-ignore
    enum(): T;
    enum<T>(values: T): BigIntEnum<T>;
    enum(values: bigint[] = void 0) {
        if (values !== void 0) {
            return super.enum(values);
        } else {
            return this._enum;
        }
    }
}

export class OptionalBigIntEnum<T> extends BigIntEnum<T> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalBigIntEnum" {
        return "OptionalBigIntEnum";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new BigIntEnum());
    }

    // @ts-ignore
    enum(): T;
    // @ts-ignore
    enum<T>(values: T): OptionalBigIntEnum<T>;
    // @ts-ignore
    enum(values: bigint[] = void 0) {
        return super.enum(values);
    }
}

export class BooleanType extends ValidateableType<boolean> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "BooleanType" {
        return "BooleanType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalBooleanType());
    }

    default(value: boolean) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalBooleanType());
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
    } = null): boolean | never {
        value = super.validate(path, value, options);
        let _value: boolean;

        if (value === null || value === void 0) {
            return value;
        } else if (options?.strict && typeof value !== "boolean") {
            throw this.createTypeError(path, value, "boolean");
        } else if (typeof value === "number") {
            if (value === 1) {
                _value = true;
            } else if (value === 0) {
                _value = false;
            } else {
                throw this.createTypeError(path, value, "boolean");
            }
        } else if (typeof value === "bigint") {
            if (value === BigInt(1)) {
                _value = true;
            } else if (value === BigInt(0)) {
                _value = false;
            } else {
                throw this.createTypeError(path, value, "boolean");
            }
        } else if (typeof value === "string") {
            if (value === "true") {
                _value = true;
            } else if (value === "false") {
                _value = false;
            } else {
                throw this.createTypeError(path, value, "boolean");
            }
        } else if (typeof value !== "boolean") {
            throw this.createTypeError(path, value, "boolean");
        } else {
            _value = value;
        }

        if (_value !== value) {
            options?.warnings?.push({
                path,
                message: this.conversionWarning(path, value, "boolean")
            });
        }

        return _value;
    }

    toJSONSchema(): JSONSchema {
        return omitUndefined({
            type: "boolean",
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
        } as JSONSchema);
    }
}

export class OptionalBooleanType extends BooleanType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalBooleanType" {
        return "OptionalBooleanType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new BooleanType());
    }
}

export class DateType extends ValidateableType<Date> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "DateType" {
        return "DateType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalDateType());
    }

    default(value: Date) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalDateType());
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
    } = null): Date | never {
        value = super.validate(path, value, options);
        let _value: Date;

        if (value === null || value === void 0) {
            return value;
        } else if (options?.strict && !(value instanceof Date)) {
            throw this.createTypeError(path, value, "Date");
        } else if (typeof value === "string") {
            _value = new Date(value);

            if (String(_value) === "Invalid Date") {
                throw this.createTypeError(path, value, "Date");
            }
        } else if (typeof value === "number") {
            if (value >= 0) {
                _value = new Date(value);
            } else {
                throw this.createTypeError(path, value, "Date");
            }
        } else if (!(value instanceof Date)) {
            throw this.createTypeError(path, value, "Date");
        } else {
            _value = value;
        }

        if (_value !== value && _value.toISOString() !== value) {
            options?.warnings?.push({
                path,
                message: this.conversionWarning(path, value, "Date")
            });
        }

        return _value;
    }

    toJSONSchema(): JSONSchema {
        return omitUndefined({
            type: "string",
            description: this._remarks,
            default: this._default ? this._default.toISOString() : void 0,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
            format: "date-time",
        } as JSONSchema);
    }
}

export class OptionalDateType extends DateType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalDateType" {
        return "OptionalDateType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new DateType());
    }
}

export class ObjectType extends ValidateableType<object> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "ObjectType" {
        return "ObjectType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalObjectType());
    }

    default(value: object | null) {
        if (Array.isArray(value)) {
            throw new TypeError("value must be an object but not an array");
        }

        return this.deriveWith({ _optional: true, _default: value }, new OptionalObjectType());
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
    } = null): Date | never {
        value = super.validate(path, value, options);

        if (value === null || value === void 0) {
            return value;
        } else if (!(value instanceof Object) || Array.isArray(value)) {
            throw this.createTypeError(path, value, "object");
        } else {
            return value;
        }
    }

    toJSONSchema(): JSONSchema {
        return omitUndefined({
            type: "object",
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
        } as JSONSchema);
    }
}

export class OptionalObjectType extends ObjectType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalObjectType" {
        return "OptionalObjectType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new ObjectType());
    }
}

// @ts-ignore
export class AnyType extends ValidateableType<any> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "AnyType" {
        return "AnyType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalAnyType());
    }

    default(value: any) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalAnyType());
    }

    toJSONSchema(): JSONSchema {
        return omitUndefined({
            type: ["string", "number", "integer", "boolean", "object", "array", "null"],
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
        } as JSONSchema);
    }
}

export class OptionalAnyType extends AnyType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalAnyType" {
        return "OptionalAnyType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new AnyType());
    }
}

export class VoidType extends ValidateableType<void> {
    protected _optional = true;

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "VoidType" {
        return "VoidType";
    }

    get optional() {
        console.warn("VoidType is always optional, calling `optional` makes no difference");
        return this;
    }

    get required(): never {
        throw new ReferenceError("VoidType is always optional, calling `required` makes no sense");
    }

    default(value: null) {
        return this.deriveWith({ _optional: true, _default: value });
    }

    validate(path: string, value: any, options: {
        warnings?: ValidationWarning[];
    } = null): void {
        if (value !== null && value !== void 0) {
            throw this.createTypeError(path, value, "void");
        } else if (this._default !== void 0) {
            return this._default;
        } else if (!!isValid(this._deprecated) && options?.warnings) {
            const message = this._deprecated
                ? `${path} is deprecated: ${this._deprecated}`
                : `${path} is deprecated`;

            if (!options.warnings.some(item => item.path === path && item.message === message)) {
                options.warnings.push({ path, message });
            }
        }

        return value;
    }

    toJSONSchema(): JSONSchema {
        return omitUndefined({
            type: "null",
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
        } as JSONSchema);
    }
}

export class CustomType<T> extends ValidateableType<T> {
    protected _guard: (data: any, path: string, warnings: ValidationWarning[]) => any;

    constructor(readonly type: T | Constructor<T>) {
        super();
    }

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "CustomType" {
        return "CustomType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalCustomType<T>(this.type));
    }

    default(value: ExtractInstanceType<T>) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalCustomType<T>(this.type));
    }

    /**
     * Defines a function that transforms the input data to the desired type.
     * @example
     * ```ts
     * class Example {
     *     \@param({
     *         id: String, 
     *         name: String.optional,
     *         avatar: as(Avatar)
     *             .guard(data => data instanceof Avatar ? data : new Avatar(data))
     *             .optional
     *     }, "data")
     *     async create(data: { id: string; name?: string; avatar?: Avatar }) {
     *         // ...
     *     }
     * }
     * ```
     */
    guard(transform: (data: any, path: string, warnings: ValidationWarning[]) => any) {
        this._guard = transform;
        return this;
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownItems?: boolean;
    } = null): T | never {
        value = super.validate(path, value, options);

        if (value === null || value === void 0) {
            return value;
        } else if (this._guard) {
            value = this._guard(value, path, options?.warnings ?? []);
        }

        if (typeof this.type === "boolean") {
            const _value = new BooleanType().validate(path, value, options);

            if (_value === this.type) {
                return _value as any;
            } else {
                throw this.createTypeError(
                    path,
                    value,
                    String(this.type),
                    typeof value === "boolean");
            }
        } else if (this.type instanceof Function) {
            if (value instanceof this.type) {
                return value;
            } else if (Object.is(this.type, Function)) {
                throw this.createTypeError(path, value, "function");
            } else {
                throw this.createTypeError(path, value, this.type.name);
            }
        } else if (isObject(this.type)) {
            if (isObject(value)) {
                return validate(value, this.type, path, options) as any;
            } else {
                throw this.createTypeError(path, value, "object");
            }
        } else if (Array.isArray(this.type)) {
            if (Array.isArray(value)) {
                return validate(value as any, this.type, path, options) as any;
            } else {
                throw this.createTypeError(path, value, "array");
            }
        } else {
            return validate(value, this.type, path, options) as any;
        }
    }

    toJSONSchema(parent = null): JSONSchema {
        if (typeof this.type === "boolean") {
            return omitUndefined({
                type: "boolean",
                description: this._remarks,
                default: toJSON(this._default),
                deprecated: !isValid(this._deprecated) ? void 0 : true,
                const: this.type,
            } as JSONSchema);
        } else if (this.type instanceof Function) {
            return omitUndefined({
                type: Object.is(this.type, Function) ? "function" : "object",
                description: this._remarks,
                default: toJSON(this._default),
                deprecated: !isValid(this._deprecated) ? void 0 : true,
            } as JSONSchema);
        } else {
            return toJSONSchema(this.type, {
                description: this._remarks,
                default: toJSON(this._default),
                deprecated: !isValid(this._deprecated) ? void 0 : true,
                parent,
            });
        }
    }
}

export class OptionalCustomType<T> extends CustomType<T> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalCustomType" {
        return "OptionalCustomType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new CustomType<T>(this.type));
    }
}

export class UnionType<T extends any[]> extends ValidateableType<T[]> {
    protected _default: T[0];

    constructor(readonly types: T) {
        super();
    }

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "UnionType" {
        return "UnionType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalUnionType(this.types));
    }

    default(value: ExtractInstanceType<T>[0]) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalUnionType(this.types));
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownItems?: boolean;
    } = null): T | never {
        try {
            value = super.validate(path, value, options);
        } catch (err) {
            if (!String(err).includes("required") ||
                !this.types.some(type => type instanceof VoidType)
            ) {
                throw err;
            }
        }

        let _value: T;
        let requireErr: any;
        let lastError: any;

        if (value === null || value === void 0) {
            return value;
        }

        for (const type of this.types) {
            try {
                _value ??= validate(value, type, path, {
                    strict: true,
                    suppress: options?.suppress,
                    warnings: options?.warnings,
                    removeUnknownItems: options?.removeUnknownItems,
                }) as any;

                if (_value !== null && _value !== void 0) {
                    return _value;
                }
            } catch (err) {
                if (!isObject(type) && !Array.isArray(type) && String(err).includes("required")) {
                    requireErr ??= err;
                }
            }
        }

        if (!options?.strict) {
            for (const type of this.types) {
                try {
                    _value ??= validate(value, type, path, {
                        strict: false,
                        suppress: options?.suppress,
                        warnings: options?.warnings,
                        removeUnknownItems: options?.removeUnknownItems,
                    }) as any;

                    if (_value !== null && _value !== void 0) {
                        return _value;
                    }
                } catch (err) {
                    lastError = err;
                } // eslint-disable-line
            }
        }

        if (requireErr) {
            throw requireErr;
        }

        const typesOfConsts: string[] = [];
        let types = this.types.map(type => {
            if (Object.is(type, String) || Object.is(type, StringType)) {
                return "string";
            } else if (Object.is(type, Number) || Object.is(type, NumberType)) {
                return "number";
            } else if (Object.is(type, BigInt) || Object.is(type, BigIntType)) {
                return "bigint";
            } else if (Object.is(type, Boolean) || Object.is(type, BooleanType)) {
                return "boolean";
            } else if (Object.is(type, Date) || Object.is(type, DateType)) {
                return "Date";
            } else if (Object.is(type, Object) || Object.is(type, ObjectType) || isObject(type)) {
                return "object";
            } else if (Object.is(type, Any) || Object.is(type, AnyType)) {
                return "any";
            } else if (Object.is(type, Void) || Object.is(type, VoidType)) {
                return "void";
            } else if (Array.isArray(type)) {
                return "array";
            } else if (typeof type === "function") {
                return type.name;
            } else if (isConst(type)) {
                const _type = typeof type;
                typesOfConsts.push(_type === "bigint" ? "number" : _type);
                return _type === "string" ? `'${type}'` : String(type);
            } else if (typeof type.constructor === "function") {
                return type.constructor.name;
            } else {
                return "unknown";
            }
        });
        types = [...new Set(types)];

        if (types.includes("object") && isObject(value)) {
            throw lastError;
        } else if (types.includes("array") && Array.isArray(value)) {
            throw lastError;
        } else {
            throw this.createTypeError(
                path,
                value,
                types.length > 1 ? types : types[0],
                typesOfConsts.includes(typeof value === "bigint" ? "number" : typeof value));
        }
    }

    toJSONSchema(parent = null): JSONSchema {
        const types: (JSONSchemaType | JSONSchemaType[])[] = [];
        const oneOf: JSONSchema[] = [];

        for (const type of this.types) {
            const _schema = toJSONSchema(type, { parent });
            types.push(_schema.type);
            oneOf.push(_schema);
        }

        const _types = [...new Set(types.flat())];
        const type = _types.length === 1 ? _types[0] : _types;

        const schema: JSONSchema = {
            type,
            description: this._remarks,
            default: toJSON(this._default),
            deprecated: !isValid(this._deprecated) ? void 0 : true,
        };

        if (typeof type === "string") {
            if (type !== "boolean" && oneOf.every(item => item.const !== undefined)) {
                schema["enum"] = oneOf.map(item => item.const);
            }
        } else if (oneOf.some(item => Object.keys(item).length >= 2)) {
            schema["oneOf"] = oneOf;
        }

        return omitUndefined(schema);
    }
}

export class OptionalUnionType<T extends any[]> extends UnionType<T> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalUnionType" {
        return "OptionalUnionType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new UnionType<T>(this.types));
    }
}

export class DictType<K extends IndexableType, V> extends ValidateableType<Record<ExtractInstanceType<K>, ExtractInstanceType<V>>> {
    constructor(readonly key: K, readonly value: V) {
        super();
    }

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "DictType" {
        return "DictType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalDictType(this.key, this.value));
    }

    default(value: Record<ExtractInstanceType<K>, ExtractInstanceType<V>>) {
        return this.deriveWith({
            _optional: true,
            _default: value,
        }, new OptionalDictType(this.key, this.value));
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownItems?: boolean;
    } = null): Record<ExtractInstanceType<K>, ExtractInstanceType<V>> | never {
        value = super.validate(path, value, options);

        if (value === null || value === void 0) {
            return value;
        } else if (!isObject(value)) {
            throw this.createTypeError(path, value, "object");
        } else {
            const records = {} as Record<ExtractInstanceType<K>, ExtractInstanceType<V>>;
            const keys = this.keyEnum();

            for (let [_key, _value] of Object.entries(value)) {
                try {
                    if (keys?.length) {
                        if (!keys.includes(_key)) {
                            const types = keys.map(type => `'${type}'`);
                            const props = types.length === 1
                                ? `property ${types[0]}`
                                : `properties ${join(types, "and")}`;

                            throw new RangeError(
                                `${path} is expected to contain only ${props}`);
                        }
                    } else {
                        _key = validate(_key as any, this.key, path, {
                            ...options,
                            suppress: false,
                        });
                    }
                } catch (err) {
                    if (err instanceof Error && String(err).includes("expected to contain only")) {
                        if (options?.removeUnknownItems) {
                            if (!options.suppress) {
                                const _path = path ? `${path}.${_key}` : _key;
                                options?.warnings?.push({
                                    path: _path,
                                    message: `unknown property ${_path} has been removed`,
                                });
                            }

                            _key = null;
                        } else if (options?.suppress) {
                            options?.warnings?.push({
                                path,
                                message: err instanceof Error ? err.message : String(err),
                            });
                        } else {
                            throw err;
                        }
                    } else if (options?.suppress) {
                        options?.warnings?.push({
                            path,
                            message: err instanceof Error ? err.message : String(err),
                        });
                    } else {
                        throw err;
                    }
                }

                if (_key !== null && _key !== void 0) {
                    _value = validate(
                        _value as any,
                        this.value,
                        path ? `${path}.${_key}` : _key,
                        options);

                    if (_value !== void 0) {
                        records[_key] = _value;
                    }
                }
            }

            return records;
        }
    }

    toJSONSchema(parent = null): JSONSchema {
        const schema: JSONSchema = {
            type: "object",
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
        };
        const keys = this.keyEnum();

        if (keys?.length) {
            const valueSchema = toJSONSchema(this.value, { parent });

            schema["properties"] = keys.reduce((properties, prop) => {
                properties[prop] = valueSchema;
                return properties;
            }, {});

            if (!(this.key instanceof OptionalStringEnum)) {
                schema["required"] = keys;
            }

            schema["additionalProperties"] = false;
        }

        return schema;
    }

    private keyEnum() {
        let enums: string[];

        if (this.key instanceof StringEnum) {
            enums = this.key.enum() as string[];
        } else if (this.key instanceof NumberEnum || this.key instanceof BigIntEnum) {
            enums = (this.key.enum() as (number | bigint)[]).map(String);
        } else if (this.key instanceof UnionType) {
            const _enums = (this.key.types as any[]).filter(type => isConst(type));

            if (_enums.length) {
                enums = _enums.map(String);
            }
        }

        return enums ?? null;
    }
}

export class OptionalDictType<K extends IndexableType, V> extends DictType<K, V> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalDictType" {
        return "OptionalDictType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new DictType<K, V>(this.key, this.value));
    }
}

export class ArrayType<T> extends CustomType<T[]> {
    private _minItems: number = void 0;
    private _maxItems: number = void 0;
    private _uniqueItems = false;

    constructor(readonly type: T[]) {
        super(type);
    }

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "ArrayType" {
        return "ArrayType";
    }

    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalArrayType(this.type));
    }

    // @ts-ignore
    default(value: ExtractInstanceType<T>[]) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalArrayType(this.type));
    }

    /** Sets the minimum items of the array. */
    minItems(count: number) {
        if (count < 0 || !Number.isInteger(count)) {
            throw new RangeError("count must be a non-negative integer");
        }

        return this.deriveWith({ _minItems: count });
    }

    /** Sets the maximum items of the array. */
    maxItems(count: number) {
        if (count < 0 || !Number.isInteger(count)) {
            throw new RangeError("count must be a non-negative integer");
        }

        return this.deriveWith({ _maxItems: count });
    }

    /** Restrains the array to have unique items. */
    get uniqueItems() {
        return this.deriveWith({ _uniqueItems: true });
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownItems?: boolean;
    } = null): T[] | never {
        value = ValidateableType.prototype.validate.call(this, path, value, options);
        let _value: T[];
        let err: Error;

        if (value === null || value === void 0 || (this._default && value === this._default)) {
            return value;
        } else if (this._guard) {
            value = this._guard(value, path, options?.warnings ?? []);
        }

        if (!Array.isArray(value)) {
            throw this.createTypeError(path, value, "array");
        } else {
            _value = value as any;
        }

        if (this._minItems && _value.length < this._minItems) {
            const count = this._minItems === 1 ? "1 item" : `${this._minItems} items`;
            err = new RangeError(`${path} is expected to contain at least ${count}`);
        } else if (this._maxItems && _value.length > this._maxItems) {
            if (options?.removeUnknownItems) {
                const offset = this._maxItems;
                const end = _value.length - 1;
                _value = _value.slice(0, offset);

                if (!options?.suppress) {
                    const target = end === offset
                        ? `element ${path}[${offset}] has`
                        : `elements ${path}[${offset}...${end}] have`;

                    options?.warnings?.push({
                        path,
                        message: `outranged ${target} been removed`,
                    });
                }
            } else {
                const count = this._maxItems === 1 ? "1 item" : `${this._maxItems} items`;
                err = new RangeError(`${path} is expected to contain no more than ${count}`);
            }
        } else if (this._uniqueItems && new Set(_value).size !== _value.length) {
            err = new Error(`${path} is expected to contain unique items`);
        }

        if (err) {
            if (!options?.suppress) {
                throw err;
            } else {
                options?.warnings?.push({ path, message: err.message });
            }
        }

        return validate(_value as any, this.type ?? [], path, options) as T[];
    }

    toJSONSchema(parent = null): JSONSchema {
        const schema: JSONSchema = {
            type: "array",
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
            minItems: this._minItems,
            maxItems: this._maxItems,
            uniqueItems: this._uniqueItems || void 0,
        };

        if (this.type?.length > 0) {
            if (this.type.length === 1 && !(this.type[0] instanceof AnyType)) {
                schema["items"] = toJSONSchema(this.type[0], { parent });
            } else if (this.type.length > 1) {
                const oneOf = this.type.map(type => toJSONSchema(type, { parent }));

                if (oneOf.every(item => Object.keys(item).length === 1)) {
                    schema["items"] = { type: oneOf.map(item => item.type) };
                } else {
                    schema["oneOf"] = oneOf;
                }
            }
        }

        return omitUndefined(schema);
    }
}

export class OptionalArrayType<T> extends ArrayType<T> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalArrayType" {
        return "OptionalArrayType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new ArrayType<T>(this.type));
    }
}

export class TupleType<T extends readonly any[]> extends ValidateableType<T> {
    constructor(readonly type: T) {
        super();
    }

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "TupleType" {
        return "TupleType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalTupleType(this.type));
    }

    default(value: ExtractInstanceType<T>) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalTupleType(this.type));
    }

    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownItems?: boolean;
    } = null): T | never {
        value = ValidateableType.prototype.validate.call(this, path, value, options);
        let _value: T;

        if (value === null || value === void 0) {
            return value;
        }

        if (!Array.isArray(value)) {
            throw this.createTypeError(path, value, "array");
        } else {
            _value = value as any;
        }

        let items = [];

        for (let i = 0; i < this.type.length; i++) {
            items.push(validate(_value[i], this.type[i], `${path}[${i}]`, options));
        }

        let offset = [...items].reverse().findIndex(item => item !== undefined);

        if (offset !== -1) {
            offset = items.length - offset;
            items = items.slice(0, offset);
        }

        if (_value.length > this.type.length) {
            const offset = this.type.length;
            const end = _value.length - 1;

            if (options?.removeUnknownItems) {
                if (!options?.suppress) {
                    const target = end === offset
                        ? `item ${path}[${offset}] has`
                        : `items ${path}[${offset}...${end}] have`;

                    options?.warnings?.push({
                        path,
                        message: `unknown ${target} been removed`,
                    });
                }
            } else {
                const count = this.type.length === 1 ? "1 item" : `${this.type.length} items`;
                const err = new RangeError(`${path} is expected to contain no more than ${count}`);

                if (options?.suppress) {
                    options?.warnings?.push({ path, message: err.message });
                } else {
                    throw err;
                }
            }
        }

        return items as any as T;
    }

    toJSONSchema(parent = null): JSONSchema {
        const schema: JSONSchema = {
            type: "array",
            description: this._remarks,
            default: this._default,
            deprecated: !isValid(this._deprecated) ? void 0 : true,
            minItems: this.type.filter(type => {
                return !(type instanceof ValidateableType)
                    || !type["_optional"];
            }).length,
            maxItems: this.type.length,
            prefixItems: this.type.map(type => toJSONSchema(type, { parent })),
        };

        return omitUndefined(schema);
    }
}

export class OptionalTupleType<T extends readonly any[]> extends TupleType<T> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalTupleType" {
        return "OptionalTupleType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new TupleType<T>(this.type));
    }
}

export type IndexableType = string
    | StringConstructor
    | typeof StringType
    | StringType
    | OptionalStringType
    | StringEnum<any>
    | OptionalStringEnum<any>;

export type OptionalType = OptionalStringType
    | OptionalStringEnum<any>
    | OptionalNumberType
    | OptionalNumberEnum<any>
    | OptionalBigIntType
    | OptionalBigIntEnum<any>
    | OptionalBooleanType
    | OptionalDateType
    | OptionalObjectType
    | OptionalAnyType
    | OptionalCustomType<any>
    | OptionalUnionType<any[]>
    | OptionalTupleType<any[]>
    | OptionalDictType<IndexableType, any>
    | OptionalArrayType<any>
    | VoidType;

export type RequiredPropertyNames<T> = {
    [K in keyof T]: T[K] extends OptionalType ? never : K;
}[keyof T];

export type OptionalPropertyNames<T> = {
    [K in keyof T]: T[K] extends OptionalType ? K : never;
}[keyof T];

export type EnsureOptionalProperties<T extends Record<string, unknown>> = {
    [K in keyof T]: T[K] extends OptionalType ? T[K]
    : T[K] extends StringEnum<infer U> ? OptionalStringEnum<U>
    : T[K] extends (StringConstructor | typeof StringType | StringType) ? OptionalStringType
    : T[K] extends NumberEnum<infer U> ? OptionalNumberEnum<U>
    : T[K] extends (NumberConstructor | typeof NumberType | NumberType) ? OptionalNumberType
    : T[K] extends BigIntEnum<infer U> ? OptionalBigIntEnum<U>
    : T[K] extends (BigIntConstructor | typeof BigIntType | BigIntType) ? OptionalBigIntType
    : T[K] extends (BooleanConstructor | typeof BooleanType | BooleanType) ? OptionalBooleanType
    : T[K] extends (DateConstructor | typeof DateType | DateType) ? OptionalDateType
    : T[K] extends (ObjectConstructor | typeof ObjectType | ObjectType) ? OptionalObjectType
    : T[K] extends (typeof AnyType | AnyType) ? OptionalAnyType
    : T[K] extends CustomType<infer U> ? OptionalCustomType<U>
    : T[K] extends ArrayType<infer U> ? OptionalArrayType<U>
    : T[K] extends UnionType<infer U> ? OptionalUnionType<U>
    : T[K] extends DictType<infer K, infer V> ? OptionalDictType<K, V>
    : T[K] extends TupleType<infer U> ? OptionalTupleType<U>
    : T[K] extends VoidType ? T[K]
    : OptionalCustomType<T[K]>;
};

export type EnsureRequiredProperties<T extends Record<string, unknown>> = {
    [K in keyof T]: T[K] extends OptionalStringType ? StringType
    : T[K] extends OptionalStringEnum<infer U> ? StringEnum<U>
    : T[K] extends OptionalNumberType ? NumberType
    : T[K] extends OptionalNumberEnum<infer U> ? NumberEnum<U>
    : T[K] extends OptionalBigIntType ? BigIntType
    : T[K] extends OptionalBigIntEnum<infer U> ? BigIntEnum<U>
    : T[K] extends OptionalBooleanType ? BooleanType
    : T[K] extends OptionalDateType ? DateType
    : T[K] extends OptionalObjectType ? ObjectType
    : T[K] extends OptionalAnyType ? AnyType
    : T[K] extends OptionalCustomType<infer U> ? CustomType<U>
    : T[K] extends OptionalArrayType<infer U> ? ArrayType<U>
    : T[K] extends OptionalUnionType<infer U> ? UnionType<U>
    : T[K] extends OptionalDictType<infer K, infer V> ? DictType<K, V>
    : T[K] extends OptionalTupleType<infer U> ? TupleType<U>
    : T[K]
};

export type ExtractInstanceType<T> = T extends (StringEnum<infer U> | OptionalStringEnum<infer U>) ? (U extends readonly (infer V)[] ? V : U)
    : T extends (StringConstructor | typeof StringType | StringType | OptionalStringType) ? string
    : T extends (NumberEnum<infer U> | OptionalNumberEnum<infer U>) ? (U extends readonly (infer V)[] ? V : U)
    : T extends (NumberConstructor | typeof NumberType | NumberType | OptionalNumberType) ? number
    : T extends (BigIntEnum<infer U> | OptionalBigIntEnum<infer U>) ? (U extends readonly (infer V)[] ? V : U)
    : T extends (BigIntConstructor | typeof BigIntType | BigIntType | OptionalBigIntType) ? bigint
    : T extends (BooleanConstructor | typeof BooleanType | BooleanType | OptionalBooleanType) ? boolean
    : T extends (DateConstructor | typeof DateType | DateType | OptionalDateType) ? Date
    : T extends (ObjectConstructor | typeof ObjectType | ObjectType | OptionalObjectType) ? object
    : T extends (typeof AnyType | AnyType | OptionalAnyType) ? any
    : T extends (typeof VoidType | VoidType) ? void
    : T extends abstract new (...args: any[]) => infer U ? U
    : T extends (infer U)[] ? ExtractInstanceType<U>[]
    : T extends (ArrayType<infer U> | OptionalArrayType<infer U>) ? ExtractInstanceType<U>[]
    : T extends readonly [infer A, infer B] ? readonly [ExtractInstanceType<A>, ExtractInstanceType<B>]
    : T extends readonly [infer A, infer B, infer C] ? readonly [ExtractInstanceType<A>, ExtractInstanceType<B>, ExtractInstanceType<C>]
    : T extends readonly [infer A, infer B, infer C, infer D] ? readonly [ExtractInstanceType<A>, ExtractInstanceType<B>, ExtractInstanceType<C>, ExtractInstanceType<D>]
    : T extends readonly [...infer U] ? readonly [...ExtractInstanceType<U>]
    : T extends (TupleType<infer U> | OptionalTupleType<infer U>) ? ExtractInstanceType<U>
    : T extends (CustomType<infer U> | OptionalCustomType<infer U>) ? ExtractInstanceType<U>
    : T extends (UnionType<infer U> | OptionalUnionType<infer U>) ? ExtractInstanceType<U>[0]
    : T extends (DictType<infer K, infer V> | OptionalDictType<infer K, infer V>) ? Record<ExtractInstanceType<K>, ExtractInstanceType<V>>
    : T extends Record<string, unknown> ? (
        {
            [K in RequiredPropertyNames<T>]: ExtractInstanceType<T[K]>;
        } & {
            [K in OptionalPropertyNames<T>]?: ExtractInstanceType<T[K]>;
        })
    : T;

function augmentStaticMethods(ctor: Constructor<any>, type: Constructor<any>) {
    const ins = new type() as ValidateableType<any>;
    ctor["optional"] = ins.optional;
    ctor["required"] = ins.required;
    ctor["default"] = (value: any) => ins.default(value);
    ctor["deprecated"] = (message: string) => ins.deprecated(message);
    ctor["alternatives"] = (...props: string[]) => ins.alternatives(...props);
    ctor["associates"] = (...props: string[]) => ins.associates(...props);
    ctor["remarks"] = (note: string) => ins.remarks(note);

    if (typeof ins["guard"] === "function") {
        ctor["guard"] = (transform: (...args: any[]) => any) => ins["guard"](transform);
    }

    Object.getOwnPropertyNames(type.prototype).forEach(prop => {
        if (prop !== "constructor" && !ctor[prop]) {
            const desc = Object.getOwnPropertyDescriptor(type.prototype, prop);

            if (typeof desc.get === "function") {
                ctor[prop] = ins[prop];
            } else if (typeof desc.value === "function") {
                ctor[prop] = (value: any) => ins[prop](value);
            }
        }
    });
}

augmentStaticMethods(String, StringType);
augmentStaticMethods(Number, NumberType);
augmentStaticMethods(BigInt as any, BigIntType);
augmentStaticMethods(Boolean, BooleanType);
augmentStaticMethods(Date, DateType);
augmentStaticMethods(Object, ObjectType);
augmentStaticMethods(Array, ArrayType);

/** Any type of value except void values (`null` and `undefined`). */
export const Any = new AnyType();
/** `null` and `undefined`. */
export const Void = new VoidType();

export type Dict<K extends string, V> = Record<K, V>;
export function Dict<K extends IndexableType, V>(key: K, value: V) {
    return new DictType(key, value);
}

// augment Array on the prototype level
Object.defineProperties(Array.prototype, {
    optional: {
        configurable: true,
        get: function (this: any[]) { // eslint-disable-line
            return new OptionalArrayType(this).optional;
        },
    },
    required: {
        configurable: true,
        get: function (this: any[]) { // eslint-disable-line
            return new ArrayType(this).required;
        },
    },
    default: {
        configurable: true,
        value: function (this: any[], value: any[]) { // eslint-disable-line
            return new OptionalArrayType(this).default(value);
        },
    },
    remarks: {
        configurable: true,
        value: function (this: any[], note: string) { // eslint-disable-line
            return new ArrayType(this).remarks(note);
        },
    },
    deprecated: {
        configurable: true,
        value: function (this: any[], message: string = "") { // eslint-disable-line
            return new ArrayType(this).deprecated(message);
        },
    },
    alternatives: {
        configurable: true,
        value: function (this: any[], ...props: string[]) { // eslint-disable-line
            return new ArrayType(this).alternatives(...props);
        },
    },
    associates: {
        configurable: true,
        value: function (this: any[], ...props: string[]) { // eslint-disable-line
            return new ArrayType(this).associates(...props);
        },
    },
    guard: {
        configurable: true,
        value: function (this: any[], transform: (...args: any[]) => any[]) { // eslint-disable-line
            return new ArrayType(this).guard(transform);
        },
    },
    minItems: {
        configurable: true,
        value: function (this: any[], count: number) { // eslint-disable-line
            return new ArrayType(this).minItems(count);
        },
    },
    maxItems: {
        configurable: true,
        value: function (this: any[], count: number) { // eslint-disable-line
            return new ArrayType(this).maxItems(count);
        },
    },
    uniqueItems: {
        configurable: true,
        get: function (this: any[]) { // eslint-disable-line
            return new ArrayType(this).uniqueItems;
        },
    },
});

declare global {
    interface StringConstructor extends StringType { } // eslint-disable-line
    interface NumberConstructor extends NumberType { } // eslint-disable-line
    interface BigIntConstructor extends BigIntType { } // eslint-disable-line
    interface BooleanConstructor extends BooleanType { } // eslint-disable-line
    interface DateConstructor extends DateType { } // eslint-disable-line
    interface ObjectConstructor extends ObjectType { } // eslint-disable-line
    interface ArrayConstructor extends ArrayType<any> { } // eslint-disable-line
    interface Array<T> extends ArrayType<T> { } // eslint-disable-line

    interface Function {
        /**
         * Returns the JSON Schema representation of the function. If available,
         * returns a schema with `type: 'function'` and with `parameters` and
         * `returns` keywords. Otherwise, `null` is returned.
         */
        getJSONSchema: (options?: {
            $id?: string;
            title?: string;
            description?: string;
        }) => Omit<JSONSchema, "type"> & {
            $schema: string;
            $id: string;
            title: string;
            type: "function";
            parameters?: {
                [name: string]: JSONSchema & {
                    $schema: string;
                    $id: string;
                };
            };
            returns?: JSONSchema & {
                $schema: string;
                $id: string;
            };
        };
    }
}

/**
 * Used to wrap a custom type so that it could be modified with the utility
 * functions like `optional` and `default`.
 * @example
 * ```ts
 * class Example {
 *     \@param({ id: String, name: String.optional }, "query")
 *     \@returns({
 *          id: String,
 *          name: String,
 *          gender: as(Gender),
 *          avatar: as(Avatar).optional,
 *          address: as({
 *              country: String,
 *              province: String.optional,
 *              city: String.optional,
 *              street: String.optional
 *          }).optional, // a plain object doesn't have an `optional` option, so we wrap it with `as`
 *     })
 *     async findOne(query: { id: string; name?: string }) {
 *         // ...
 *     }
 * }
 * ```
 */
export function as(type: StringConstructor): StringConstructor;
export function as(type: NumberConstructor): NumberConstructor;
export function as(type: BigIntConstructor): BigIntConstructor;
export function as(type: BooleanConstructor): BooleanConstructor;
export function as(type: DateConstructor): DateConstructor;
export function as(type: ObjectConstructor): ObjectConstructor;
export function as(type: ArrayConstructor): ArrayConstructor;
export function as<T extends ValidateableType<unknown>>(type: T): T;
export function as<T extends readonly any[]>(type: T): TupleType<T>;
export function as<T>(type: T): CustomType<T>;
export function as<T extends any[]>(...types: T): UnionType<T>;
export function as<T>(...types: (T | Constructor<T>)[]) {
    if (types.length === 1) {
        const [type] = types;

        if (Array.isArray(type)) {
            return new TupleType(type);
        } else if ([String, Number, BigInt, Boolean, Date, Object, Array].includes(type as any)
            || (type instanceof ValidateableType)
        ) {
            return type;
        } else {
            return new CustomType(types[0]);
        }
    } else if (types.length > 1) {
        return new UnionType(types);
    } else {
        throw new TypeError(`as() requires at least one argument`);
    }
}

function isObject(value: any) {
    return typeof value === "object" && !!value && value.constructor === Object;
}

function isEmptyValue(value: any) {
    return value === null || value === void 0 || value === "";
}

function isConst(type: any) {
    return ["string", "number", "bigint", "boolean"].includes(typeof type);
}

function join(strings: string[], op: "and" | "or" = "and") {
    if (!strings.length) {
        return "";
    } else if (strings.length === 1) {
        return strings[0];
    } else if (strings.length === 2) {
        return strings[0] + " " + op + " " + strings[1];
    } else {
        return strings.slice(0, -1).join(", ") + " " + op + " " + strings.slice(-1);
    }
}

function read(text: string | string[], noArticle = false): string {
    if (Array.isArray(text)) {
        return join([read(text[0]), ...text.slice(1)], "or");
    } else if (noArticle
        || ["true", "false", "any", "unknown", "null", "undefined", "void"].includes(text)
    ) {
        return text;
    } else if (text[0] === "'" || text[0] === '"' || !isNaN(text as any)) {
        return text;
    } else if (["a", "e", "i", "o", "u"].includes(text[0].toLowerCase())) {
        return "an " + text;
    } else {
        return "a " + text;
    }
}

function readType(value: any, asConst = false) {
    let type: string;

    if (value === null) {
        type = "null";
    } else if (value === void 0) {
        type = "undefined";
    } else if (typeof value === "function") {
        type = "a function";
    } else if (Array.isArray(value)) {
        type = "an array";
    } else if (isObject(value)) {
        type = "an object";
    } else if (typeof value === "object") {
        const name = (value as object).constructor.name;

        if (["a", "e", "i", "o", "u"].includes(name[0].toLowerCase())) {
            return "an " + name;
        } else {
            return "a " + name;
        }
    } else if (asConst) {
        type = read(typeof value === "string" ? `'${value}'` : String(value));
    } else {
        type = read(typeof value);
    }

    return type;
}

function omitUndefined<T extends object>(obj: T): T {
    return Object.keys(obj).reduce((record, prop) => {
        if (obj[prop] !== undefined) {
            record[prop] = obj[prop];
        }

        return record;
    }, {} as T);
}

function copyFunctionProperties(source: Function, target: Function) {
    Object.defineProperty(target, "name", { value: source.name, configurable: true });
    Object.defineProperty(target, "length", { value: source.length, configurable: true });
    Object.defineProperty(target, "toString", {
        value: function toString() {
            return source.toString();
        },
        configurable: true,
    });
}

function purifyStackTrace(err: any, ctorOpt: Function) {
    err instanceof Error && Error.captureStackTrace?.(err, ctorOpt);
    return err;
}

function toJSON(value: any) {
    let json: any;

    if (value === null) {
        json = null;
    } else if (value !== void 0) {
        if (Array.isArray(value) ||
            isObject(value) ||
            isConst(value)
        ) {
            json = typeof value === "bigint" ? Number(value) : value;
        } else if (typeof value === "object" && typeof value.toJSON === "function") {
            json = value.toJSON();
        }
    }

    return json;
}

function ensureType(type: any, path = "$", deep = false) {
    const reduce = (type: any, path: string) => {
        if (type instanceof ValidateableType) {
            return type;
        } else if (Object.is(type, String) || Object.is(type, StringType)) {
            return new StringType();
        } else if (Object.is(type, Number) || Object.is(type, NumberType)) {
            return new NumberType();
        } else if (Object.is(type, BigInt) || Object.is(type, BigIntType)) {
            return new BigIntType();
        } else if (Object.is(type, Boolean) || Object.is(type, BooleanType)) {
            return new BooleanType();
        } else if (Object.is(type, Date) || Object.is(type, DateType)) {
            return new DateType();
        } else if (Object.is(type, Object) || Object.is(type, ObjectType)) {
            return new ObjectType();
        } else if (Object.is(type, Array) || Object.is(type, ArrayType)) {
            return new ArrayType([]);
        } else if (Object.is(type, AnyType)) {
            return new AnyType();
        } else if (Object.is(type, VoidType)) {
            return new VoidType();
        } else if (Array.isArray(type)) {
            return !deep ? type : type.map((_type, index) => {
                return reduce(_type, path ? `${path}[${index}]` : String(index));
            });
        } else if (isObject(type)) {
            return !deep ? type : Object.keys(type).reduce((_type, prop) => {
                _type[prop] = reduce(type[prop], path ? `${path}.${prop}` : prop);
                return _type;
            }, {});
        } else if (typeof type === "function") {
            return as(type);
        } else if (typeof type === "string") {
            return new StringType().enum([type]);
        } else if (typeof type === "number") {
            return new NumberType().enum([type]);
        } else if (typeof type === "bigint") {
            return new BigIntType().enum([type]);
        } else if (typeof type === "boolean") {
            return new CustomType(type);
        } else if (type === null || type === void 0) {
            return new VoidType().default(type);
        } else {
            const name = type.constructor?.name || "unknown";
            throw new TypeError(`${path} (${name}) is not a validateable type`);
        }
    };

    return reduce(type, path) as ValidateableType<any>;
}

/**
 * Manually validate an input value with the given type.
 * @param value The input value that needs to be validated.
 * @param type Can be a class, a type constructor (including `as()`), an object
 *  or array literal that specifies deep structure.
 * @param variable The variable name that the input value is assigned to, useful
 *  for reporting errors. If not specified, `$` will be used.
 * @returns A modified value that constrains the type. If the validation failed,
 *  an error will be thrown.
 * @example
 * ```ts
 * const str = "Hello, World!";
 * validate(str, String, "str"); // => "Hello, World!";
 * validate(str, Number, "str"); // throw type error
 * 
 * const num = 123;
 * validate(num, Number, "num"); // => 123
 * validate(num, String, "num"); // => "123"
 * validate(num, String, "num", { strict: true}); // throw type error
 * 
 * const obj = { str: "Hello, World!", num: [123] };
 * validate(obj, {
 *     str: String,
 *     num: [Number],
 *     bool: Boolean.default(false),
 *     date: Date.optional,
 *     deep: as({
 *         buf: as(Buffer).default(Buffer.from("")),
 *         deeper: [{
 *            foo1: Uint8Array,
 *            bar2: MyClass,
 *         }].optional
 *     }).optional,
 * }, "obj"); // => { str: "Hello, World!", num: [123], bool: false }
 * ```
 */
export function validate<T>(value: any, type: T, variable = "$", options: {
    /** Use strict mode, will disable any implicit type conversion. */
    strict?: boolean;
    /**
     * Suppress non-critical errors as warnings, or suppress unknown
     * property/item removing warnings (when enabled).
     */
    suppress?: boolean;
    /**
     * A list used to  store all the warnings occurred during the validation
     * process.
     */
    warnings?: ValidationWarning[];
    /**
     * Remove unknown properties in the object or the items that exceed the
     * length limit of the array.
     */
    removeUnknownItems?: boolean;
} = null): ExtractInstanceType<T> | never {
    const reduce = (type: any, value: any, path: string) => {
        if (Array.isArray(type)) {
            if (Array.isArray(value)) {
                if (!type.length) {
                    return value.map((item, index) => {
                        return reduce(Any, item, path ? `${path}[${index}]` : String(index));
                    });
                } else if (type.length === 1) {
                    return value.map((item, index) => {
                        return reduce(type[0], item, path ? `${path}[${index}]` : String(index));
                    });
                } else {
                    const _type = as(...type); // as union type
                    return value.map((item, index) => {
                        return reduce(_type, item, path ? `${path}[${index}]` : String(index));
                    });
                }
            } else if (!type.length) {
                return new ArrayType([Any]).validate(path, value, options);
            } else {
                return new ArrayType(type).validate(path, value, options);
            }
        } else if (isObject(type)) {
            if (isObject(value)) {
                const knownProps = Object.keys(type);
                const alternatives = {} as Record<string, string[]>;
                const associates = {} as Record<string, string[]>;

                knownProps.forEach((prop) => {
                    const _type = type[prop];

                    if (_type instanceof ValidateableType) {
                        const _alternatives = _type.alternatives() as string[];
                        const _associates = _type.associates() as string[];

                        if (_alternatives?.length) {
                            alternatives[prop] = _alternatives;
                        }

                        if (_associates?.length) {
                            associates[prop] = _associates;
                        }
                    }
                });

                const records = knownProps.reduce((record, prop) => {
                    const res = reduce(type[prop], value[prop], path ? `${path}.${prop}` : prop);

                    if (res !== void 0) {
                        record[prop] = res;
                    }

                    return record;
                }, {});

                for (const prop of Object.keys(alternatives)) {
                    const otherProps = alternatives[prop];

                    if (isEmptyValue(records[prop]) &&
                        otherProps.every(_prop => isEmptyValue(records[_prop]))
                    ) {
                        const props = [prop, ...otherProps].map(p => `'${p}'`).join(", ");
                        const message = `${path} is expected to contain `
                            + `one of these properties: ${props}`;

                        if (options?.suppress) {
                            options.warnings?.push({ path, message });
                        } else {
                            throw new Error(message);
                        }
                    }
                }

                for (const prop of Object.keys(associates)) {
                    const otherProps = associates[prop];

                    if (!isEmptyValue(records[prop])) {
                        const missing = otherProps.filter(_prop => isEmptyValue(records[_prop]));

                        if (missing.length) {
                            const others = missing.length === 1
                                ? `property '${missing[0]}'`
                                : `properties ${join(missing.map(p => `'${p}'`))}`;
                            const message = `${path} is expected to contain ${others} `
                                + `when property '${prop}' is given`;

                            if (options?.suppress) {
                                options.warnings?.push({ path, message });
                            } else {
                                throw new Error(message);
                            }
                        }
                    }
                }

                if (!options?.removeUnknownItems) {
                    Object.keys(value).reduce((records, prop) => {
                        if (!knownProps.includes(prop) && value[prop] !== void 0) {
                            records[prop] = value[prop];
                        }

                        return records;
                    }, records);
                } else if (options?.warnings && !options?.suppress) {
                    Object.keys(value).forEach(prop => {
                        if (!knownProps.includes(prop)) {
                            const _path = path ? `${path}.${prop}` : prop;
                            options?.warnings.push({
                                path: _path,
                                message: `unknown property ${_path} has been removed`,
                            });
                        }
                    });
                }

                return records;
            } else {
                return as(type).validate(path, value, options);
            }
        } else {
            return ensureType(type, path, true).validate(path, value, options);
        }
    };

    try {
        return reduce(type, value, variable);
    } catch (err) {
        throw purifyStackTrace(err, validate);
    }
}

const _source = Symbol("source");
const _params = Symbol.for("params");
const _returns = Symbol.for("returns");
const _throws = Symbol.for("throws");
const _title = Symbol.for("title");
const _remarks = Symbol.for("remarks");
const _deprecated = Symbol.for("deprecated");

export type FunctionDecorator = {
    <T>(target: any, prop: string, desc: TypedPropertyDescriptor<T>): void | TypedPropertyDescriptor<T>;
    <F extends (...args: any[]) => any>(target: F): void | F;
    <F extends (...args: any[]) => any>(target: F, context: any): void | F;
};

export type ValidationWarning = { path: string; message: string; };

export type WarningHandler = (
    this: any,
    warnings: ValidationWarning[],
    returns: any
) => void;
let warningHandler: WarningHandler = null;

/**
 * By default, warnings are emitted to the stdout when occurred, use this
 * function to set a custom function to change this behavior. For example, emit
 * them to the client response if the function is called as an HTTP API.
 * @param this The instance that the function is bound to.
 */
export function setWarningHandler(this: any, handler: WarningHandler) {
    warningHandler = handler;
}

export function emitWarnings(this: any, warnings: ValidationWarning[], returns: any) {
    if (warningHandler) {
        warningHandler.call(this, warnings, returns);
    } else {
        for (const { message } of warnings) {
            console.warn(message);
        }
    }
}

class ValidationError extends Error {
    readonly cause?: unknown;

    constructor(message: string, options: { cause: unknown; }) {
        // @ts-ignore
        super(message, options);
        this.cause ??= options.cause;
    }
}

function wrap(target: any, prop: string = void 0, desc: TypedPropertyDescriptor<any> = null) {
    let fn: (...arg: any[]) => any = desc ? desc.value : target;

    if (!fn[_source]) {
        const fnName: string = prop
            || (typeof target === "function" ? target.name : "")
            || "anonymous";
        const originFn = fn;
        const newFn = (function (this: any, ...args: any[]) {
            let paramsDef = newFn[_params] as { type: any; name?: string; }[];
            const returnDef = newFn[_returns] as { type: any; name: string; };
            const throwDef = newFn[_throws] as { type: any; name: string; };
            const warnings: ValidationWarning[] = [];
            const options = { warnings, removeUnknownItems: true };

            if (!!isValid(newFn[_deprecated])) {
                const message = newFn[_deprecated]
                    ? `${fnName}() is deprecated: ${newFn[_deprecated]}`
                    : `${fnName}() is deprecated`;
                warnings.push({ path: `${fnName}()`, message });
            }

            if (paramsDef) {
                if (paramsDef.length === 1 && [Void, VoidType].includes(paramsDef[0].type)) {
                    paramsDef = [];

                    if (args.length === 1 && [null, undefined].includes(args[0])) {
                        args = [];
                    } else if (args.length > 1 || ![null, undefined].includes(args[0])) {
                        warnings.push({
                            path: `${fnName}()`,
                            message: `${fnName}() is expected to have no argument, `
                                + `but ${readType(args[0])} is given`
                        });
                    }
                }

                let _args = {};
                const paramList = [];
                const params = paramsDef.map((item, index) => {
                    return { ...item, name: item.name || "arg" + index };
                }).reduce((record, item, index) => {
                    record[item.name] = item.type;
                    _args[item.name] = args[index];
                    paramList.push(item.name);
                    return record;
                }, {} as { [param: string]: any; });

                for (let i = paramList.length; i < args.length; i++) {
                    _args[`arg${i}`] = args[i];
                }

                try {
                    _args = validate(_args, params, "parameters", options);
                } catch (err) {
                    throw purifyStackTrace(err, newFn);
                }

                args = paramList.map(name => _args[name]);
            }

            const handleReturns = (
                returns: any,
                returnDef: { type: any, name: string; },
                promiseResolver: (...args: any[]) => any = null
            ) => {
                try {
                    return validate(
                        returns,
                        as(returnDef.type),
                        returnDef.name,
                        { ...options, suppress: true }
                    );
                } catch (err) {
                    err = purifyStackTrace(err, promiseResolver ?? newFn);

                    if (throwDef) {
                        throw new ValidationError("validation failed", { cause: err });
                    } else {
                        throw err;
                    }
                }
            };

            const handleError = (err: any, promiseCatcher: (...args: any[]) => any = null) => {
                if (err instanceof ValidationError) {
                    throw err.cause;
                } else if (throwDef) {
                    try {
                        err = validate(err, as(throwDef.type), throwDef.name, {
                            ...options,
                            suppress: true,
                        });
                    } catch (_err) {
                        err = purifyStackTrace(_err, promiseCatcher ?? newFn);
                    }

                    throw err;
                } else {
                    throw err;
                }
            };

            const handleResult = () => {
                let returns = originFn.apply(this, args);

                if (returns && typeof returns === "object" && typeof returns.then === "function") {
                    if (returnDef) {
                        returns = (returns as Promise<any>)
                            .then(function resolver(result) {
                                return handleReturns(result, returnDef, resolver);
                            });
                    }

                    returns = (returns as Promise<any>).then(result => {
                        emitWarnings.call(this, warnings, result);
                        return result;
                    });

                    if (throwDef) {
                        return (returns as Promise<any>).catch(function catcher(err) {
                            handleError(err, catcher);
                        });
                    } else {
                        return returns;
                    }
                } else {
                    if (returnDef) {
                        returns = handleReturns(returns, returnDef);
                    }

                    emitWarnings.call(this, warnings, returns);
                    return returns;
                }
            };

            try {
                return handleResult();
            } catch (err) {
                handleError(err);
            }
        }) as any;

        newFn[_source] = originFn;

        if (typeof target === "function") {
            newFn[_title] = fnName;
        } else {
            newFn[_title] = (target.constructor as Constructor<any>).name + "." + fnName;
        }

        copyFunctionProperties(originFn, newFn);

        if (desc) {
            fn = (desc.value = newFn);
        } else {
            fn = newFn;
        }
    }

    return fn;
};

/**
 * A decorator that restrains the input arguments of the method.
 * @param type The type of the argument, can be a class, a type constructor
 *  (including `as()`), an object or array literal that specifies deep structure.
 * @param name The argument name, used to address where the error is reported.
 * @param remarks The remark message of the parameter.
 * @example
 * ```ts
 * class Example {
 *     \@param({ id: String, name: String.optional }, "query")
 *     \@returns({ id: String, name: String })
 *     async findOne(query: { id: string; name?: string }): Promise<{ id: string; name: string; }> {
 *         // ...
 *     }
 * 
 *     \@param(Void) // specifically, \@param(Void) will constrain the method to take no argument.
 *     zeroArgFn() {
 *         // ...
 *     }
 * }
 * ```
 */
export function param<T>(type: T, name?: string, remarks?: string): FunctionDecorator;
export function param<T>(name: string, type: T, remarks?: string): FunctionDecorator;
export function param<T>(arg0: T | string, arg1?: string | T, remarks: string = void 0) {
    const type = typeof arg0 === "string" ? arg1 as T : arg0 as T;
    const name = typeof arg0 === "string" ? arg0 as string : arg1 as string;

    return (...args: any[]) => {
        if (typeof args[1] === "object") { // new ES decorator since TypeScript 5.0
            const [target, context] = args as [Function, any];
            const fn = wrap(target, context.name as string);
            const params = (fn[_params] ??= []) as { type: any; name?: string; remarks?: string; }[];
            params.unshift({ type, name, remarks });

            return fn;
        } else {
            const [target, prop, desc] = args;
            const fn = wrap(target, prop, desc);
            const params = (fn[_params] ??= []) as { type: any; name?: string; remarks?: string; }[];
            params.unshift({ type, name, remarks });

            return desc ?? fn;
        }
    };
}

/**
 * A decorator that restrains the return value of the method.
 * 
 * NOTE: if the method returns a Promise, this function restrains the resolved
 * value instead.
 * @param type The type of the return value, can be a class, a type constructor
 *  (including `as()`), an object or array literal that specifies deep structure.
 * @param remarks The remark message remark of the return value.
 * @example
 * ```ts
 * class Example {
 *     \@param({ id: String, name: String.optional }, "query")
 *     \@returns({ id: String, name: String })
 *     async findOne(query: { id: string; name?: string }): Promise<{ id: string; name: string; }> {
 *         // ...
 *     }
 * 
 *     \@returns(Void) // specifically, \@returns(Void) will constrain the method to return nothing.
 *     noReturnFn() {
 *         // ...
 *     }
 * }
 * ```
 */
export function returns<T>(type: T, remarks: string = void 0) {
    return ((...args: any[]) => {
        if (typeof args[1] === "object") { // new ES decorator since TypeScript 5.0
            const [target, context] = args as [Function, any];
            const fn = wrap(target, context.name as string);
            fn[_returns] = { type, name: "returns", remarks };

            return fn;
        } else {
            const [target, prop, desc] = args;
            const fn = wrap(target, prop, desc);
            fn[_returns] = { type, name: "returns", remarks };

            return desc ?? fn;
        }
    }) as FunctionDecorator;
}

/**
 * A decorator that restrains the thrown error of the method.
 * 
 * NOTE: if the method returns a Promise, this function restrains the rejected
 * reason instead.
 * @param type The type of the thrown error, usually a class or a string.
 * @example
 * ```ts
 * class Example {
 *     \@param({ id: String, name: String.optional }, "query")
 *     \@returns({ id: String, name: String })
 *     \@throws(NotFoundException)
 *     async findOne(query: { id: string; name?: string }): Promise<{ id: string; name: string; }> {
 *         // ...
 *     }
 * }
 * ```
 */
export function throws<T>(type: T) {
    return ((...args: any[]) => {
        if (typeof args[1] === "object") { // new ES decorator since TypeScript 5.0
            const [target, context] = args as [Function, any];
            const fn = wrap(target, context.name as string);
            fn[_throws] = { type, name: "throws" };

            return fn;
        } else {
            const [target, prop, desc] = args;
            const fn = wrap(target, prop, desc);
            fn[_throws] = { type, name: "throws" };

            return desc ?? fn;
        }
    }) as FunctionDecorator;
}

/**
 * A decorator that deprecates the method and emit a warning message when the
 * method is called.
 * @param message The warning message, can be used to provide suggestions.
 * @example
 * ```ts
 * class Example {
 *     \@deprecated("use findOne() instead")
 *     \@param(String, "id")
 *     async get(id: String): Promise<{ id: string; name: string; }> {
 *         // ...
 *     }
 * }
 * ```
 */
export function deprecated(message = "") {
    return ((...args) => {
        if (typeof args[1] === "object") { // new ES decorator since TypeScript 5.0
            const [target, context] = args as [Function, any];
            const fn = wrap(target, context.name as string);
            fn[_deprecated] = message;

            return fn;
        } else {
            const [target, prop, desc] = args;
            const fn = wrap(target, prop, desc);
            fn[_deprecated] = message;

            return desc ?? fn;
        }
    }) as FunctionDecorator;
}

/**
 * A decorator that adds remark message to the method.
 * @param note The remark message.
 * @example
 * ```ts
 * class Example {
 *     \@remarks("Retrieves id and name")
 *     \@param(String, "id")
 *     async get(id: String): Promise<{ id: string; name: string; }> {
 *         // ...
 *     }
 * }
 * ```
 */
export function remarks(note: string) {
    return ((...args: any[]) => {
        if (typeof args[1] === "object") { // new ES decorator since TypeScript 5.0
            const [target, context] = args as [Function, any];
            const fn = wrap(target, context.name as string);
            fn[_remarks] = note;

            return fn;
        } else {
            const [target, prop, desc] = args;
            const fn = wrap(target, prop, desc);
            fn[_remarks] = note;

            return desc ?? fn;
        }
    }) as FunctionDecorator;
}

export function decorate(...decorators: FunctionDecorator[]) {
    return <Fn extends (...args: any[]) => any>(fn: Fn) => {
        for (let i = decorators.length - 1; i >= 0; i--) {
            fn = decorators[i](fn) as Fn ?? fn;
        }

        return fn;
    };
}

export function def<A extends readonly any[], R, Fn extends (
    ...params: ExtractInstanceType<A>
) => ExtractInstanceType<R>>(fn: Fn, params: A, returns: R): Fn;
export function def<A extends readonly any[], R, Fn extends (
    ...params: ExtractInstanceType<A>
) => Promise<ExtractInstanceType<R>>>(fn: Fn, params: A, returns: R): Fn;
export function def(fn: (...params: any[]) => any, paramsDef: any[], returnDef: any) {
    const fnName = fn.name || "anonymous";

    function wrapper(this: any, ...args: any[]) {
        const warnings: ValidationWarning[] = [];
        const options = { warnings, removeUnknownItems: true };

        try {
            if (paramsDef.length === 1 && [Void, VoidType].includes(paramsDef[0])) {
                paramsDef = [];

                if (args.length === 1 && [null, undefined].includes(args[0])) {
                    args = [];
                } else if (args.length > 1 || ![null, undefined].includes(args[0])) {
                    warnings.push({
                        path: `${fnName}()`,
                        message: `${fnName}() is expected to have no argument, `
                            + `but ${readType(args[0])} is given`
                    });
                }
            }

            let _args = {};
            const paramList = [];
            const params = paramsDef.map((type, index) => {
                return { type, name: "arg" + index };
            }).reduce((record, item, index) => {
                record[item.name] = item.type;
                _args[item.name] = args[index];
                paramList.push(item.name);
                return record;
            }, {} as { [param: string]: any; });

            for (let i = paramList.length; i < args.length; i++) {
                _args[`arg${i}`] = args[i];
            }

            _args = validate(_args, params, "parameters", options);
            args = paramList.map(name => _args[name]);
        } catch (err) {
            throw purifyStackTrace(err, wrapper);
        }

        let result = fn.call(this, ...args);

        if (result && typeof result === "object" && typeof result["then"] === "function") {
            return (result as Promise<any>)
                .then(function resolver(res) {
                    try {
                        return validate(res, returnDef, "returns", {
                            ...options,
                            suppress: true,
                        });
                    } catch (err) {
                        throw purifyStackTrace(err, resolver);
                    }
                }).then(res => {
                    emitWarnings.call(this, warnings, res);
                    return res;
                });
        } else {
            try {
                result = validate(result, returnDef, "returns", {
                    ...options,
                    suppress: true,
                });

                emitWarnings.call(this, warnings, result);
                return result;
            } catch (err) {
                throw purifyStackTrace(err, wrapper);
            }
        }
    };

    wrapper[_title] = fnName;
    wrapper[_params] = paramsDef.map((type, index) => ({ type, name: "arg" + index }));
    wrapper[_returns] = { type: returnDef, name: "returns" };
    copyFunctionProperties(fn, wrapper);

    return wrapper;
}

export function partial<T extends DictType<StringEnum<K>, V>, K, V>(type: T): DictType<OptionalStringEnum<K>, V>;
export function partial<T extends Record<string, unknown>>(type: T): Partial<T>;
export function partial<T extends (Record<string, unknown> | DictType<IndexableType, unknown>)>(type: T) {
    if (type instanceof DictType) {
        if (type.key instanceof ValidateableType) {
            if (type.key["_optional"]) {
                return type;
            } else {
                return new DictType(type.key.optional, type.value);
            }
        } else {
            // @ts-ignore
            return new DictType(ensureType(type.key).optional, type.value);
        }
    }

    return Object.keys(type).reduce((records, prop) => {
        const _type = type[prop];

        if (_type instanceof ValidateableType) {
            if (_type["_optional"]) {
                // @ts-ignore
                records[prop] = _type as any;
            } else {
                // @ts-ignore
                records[prop] = _type.optional;
            }
        } else {
            // @ts-ignore
            records[prop] = ensureType(_type, prop).optional;
        }

        return records;
    },
        // @ts-ignore
        {} as EnsureOptionalProperties<T extends DictType<IndexableType, unknown> ? ExtractInstanceType<T> : T>
    );
}

export function required<T extends Record<string, unknown>>(type: T) {
    return Object.keys(type).reduce((records, prop) => {
        const _type = type[prop];

        if (_type instanceof ValidateableType) {
            if (!_type["_optional"]) {
                // @ts-ignore
                records[prop] = _type as any;
            } else {
                // @ts-ignore
                records[prop] = _type.required;
            }
        } else {
            // @ts-ignore
            records[prop] = ensureType(_type, prop).required;
        }

        return records;
    }, {} as EnsureOptionalProperties<T>);
}

export function optional<T extends Record<string, unknown>, K extends keyof T>(type: T, props: K[]) {
    return {
        ...partial(pick(type, props)),
        ...omit(type, props),
    };
}

export function ensured<T extends Record<string, unknown>, K extends keyof T>(type: T, props: K[]) {
    return {
        ...required(pick(type, props)),
        ...omit(type, props),
    };
}

function toJSONSchema(type: any, extra: Partial<JSONSchema> & { parent?: any; } = {}) {
    const { parent, ...rest } = extra;
    let _type: any;

    if (type instanceof CustomType) {
        _type = type.type;
    } else if (type instanceof ArrayType) {
        _type = type.type;
    } else if (type instanceof TupleType) {
        _type = type.type;
    } else {
        _type = type;
    }

    if (parent && _type === parent) {
        return { $ref: "#" };
    } else if (Array.isArray(type)) {
        if (!type.length) {
            return omitUndefined({ ...new ArrayType([Any]).toJSONSchema(parent), ...rest });
        } else {
            return omitUndefined({ ...new ArrayType(type).toJSONSchema(parent), ...rest });
        }
    } else if (isObject(type)) {
        const required: string[] = [];
        const schema: JSONSchema = {
            type: "object",
            properties: Object.keys(type).reduce((properties, prop) => {
                const subSchema = toJSONSchema(type[prop], { parent: _type });

                if (subSchema) {
                    properties[prop] = subSchema;

                    const subType = ensureType(type[prop]);
                    let isRequired: boolean;

                    if (subType instanceof ValidateableType) {
                        isRequired = !subType["_optional"];
                    } else if (Array.isArray(subType)) {
                        isRequired = true;
                    } else {
                        isRequired = false;
                    }

                    if (isRequired) {
                        required.push(prop);
                    }
                }

                return properties;
            }, {}),
        };

        schema["required"] = required;
        schema["additionalProperties"] = false;

        return omitUndefined({ ...schema, ...rest });
    } else {
        return omitUndefined({
            ...ensureType(type, "", true).toJSONSchema(parent),
            ...rest,
        });
    }
}

/**
 * Creates JSON Schema base on the type definition.
 */
export function getJSONSchema(type: any): JSONSchema;
export function getJSONSchema(type: any, options: {
    $id: string;
    title?: string;
    description?: string;
}): JSONSchema & {
    $schema: string;
    $id: string;
    title?: string;
};
export function getJSONSchema(type: any, options: {
    $id: string;
    title?: string;
    description?: string;
} = null) {
    const schema = toJSONSchema(type);

    if (options?.$id) {
        return omitUndefined({
            $schema: jsonSchemaDraftLink,
            $id: options.$id,
            title: options.title,
            ...schema,
            description: schema.description || options.description,
        } as {
            $schema: string;
            $id: string;
            title?: string;
        } & JSONSchema);
    } else {
        return schema;
    }
}

Function.prototype.getJSONSchema = function (options) {
    const title = options?.title || this[_title] as string;
    const $id = options?.$id || title;
    const hasSuffix = $id?.endsWith(".schema.json");
    const parentId = hasSuffix ? $id.slice(0, -12) : $id;
    const paramsDef = this[_params] as { type: any; name?: string; remarks?: string; }[];
    const returnDef = this[_returns] as { type: any; name: string; remarks?: string; };
    const isVoidParam = paramsDef?.length === 1 && paramsDef[0].type instanceof VoidType;
    const required: string[] = [];

    if (!this[_title])
        return null;

    const schema = omitUndefined({
        $schema: jsonSchemaDraftLink,
        $id: options?.$id || title,
        title,
        type: "function" as const,
        description: options?.description || this[_remarks],
        deprecated: !isValid(this[_deprecated]) ? void 0 : true,
    });

    schema["parameters"] = paramsDef && !isVoidParam ? paramsDef.reduce((records, item, index) => {
        const name = item.name || "arg" + index;

        records[name] = getJSONSchema(item.type, {
            $id: `${parentId}.parameters.${name}` + (hasSuffix ? ".schema.json" : ""),
            title: `${title}.parameters.${name}`,
            description: item.remarks,
        });

        if (!(item.type instanceof ValidateableType) || !item.type["_optional"]) {
            required.push(name);
        }

        return records;
    }, {}) : null;

    if (required.length) {
        schema["required"] = required;
    }

    schema["returns"] = returnDef && !(returnDef.type instanceof VoidType) ? getJSONSchema(returnDef.type, {
        $id: `${parentId}.${returnDef.name}` + (hasSuffix ? ".schema.json" : ""),
        title: `${title}.${returnDef.name}`,
        description: returnDef.remarks,
    }) : null;

    return schema;
};
