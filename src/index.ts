import "@hyurl/utils/types";
import omit from "@hyurl/utils/omit";
import pick from "@hyurl/utils/pick";
import isVoid from "@hyurl/utils/isVoid";

export type JSONSchema = {
    type: "string" | "number" | "integer" | "boolean" | "array" | "object" | "null" | string[];
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
     * Sets the current property and the other properties to be alternatives,
     * and only one of them are required. This function must be used along with
     * `optional` directive and only have to be set on one of the alternative
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
        suppress?: boolean | 0 | 1 | 2;
    } = null): T | never {
        if (value === null || value === void 0 || Object.is(value, NaN)) {
            const message = `${path} is required, but no value is provided`;

            if (this._default !== void 0) {
                return this._default;
            } else if (this._optional) {
                return Object.is(value, NaN) ? null : value;
            } else if (!options?.suppress) {
                throw new Error(message);
            } else if (options?.suppress !== 2 &&
                !options.warnings.some(item => item.path === path && item.message === message)
            ) {
                options.warnings.push({ path, message });
                return Object.is(value, NaN) ? null : value;
            }
        } else if (!isVoid(this._deprecated) && options?.warnings) {
            const message = this._deprecated
                ? `${path} is deprecated: ${this._deprecated}`
                : `${path} is deprecated`;

            if (!options.warnings.some(item => item.path === path && item.message === message)) {
                options.warnings.push({ path, message });
            }
        }

        return value;
    }


    abstract toJSONSchema(): JSONSchema;

    /** @internal */
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

    protected throwTypeError(path: string, value: any, expectedType: string | string[]) {
        expectedType = read(expectedType);
        const actualType = readType(value);

        throw new TypeError(`${path} is expected to be ${expectedType}, but ${actualType} is given`);
    }

    protected conversionWarning(path: string, value: any, expectedType: string) {
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
        | RegExp | ((value: string) => boolean) = null;
    private static EmailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    private static PhoneRegex = /^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/;
    private static IpRegex = /^(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))$/;
    private static UrlRegex = /^[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;
    private static HostnameRegex = /^localhost$|^(([a-z0-9A-Z]\.)*[a-z0-9-]+\.)?([a-z0-9]{2,24})+(\.co\.([a-z0-9]{2,24})|\.([a-z0-9]{2,24}))$/;
    private static DateRegex = /^(19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)$/;
    private static TimeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
    private static DatetimeRegex = /^(19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31) ([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;

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
        | RegExp
        | ((value: string) => boolean)
    ) {
        return this.deriveWith({ _match: pattern });
    }

    /** @internal */
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
            this.throwTypeError(path, value, "string");
        } else if (typeof value === "number" ||
            typeof value === "bigint" ||
            typeof value === "boolean"
        ) {
            _value = String(value);
        } else if (value instanceof Date) {
            _value = value.toISOString();
        } else if (typeof value !== "string") {
            this.throwTypeError(path, value, "string");
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
                err = new RangeError(`${path} must be provided and cannot be empty`);
            }
        } else if (this._minLength && _value.length < this._minLength) {
            err = new RangeError(`${path} must not be shorter than ${this._minLength}`);
        } else if (this._maxLength && _value.length > this._maxLength) {
            err = new RangeError(`${path} must not be longer than ${this._maxLength}`);
        } else if (this._enum?.length && !this._enum.includes(_value)) {
            if (this._enum.length === 1) {
                err = new Error(`${path} must be '${this._enum[0]}'`);
            } else {
                const values = this._enum.map(value => `'${value}'`).join(", ");
                err = new Error(`${path} must be one of these values: ${values}`);
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
        } else if (this._match instanceof RegExp && !this._match.test(_value)) {
            err = new Error(`${path} does not match the pattern: ${this._match}`);
        } else if (typeof this._match === "function" && !this._match(_value)) {
            err = new Error(`${path} does not fulfill the requirement`);
        }

        if (err) {
            if (!options?.suppress) {
                throw err;
            } else {
                options?.warnings?.push({
                    path,
                    message: err.message
                });
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
        } else if (this._match instanceof RegExp) {
            pattern = this._match;
        }

        const schema: JSONSchema = {
            type: "string",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
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

        return schema;
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
    // @ts-ignore
    enum<T>(values: T): StringEnum<T>;
    // @ts-ignore
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

    /** Sets the enum options of which the text can be. */
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

    /** @internal */
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
            this.throwTypeError(path, value, "number");
        } else if (typeof value === "bigint") {
            if (value <= Number.MAX_SAFE_INTEGER) {
                _value = Number(value);
            } else {
                this.throwTypeError(path, value, "number");
            }
        } else if (typeof value === "boolean") {
            _value = Number(value);
        } else if (typeof value === "string") {
            _value = Number(value);

            if (Number.isNaN(_value) || _value > Number.MAX_SAFE_INTEGER) {
                this.throwTypeError(path, value, "number");
            }
        } else if (value instanceof Date) {
            _value = value.valueOf();
        } else if (typeof value !== "number") {
            this.throwTypeError(path, value, "number");
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
            err = new TypeError(`${path} must be an integer`);
        } else if (this._min && _value < this._min) {
            err = new RangeError(`${path} must not be less than ${this._min}`);
        } else if (this._max && _value > this._max) {
            err = new RangeError(`${path} must not be greater than ${this._max}`);
        } else if (this._enum?.length && !this._enum.includes(_value)) {
            if (this._enum.length === 1) {
                err = new Error(`${path} must be ${this._enum[0]}`);
            } else {
                err = new Error(`${path} must be one of these values: ${this._enum.join(", ")}`);
            }
        }

        if (err) {
            if (!options?.suppress) {
                throw err;
            } else {
                options?.warnings?.push({
                    path,
                    message: err.message
                });
            }
        }

        return _value;
    }

    toJSONSchema(): JSONSchema {
        const schema: JSONSchema = {
            type: this._integer ? "integer" : "number",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
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

        return schema;
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
    // @ts-ignore
    enum<T>(values: T): NumberEnum<T>;
    // @ts-ignore
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

    /** Sets the enum options of which the text can be. */
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

    /** @internal */
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
            this.throwTypeError(path, value, "bigint");
        } else if (typeof value === "number") {
            _value = BigInt(value);
        } else if (typeof value === "boolean") {
            _value = BigInt(value);
        } else if (typeof value === "string" && !Number.isNaN(Number(value))) {
            _value = BigInt(value);
        } else if (typeof value !== "bigint") {
            this.throwTypeError(path, value, "bigint");
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
            err = new RangeError(`${path} must not be less than ${this._min}`);
        } else if (this._max && _value > this._max) {
            err = new RangeError(`${path} must not be greater than ${this._max}`);
        } else if (this._enum?.length && !this._enum.includes(_value)) {
            if (this._enum.length === 1) {
                err = new Error(`${path} must be ${this._enum[0]}`);
            } else {
                err = new Error(`${path} must be one of these values: ${this._enum.join(", ")}`);
            }
        }

        if (err) {
            if (!options?.suppress) {
                throw err;
            } else {
                options?.warnings?.push({
                    path,
                    message: err.message
                });
            }
        }

        return _value;
    }

    toJSONSchema(): JSONSchema {
        return {
            type: "integer",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
            enum: this._enum ?? void 0,
            minimum: this._min,
            maximum: this._max,
        };
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
    // @ts-ignore
    enum<T>(values: T): BigIntEnum<T>;
    // @ts-ignore
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

    /** Sets the enum options of which the text can be. */
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

    /** @internal */
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
            this.throwTypeError(path, value, "boolean");
        } else if (typeof value === "number") {
            if (value === 1) {
                _value = true;
            } else if (value === 0) {
                _value = false;
            } else {
                this.throwTypeError(path, value, "boolean");
            }
        } else if (typeof value === "bigint") {
            if (value === BigInt(1)) {
                _value = true;
            } else if (value === BigInt(0)) {
                _value = false;
            } else {
                this.throwTypeError(path, value, "boolean");
            }
        } else if (typeof value === "string") {
            if (value === "true") {
                _value = true;
            } else if (value === "false") {
                _value = false;
            } else {
                this.throwTypeError(path, value, "boolean");
            }
        } else if (typeof value !== "boolean") {
            this.throwTypeError(path, value, "boolean");
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
        return {
            type: "boolean",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
        };
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

    /** @internal */
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
            this.throwTypeError(path, value, "type of Date");
        } else if (typeof value === "number" || typeof value === "string") {
            _value = new Date(value);

            if (String(_value) === "Invalid Date") {
                this.throwTypeError(path, value, "type of Date");
            }
        } else if (!(value instanceof Date)) {
            this.throwTypeError(path, value, "type of Date");
        } else {
            _value = value;
        }

        if (_value !== value) {
            options?.warnings?.push({
                path,
                message: this.conversionWarning(path, value, "type of Date")
            });
        }

        return _value;
    }

    toJSONSchema(): JSONSchema {
        return {
            type: "string",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
            format: "date-time",
        };
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

export class MixedType extends ValidateableType<object> {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "MixedType" {
        return "MixedType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalMixedType());
    }

    default(value: object) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalMixedType());
    }

    /** @internal */
    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
    } = null): Date | never {
        value = super.validate(path, value, options);

        if (value === null || value === void 0) {
            return value;
        } else if (!(value instanceof Object)) {
            this.throwTypeError(path, value, "object");
        } else {
            return value;
        }
    }

    toJSONSchema(): JSONSchema {
        return {
            type: "object",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
        };
    }
}

export class OptionalMixedType extends MixedType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "OptionalMixedType" {
        return "OptionalMixedType";
    }

    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new MixedType());
    }
}

// @ts-ignore
export class AnyType extends ValidateableType<any> {
    protected _default = null;

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "AnyType" {
        return "AnyType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalAnyType());
    }

    // @ts-ignore
    default(value: any) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalAnyType());
    }

    toJSONSchema(): JSONSchema {
        return {
            type: ["string", "number", "integer", "boolean", "object", "array", "null"],
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
        };
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
        return this.deriveWith({ _optional: true });
    }

    // @ts-ignore
    get required(): never {
        throw new ReferenceError("VoidType is always optional, calling `required` makes no sense");
    }

    // @ts-ignore
    default(value: null) {
        return this.deriveWith({ _optional: true, _default: value });
    }

    /** @internal */
    validate(path: string, value: any): void {
        if (value !== null && value !== void 0) {
            this.throwTypeError(path, value, "void");
        }
    }

    toJSONSchema(): JSONSchema {
        return {
            type: "null",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
        };
    }
}

export class CustomType<T> extends ValidateableType<T> {
    protected _guard: (data: any) => (T extends ValidateableType<infer U>
        ? ExtractInstanceType<U>
        : T extends ValidateableType<infer U>[] ? ExtractInstanceType<U>[]
        : T extends readonly ValidateableType<infer U>[] ? readonly ExtractInstanceType<U>[]
        : T);

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

    // @ts-ignore
    default(value: T extends ValidateableType<infer U>
        ? ExtractInstanceType<U>
        : T extends ValidateableType<infer U>[] ? ExtractInstanceType<U>[]
        : T extends readonly ValidateableType<infer U>[] ? readonly ExtractInstanceType<U>[]
        : T
    ) {
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
    guard(transform: (data: any) => (T extends ValidateableType<infer U>
        ? ExtractInstanceType<U>
        : T extends ValidateableType<infer U>[] ? ExtractInstanceType<U>[]
        : T extends readonly ValidateableType<infer U>[] ? readonly ExtractInstanceType<U>[]
        : T)
    ) {
        this._guard = transform;
        return this;
    }

    /** @internal */
    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownProps?: boolean;
    } = null): T | never {
        value = super.validate(path, value, options);

        if (value === null || value === void 0) {
            return value;
        } else if (this._guard) {
            value = this._guard(value);
        }

        if (this.type instanceof Function) {
            if (value instanceof this.type) {
                return value;
            } else {
                this.throwTypeError(path, value, "type of " + this.type.name);
            }
        } else if (isObject(this.type)) {
            if (isObject(value)) {
                return validate(value, this.type as any, path, options) as any;
            } else {
                this.throwTypeError(path, value, "object");
            }
        } else if (Array.isArray(this.type)) {
            if (Array.isArray(value)) {
                return validate(value as any, this.type, path, options) as any;
            } else {
                this.throwTypeError(path, value, "array");
            }
        } else {
            return validate(value, this.type, path, options) as any;
        }
    }

    toJSONSchema(): JSONSchema {
        if (this.type instanceof Function) {
            return {
                type: "object",
                description: this._remarks,
                default: this._default,
                deprecated: isVoid(this._deprecated) ? void 0 : true,
            };
        } else {
            return getJSONSchema(this.type, {
                description: this._remarks,
                default: this._default,
                deprecated: isVoid(this._deprecated) ? void 0 : true,
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

export class UnionType<T> extends ValidateableType<T> {
    private _guard: (data: any) => T;

    constructor(public types: T[]) {
        super();
    }

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag](): "UnionType" {
        return "UnionType";
    }

    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalUnionType(this.types));
    }

    // @ts-ignore
    default(value: T) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalUnionType(this.types));
    }

    /**
     * Defines a function that transforms the input data to the desired type.
     * @example
     * ```ts
     * class Example {
     *     \@param({
     *         id: String, 
     *         name: String.optional,
     *         avatar: as(Avatar, Image)
     *             .guard(data => [Avatar, Image].includes(data.constructor) ? data : new Avatar(data))
     *             .optional
     *     }, "data")
     *     async create(data: { id: string; name?: string; avatar?: Avatar | Image }) {
     *         // ...
     *     }
     * }
     * ```
     */
    guard(transform: (data: any) => T) {
        this._guard = transform;
        return this;
    }

    /** @internal */
    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownProps?: boolean;
    } = null): T | never {
        value = super.validate(path, value, { ...options, suppress: 2 });
        let _value: T;

        if (value === null || value === void 0) {
            return value;
        } else if (this._guard) {
            value = this._guard(value);
        }

        for (const type of this.types) {
            try {
                _value ??= validate(value, type, path, {
                    strict: true,
                    suppress: options?.suppress,
                    warnings: options?.warnings,
                    removeUnknownProps: options?.removeUnknownProps,
                }) as any;

                if (_value !== null && _value !== void 0) {
                    return _value;
                }
            } catch (err) {
                if (String(err).includes("required")) {
                    throw err;
                }
            } // eslint-disable-line
        }

        if (!options?.strict) {
            for (const type of this.types) {
                try {
                    _value ??= validate(value, type, path, {
                        strict: false,
                        suppress: options?.suppress,
                        warnings: options?.warnings,
                        removeUnknownProps: options?.removeUnknownProps,
                    }) as any;

                    if (_value !== null && _value !== void 0) {
                        return _value;
                    }
                } catch (err) { } // eslint-disable-line
            }
        }

        this.throwTypeError(path, value, this.types.map(type => {
            if (Object.is(type, String) || Object.is(type, StringType)) {
                return "string";
            } else if (Object.is(type, Number) || Object.is(type, NumberType)) {
                return "number";
            } else if (Object.is(type, BigInt) || Object.is(type, BigIntType)) {
                return "bigint";
            } else if (Object.is(type, Boolean) || Object.is(type, BooleanType)) {
                return "boolean";
            } else if (Object.is(type, Date) || Object.is(type, DateType)) {
                return "type of Date";
            } else if (Object.is(type, Object) || Object.is(type, MixedType) || isObject(type)) {
                return "object";
            } else if (Object.is(type, Any) || Object.is(type, AnyType)) {
                return "any";
            } else if (Object.is(type, Void) || Object.is(type, VoidType)) {
                return "void";
            } else if (Array.isArray(type)) {
                return "array";
            } else if (typeof type === "function") {
                return "type of " + type.name;
            } else if (typeof type.constructor === "function") {
                return "type of " + type.constructor.name;
            } else {
                return "unknown";
            }
        }));
    }

    toJSONSchema(): JSONSchema {
        const types: string[] = [];

        for (const type of this.types) {
            const _schema = getJSONSchema(type);
            types.push(_schema.type as string);
        }

        return {
            type: types,
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
        };
    }
}

export class OptionalUnionType<T> extends UnionType<T> {
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

    // @ts-ignore
    default(value: Record<ExtractInstanceType<K>, ExtractInstanceType<V>>) {
        return this.deriveWith({
            _optional: true,
            _default: value,
        }, new OptionalDictType(this.key, this.value));
    }

    /** @internal */
    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownProps?: boolean;
    } = null): Record<ExtractInstanceType<K>, ExtractInstanceType<V>> | never {
        value = super.validate(path, value, options);

        if (value === null || value === void 0) {
            return value;
        } else if (!isObject(value)) {
            this.throwTypeError(path, value, "object");
        } else {
            const records = {} as Record<ExtractInstanceType<K>, ExtractInstanceType<V>>;

            for (let [_key, _value] of Object.entries(value)) {
                try {
                    _key = validate(_key as any, this.key, path, options);
                } catch (err) {
                    if (err instanceof Error && String(err).includes("must be one of these values")) {
                        err.message = err.message.replace("must be one of these values",
                            "must contain only these properties");
                    }

                    if (!options?.suppress) {
                        throw err;
                    } else {
                        options?.warnings?.push({
                            path,
                            message: err instanceof Error ? err.message : String(err),
                        });
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

    toJSONSchema(): JSONSchema {
        const schema: JSONSchema = {
            type: "object",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
        };

        if (this.key instanceof StringEnum) {
            const valueSchema = getJSONSchema(this.value);
            const props = this.key.enum() as string[];

            schema["properties"] = props.reduce((properties, prop) => {
                properties[prop] = valueSchema;
                return properties;
            }, {});

            if (!(this.key instanceof OptionalStringEnum)) {
                schema["required"] = props;
            }
        }

        return schema;
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

export class ArrayType<T extends any[]> extends CustomType<T> {
    private _minItems: number = void 0;
    private _maxItems: number = void 0;
    private _uniqueItems = false;

    constructor(readonly type: T) {
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
    default(value: T) {
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

    /** @internal */
    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownProps?: boolean;
    } = null): T | never {
        value = ValidateableType.prototype.validate.call(this, path, value, {
            ...options,
            suppress: 2
        });
        let _value: T;
        let err: Error;

        if (value === null || value === void 0) {
            return value;
        } else if (this._guard) {
            value = this._guard(value);
        }

        if (!Array.isArray(value)) {
            this.throwTypeError(path, value, "array");
        } else {
            _value = value as any;
        }

        if (this._minItems && _value.length < this._minItems) {
            const count = this._minItems === 1 ? "1 item" : `${this._minItems} items`;
            err = new Error(`${path} must contain at least ${count}`);
        } else if (this._maxItems && _value.length > this._maxItems) {
            const count = this._maxItems === 1 ? "1 item" : `${this._maxItems} items`;
            err = new Error(`${path} must contain no more than ${count}`);
        } else if (this._uniqueItems && new Set(_value).size !== _value.length) {
            err = new Error(`${path} must contain unique items`);
        }

        if (err) {
            if (!options?.suppress) {
                throw err;
            } else {
                options?.warnings?.push({ path, message: err.message });
            }
        }

        return validate(_value as any, this.type, path, options) as T;
    }

    toJSONSchema(): JSONSchema {
        const type = this.type[0];
        const valueSchema = getJSONSchema(type);
        const schema: JSONSchema = {
            type: "array",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
            items: valueSchema,
            minItems: this._minItems,
            maxItems: this._maxItems,
            uniqueItems: this._uniqueItems || void 0,
        };

        if (type instanceof StringEnum) {
            schema["enum"] = type.enum() as string[];
        } else if (type instanceof NumberEnum) {
            schema["enum"] = type.enum() as number[];
        } else if (type instanceof BigIntEnum) {
            schema["enum"] = type.enum() as bigint[];
        }

        return schema;
    }
}

export class OptionalArrayType<T extends any[]> extends ArrayType<T> {
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

export class TupleType<T extends readonly any[]> extends CustomType<T> {
    constructor(readonly type: T) {
        super(type);
    }

    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag](): "TupleType" {
        return "TupleType";
    }

    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalTupleType(this.type));
    }

    // @ts-ignore
    default(value: T) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalTupleType(this.type));
    }

    /** @internal */
    validate(path: string, value: any, options: {
        strict?: boolean;
        suppress?: boolean;
        warnings?: ValidationWarning[];
        removeUnknownProps?: boolean;
    } = null): T | never {
        value = ValidateableType.prototype.validate.call(this, path, value, {
            ...options,
            suppress: 2
        });
        let _value: T;

        if (value === null || value === void 0) {
            return value;
        } else if (this._guard) {
            value = this._guard(value);
        }

        if (!Array.isArray(value)) {
            this.throwTypeError(path, value, "array");
        } else {
            _value = value as any;
        }

        const result = [];

        for (let i = 0; i < this.type.length; i++) {
            result.push(validate(_value[i], this.type[i], `${path}[${i}]`, options));
        }

        if (_value.length > this.type.length) {
            const start = this.type.length;
            const end = _value.length - 1;

            if (options?.removeUnknownProps) {
                if (!options?.suppress) {
                    const target = end === start
                        ? `element ${path}[${start}] has`
                        : `elements ${path}[${start}...${end}] have`;

                    options?.warnings?.push({
                        path,
                        message: `unknown ${target} been removed`,
                    });
                }
            } else {
                result.push(..._value.slice(start, end + 1));
            }
        }

        return result as any as T;
    }

    toJSONSchema(): JSONSchema {
        const valueSchema = getJSONSchema(this.type);
        return {
            type: "array",
            description: this._remarks,
            default: this._default,
            deprecated: isVoid(this._deprecated) ? void 0 : true,
            items: valueSchema,
            minItems: this.type.length,
            maxItems: this.type.length,
        };
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

export type IndexableType = StringConstructor
    | typeof StringType
    | StringType
    | OptionalStringType
    | StringEnum<any>
    | OptionalStringEnum<any>;

export type OptionalTypes = OptionalStringType
    | OptionalStringEnum<any>
    | OptionalNumberType
    | OptionalNumberEnum<any>
    | OptionalBigIntType
    | OptionalBigIntEnum<any>
    | OptionalBooleanType
    | OptionalDateType
    | OptionalMixedType
    | OptionalAnyType
    | OptionalCustomType<any>
    | OptionalUnionType<any>
    | OptionalTupleType<any>
    | OptionalDictType<IndexableType, any>
    | OptionalArrayType<any>
    | VoidType;

export type RequiredPropertyNames<T> = {
    [K in keyof T]: T[K] extends OptionalTypes ? never : K;
}[keyof T];

export type OptionalPropertyNames<T> = {
    [K in keyof T]: T[K] extends OptionalTypes ? K : never;
}[keyof T];

export type ExtractInstanceType<T> = T extends OptionalStringEnum<infer U> ? (U extends readonly (infer V)[] ? V : U)
    : T extends StringEnum<infer U> ? (U extends readonly (infer V)[] ? V : U)
    : T extends (StringConstructor | typeof StringType | StringType | OptionalStringType) ? string
    : T extends OptionalNumberEnum<infer U> ? (U extends readonly (infer V)[] ? V : U)
    : T extends NumberEnum<infer U> ? (U extends readonly (infer V)[] ? V : U)
    : T extends (NumberConstructor | typeof NumberType | NumberType | OptionalNumberType) ? number
    : T extends OptionalBigIntEnum<infer U> ? (U extends readonly (infer V)[] ? V : U)
    : T extends BigIntEnum<infer U> ? (U extends readonly (infer V)[] ? V : U)
    : T extends (BigIntConstructor | typeof BigIntType | BigIntType | OptionalBigIntType) ? bigint
    : T extends (BooleanConstructor | typeof BooleanType | BooleanType | OptionalBooleanType) ? boolean
    : T extends (DateConstructor | typeof DateType | DateType | OptionalDateType) ? Date
    : T extends (ObjectConstructor | typeof MixedType | MixedType | OptionalMixedType) ? object
    : T extends (typeof AnyType | AnyType | OptionalAnyType) ? any
    : T extends (typeof VoidType | VoidType) ? void
    : T extends (infer U)[] ? ExtractInstanceType<U>[]
    : T extends readonly [infer A, infer B] ? readonly [ExtractInstanceType<A>, ExtractInstanceType<B>]
    : T extends readonly [infer A, infer B, infer C] ? readonly [ExtractInstanceType<A>, ExtractInstanceType<B>, ExtractInstanceType<C>]
    : T extends readonly [infer A, infer B, infer C, infer D] ? readonly [ExtractInstanceType<A>, ExtractInstanceType<B>, ExtractInstanceType<C>, ExtractInstanceType<D>]
    : T extends readonly [...infer U] ? readonly [...ExtractInstanceType<U>]
    : T extends (UnionType<infer U> | OptionalUnionType<infer U>) ? U
    : T extends (ArrayType<infer U> | OptionalArrayType<infer U>) ? (U extends (infer V)[] ? ExtractInstanceType<V>[] : U)
    : T extends (TupleType<infer U> | OptionalTupleType<infer U>) ? (U extends (infer V)[] ? ExtractInstanceType<V>[] : U)
    : T extends (CustomType<infer U> | OptionalCustomType<infer U>) ? (U extends (infer V)[] ? ExtractInstanceType<V>[] : U)
    : T extends (DictType<infer K, infer V> | OptionalDictType<infer K, infer V>) ? Record<ExtractInstanceType<K>, ExtractInstanceType<V>>
    : T extends Record<string, unknown> ? (
        {
            // @ts-ignore
            [K in RequiredPropertyNames<T>]: ExtractInstanceType<T[K]>;
        } & {
            // @ts-ignore
            [K in OptionalPropertyNames<T>]?: ExtractInstanceType<T[K]>;
        })
    : T extends new (...args: any[]) => any ? InstanceType<T>
    : T;

export type EnsureOptionalProperties<T extends Record<string, unknown>> = {
    [K in keyof T]: T[K] extends OptionalTypes ? T[K]
    : T[K] extends StringEnum<infer U> ? OptionalStringEnum<U>
    : T[K] extends (StringConstructor | typeof StringType | StringType) ? OptionalStringType
    : T[K] extends NumberEnum<infer U> ? OptionalNumberEnum<U>
    : T[K] extends (NumberConstructor | typeof NumberType | NumberType) ? OptionalNumberType
    : T[K] extends BigIntEnum<infer U> ? OptionalBigIntEnum<U>
    : T[K] extends (BigIntConstructor | typeof BigIntType | BigIntType) ? OptionalBigIntType
    : T[K] extends (BooleanConstructor | typeof BooleanType | BooleanType) ? OptionalBooleanType
    : T[K] extends (DateConstructor | typeof DateType | DateType) ? OptionalDateType
    : T[K] extends (ObjectConstructor | typeof MixedType | MixedType) ? OptionalMixedType
    : T[K] extends (typeof AnyType | AnyType) ? OptionalAnyType
    : T[K] extends CustomType<infer U> ? OptionalCustomType<U>
    : T[K] extends ArrayType<infer U> ? OptionalArrayType<U>
    : T[K] extends UnionType<infer U> ? OptionalUnionType<U>
    : T[K] extends DictType<infer K, infer V> ? OptionalDictType<K, V>
    : T[K] extends TupleType<infer U> ? TupleType<U>
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
    : T[K] extends OptionalMixedType ? MixedType
    : T[K] extends OptionalAnyType ? AnyType
    : T[K] extends OptionalCustomType<infer U> ? CustomType<U>
    : T[K] extends OptionalArrayType<infer U> ? ArrayType<U>
    : T[K] extends OptionalUnionType<infer U> ? UnionType<U>
    : T[K] extends OptionalDictType<infer K, infer V> ? DictType<K, V>
    : T[K] extends OptionalTupleType<infer U> ? TupleType<U>
    : T[K]
};

function augmentStaticMethods(ctor: new (...args: any[]) => any, type: new () => any) {
    const ins = new type() as ValidateableType<any>;
    ctor["optional"] = ins.optional;
    ctor["required"] = ins.required;
    ctor["default"] = (value: any) => ins.default(value);
    ctor["deprecated"] = (message: string) => ins.deprecated(message);
    ctor["alternatives"] = (...props: string[]) => ins.alternatives(...props);
    ctor["associates"] = (...props: string[]) => ins.associates(...props);
    ctor["remarks"] = (note: string) => ins.remarks(note);

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
augmentStaticMethods(Object, MixedType);

export const Any = new AnyType();
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
    interface ObjectConstructor extends MixedType { } // eslint-disable-line

    interface Array<T> {
        optional: OptionalArrayType<T[]>;
        required: ArrayType<T[]>;
        default: (value: T[]) => OptionalArrayType<T[]>;
        remarks: (note: string) => ArrayType<T[]>;
        deprecated: (message?: string) => ArrayType<T[]>;
        alternatives: (...props: string[]) => ArrayType<T[]>;
        associates: (...props: string[]) => ArrayType<T[]>;
        minItems: (count: number) => ArrayType<T[]>;
        maxItems: (count: number) => ArrayType<T[]>;
    }

    interface Function {
        /**
         * Returns the JSON Schema representation of the function. If available,
         * returns a schema with `type: 'function'` and with `parameters` and
         * `returns` keywords. Otherwise, `null` is returned.
         */
        getJSONSchema: (options?: {
            $id: string;
        }) => Omit<JSONSchema, "type"> & {
            $schema: string;
            $id: string;
            title: string;
            type: "function";
        };
    }
}

function isObject(value: any) {
    return typeof value === "object" && !!value && value.constructor === Object;
}

function isEmptyValue(value: any) {
    return value === null || value === void 0 || value === "";
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

function read(text: string | string[]): string {
    if (Array.isArray(text)) {
        return join([read(text[0]), ...text.slice(1)], "or");
    } else if (["any", "unknown", "null", "undefined", "void"].includes(text) ||
        text.startsWith("type of")
    ) {
        return text;
    } else if (["a", "e", "i", "o", "u"].includes(text[0])) {
        return "an " + text;
    } else {
        return "a " + text;
    }
}

function readType(value: any) {
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
        type = "type of " + (value as object).constructor.name;
    } else {
        type = "a " + (typeof value);
    }

    return type;
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
        } else if (Object.is(type, Object) || Object.is(type, MixedType)) {
            return new MixedType();
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
            // @ts-ignore
            return as(type);
        } else if (typeof type === "string") {
            return new StringType().enum([type]);
        } else if (typeof type === "number") {
            return new NumberType().enum([type]);
        } else if (typeof type === "bigint") {
            return new BigIntType().enum([type]);
        } else {
            const name = type.constructor?.name || "unknown";
            throw new TypeError(`${path} (${name}) is not a validateable type`);
        }
    };

    return reduce(type, path) as ValidateableType<any>;
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
export function as<T extends ValidateableType<any>>(type: T): T;
export function as<T extends readonly any[]>(type: T): TupleType<ExtractInstanceType<T>>;
export function as<T>(type: T): CustomType<ExtractInstanceType<T>>;
export function as<T extends any[]>(...types: T): UnionType<ExtractInstanceType<T>[0]>;
export function as<T>(...types: (T | Constructor<T>)[]) {
    if (types.length === 1) {
        const [type] = types;

        if (Array.isArray(type)) {
            return new TupleType(type);
        } else if ([String, Number, BigInt, Boolean, Date, Object].includes(type as any)
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
export function validate<T>(value: ExtractInstanceType<T>, type: T, variable = "$", options: {
    /** Use strict mode, will disable any implicit type conversion. */
    strict?: boolean;
    /** Suppress non-critical errors to warnings. */
    suppress?: boolean;
    /**
     * A list used to  store all the warnings occurred during the validation
     * process.
     */
    warnings?: ValidationWarning[];
    /**
     * Remove all properties in the value (if it's an object or tuple) that are
     * not defined if the type.
     */
    removeUnknownProps?: boolean;
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
                        throw new Error(`${path} must contain one of these properties: ${props}`);
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

                            throw new Error(
                                `${path} must contain ${others} when property '${prop}' is provided`);
                        }
                    }
                }

                if (!options?.removeUnknownProps) {
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
                                message: `${_path} is an unknown property and is removed`,
                            });
                        }
                    });
                }

                return records;
            } else {
                // @ts-ignore
                return as(type).validate(path, value, options);
            }
        } else {
            // @ts-ignore
            return ensureType(type, path, true).validate(path, value, options);
        }
    };

    return reduce(type, value, variable);
}

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

const _methods = Symbol.for("methods");
const _params = Symbol.for("params");
const _returns = Symbol.for("returns");
const _throws = Symbol.for("throws");
const _title = Symbol.for("title");
const _remarks = Symbol.for("remarks");
const _deprecated = Symbol.for("deprecated");

class ValidationError extends Error {
    readonly cause?: unknown;

    constructor(message: string, options: { cause: unknown; }) {
        // @ts-ignore
        super(message, options);
        this.cause ??= options.cause;
    }
}

const wrapMethod = (target: any, prop: string | symbol, desc: TypedPropertyDescriptor<any>) => {
    if (!target[_methods]?.[prop]) {
        (target[_methods] ??= {})[prop] = desc.value;

        const fn = desc.value = (function (this: any, ...args: any[]) {
            const method = target[_methods][prop] as (...arg: any[]) => any;
            const paramsDef = fn[_params] as { type: any; name?: string; }[];
            const returnDef = fn[_returns] as { type: any; name: string; };
            const throwDef = fn[_throws] as { type: any; name: string; };
            const warnings: ValidationWarning[] = [];
            const options = { warnings, removeUnknownProps: true };

            if (!isVoid(fn[_deprecated])) {
                const message = fn[_deprecated]
                    ? `${String(prop)}() is deprecated: ${fn[_deprecated]}`
                    : `${String(prop)}() is deprecated`;
                warnings.push({ path: `${String(prop)}()`, message });
            }

            if (paramsDef) {
                if (paramsDef.length === 1 &&
                    [Void, VoidType].includes(paramsDef[0].type) &&
                    (args.length > 1 || (args.length === 1 && ![null, undefined].includes(args[0])))
                ) {
                    throw new TypeError(`${String(prop)}() is expected to have no argument, `
                        + `but ${readType(args[0])} is given`);
                }

                let _args = {};
                const paramList = [];
                const params = paramsDef.map((item, index) => {
                    return { ...item, name: item.name || "param" + index };
                }).reduce((record, item, index) => {
                    record[item.name] = item.type;
                    _args[item.name] = args[index];
                    paramList.push(item.name);
                    return record;
                }, {} as { [param: string]: any; });

                _args = validate(_args, params, "", options);
                args = paramList.map(name => _args[name]);
            }

            const handleReturns = (returns: any, returnDef: { type: any, name: string; }) => {
                try {
                    return validate(
                        returns,
                        as(returnDef.type),
                        returnDef.name,
                        { ...options, suppress: true }
                    );
                } catch (err) {
                    if (throwDef) {
                        throw new ValidationError("validation failed", { cause: err });
                    } else {
                        throw err;
                    }
                }
            };

            const handleError = (err: any) => {
                if (err instanceof ValidationError) {
                    throw err.cause;
                } else if (throwDef) {
                    const _err = validate(err, as(throwDef.type), throwDef.name, {
                        ...options,
                        suppress: true,
                    });
                    throw _err;
                } else {
                    throw err;
                }
            };

            const handleResult = () => {
                let returns = method.apply(this, args);

                if (returns && typeof returns === "object" && typeof returns.then === "function") {
                    if (returnDef) {
                        returns = (returns as Promise<any>)
                            .then(result => handleReturns(result, returnDef));
                    }

                    returns = (returns as Promise<any>).then(result => {
                        emitWarnings.call(this, warnings, result);
                        return result;
                    });

                    if (throwDef) {
                        return (returns as Promise<any>).catch(handleError);
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

        fn[_title] = (target.constructor as Constructor<any>).name + "." + String(prop);
    }
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
 *     \@param(Void) // specifically, \@param(Void) will restrain the method to take no argument.
 *     zeroArgFn() {
 *         // ...
 *     }
 * }
 * ```
 */
export function param<T>(type: T, name?: string, remarks?: string): MethodDecorator;
export function param<T>(name: string, type: T, remarks?: string): MethodDecorator;
export function param<T>(arg0: T | string, arg1?: string | T, remarks: string = void 0): MethodDecorator {
    const type = typeof arg0 === "string" ? arg1 as T : arg0 as T;
    const name = typeof arg0 === "string" ? arg0 as string : arg1 as string;

    return (target, prop, desc) => {
        wrapMethod(target, prop, desc);

        // @ts-ignore
        const fn = desc.value as (...args: any[]) => any;
        const params = (fn[_params] ??= []) as { type: any; name?: string; remarks?: string; }[];
        params.unshift({ type, name, remarks });
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
 *     \@returns(Void) // specifically, \@returns(Void) will restrain the method to return nothing.
 *     noReturnFn() {
 *         // ...
 *     }
 * }
 * ```
 */
export function returns<T>(type: T, remarks: string = void 0): MethodDecorator {
    return (target, prop, desc) => {
        wrapMethod(target, prop, desc);

        // @ts-ignore
        const fn = desc.value as (...args: any[]) => any;
        fn[_returns] = { type, name: "returns", remarks };
    };
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
export function throws<T>(type: T): MethodDecorator {
    return (target, prop, desc) => {
        wrapMethod(target, prop, desc);

        // @ts-ignore
        const fn = desc.value as (...args: any[]) => any;
        fn[_throws] = { type, name: "throws" };
    };
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
export function remarks(note: string): MethodDecorator {
    return (target, prop, desc) => {
        wrapMethod(target, prop, desc);

        // @ts-ignore
        const fn = desc.value as (...args: any[]) => any;
        fn[_remarks] = note;
    };
}

/**
 * A decorator that deprecates the method and emit warning message when the
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
export function deprecated(message = ""): MethodDecorator {
    return (target, prop, desc) => {
        wrapMethod(target, prop, desc);

        // @ts-ignore
        const fn = desc.value as (...args: any[]) => any;
        fn[_deprecated] = message;
    };
}

export function wrap<A, R>(params: A, returns: R) {
    return (fn: WrappedFunction<A, R>) => (function (this: any, arg) {
        const warnings: ValidationWarning[] = [];
        const options = { warnings, removeUnknownProps: true };
        arg = validate(arg, params, "params", options);
        let result = fn(arg);

        if (result && typeof result === "object" && typeof result["then"] === "function") {
            return (result as Promise<ExtractInstanceType<R>>)
                .then(res => validate(res, returns, "returns", {
                    ...options,
                    suppress: true,
                })).then(res => {
                    emitWarnings.call(this, warnings, res);
                    return res;
                });
        } else {
            result = validate(result as ExtractInstanceType<R>, returns, "returns", {
                ...options,
                suppress: true,
            });

            emitWarnings.call(this, warnings, result);
            return result;
        }
    }) as WrappedFunction<A, R>;
}

export type WrappedFunction<A, R> = (
    arg: ExtractInstanceType<A>
) => ExtractInstanceType<R> | Promise<ExtractInstanceType<R>>;

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
    }, {} as EnsureOptionalProperties<T extends DictType<IndexableType, unknown> ? ExtractInstanceType<T> : T>);
}

export function required<T extends (Record<string, unknown> | DictType<IndexableType, unknown>)>(type: T) {
    if (type instanceof DictType) {
        if (type.key instanceof ValidateableType) {
            if (!type.key["_optional"]) {
                return type;
            } else {
                return new DictType(type.key.required, type.value);
            }
        } else {
            // @ts-ignore
            return new DictType(ensureType(type.key).required, type.value);
        }
    }

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
    }, {} as EnsureOptionalProperties<T extends DictType<IndexableType, unknown> ? ExtractInstanceType<T> : T>);
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

function getJSONSchema(type: any, extra: Partial<JSONSchema> = {}) {
    if (Array.isArray(type)) {
        if (!type.length) {
            return { ...new ArrayType([Any]).toJSONSchema(), ...extra };
        } else if (type.length === 1) {
            return { ...new ArrayType(type).toJSONSchema(), ...extra };
        } else {
            return { ...as(...type).toJSONSchema(), ...extra }; // as union type
        }
    } else if (isObject(type)) {
        const required: string[] = [];
        const schema: JSONSchema = {
            type: "object",
            properties: Object.keys(type).reduce((properties, prop) => {
                const subSchema = getJSONSchema(type[prop]);

                if (subSchema) {
                    properties[prop] = subSchema;

                    const subType = ensureType(type[prop]);
                    let isRequired: boolean;

                    if (subType instanceof ValidateableType) {
                        isRequired = !type[prop]["_optional"];
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
        return { ...schema, ...extra };
    } else {
        try {
            return {
                ...ensureType(type, "", true).toJSONSchema(),
                ...extra,
            };
        } catch {
            return null;
        }
    }
}

/**
 * Creates JSON Schema base on the type definition.
 */
export function createJSONSchema(type: any, options: {
    $id: string;
    title: string;
    description?: string;
}) {
    const schema = getJSONSchema(type);
    return {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: options.$id,
        title: options.title,
        ...schema,
        description: schema.description || options.description,
    } as {
        $schema: string;
        $id: string;
        title: string;
    } & JSONSchema;
}

Function.prototype.getJSONSchema = function (options) {
    const title = this[_title] as string;
    const $id = options?.$id || title;
    const hasSuffix = $id.endsWith(".schema.json");
    const parentId = hasSuffix ? $id.slice(0, -12) : $id;
    const paramsDef = this[_params] as { type: any; name?: string; remarks?: string; }[];
    const returnDef = this[_returns] as { type: any; name: string; remarks?: string; };

    return title ? {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: options?.$id || title,
        title,
        type: "function",
        description: this[_remarks],
        deprecated: isVoid(this[_deprecated]) ? void 0 : true,
        parameters: paramsDef ? paramsDef.reduce((records, item, index) => {
            const name = item.name || "param" + index;

            records[name] = createJSONSchema(item.type, {
                $id: `${parentId}.parameters.${name}` + (hasSuffix ? ".schema.json" : ""),
                title: `${title}.parameters.${name}`,
                description: item.remarks,
            });

            return records;
        }, {}) : null,
        returns: returnDef ? createJSONSchema(returnDef.type, {
            $id: `${parentId}.${returnDef.name}` + (hasSuffix ? ".schema.json" : ""),
            title: `${title}.${returnDef.name}`,
            description: returnDef.remarks,
        }) : null,
    } : null;
};

// const test = wrap({ foo: String, bar: Number.optional }, Number)(({ foo, bar }) => {
//     if (bar) {
//         return foo + String(bar);
//     } else {
//         return foo;
//     }
// });

// console.log(test({ foo: "Hello", bar1: "123" }));

// console.log(validate({ foo: "hello, world", bar: 123 }, { foo: String }, "$", { removeUnknownProps: true }));

// const type = {
//     str: String.remarks("This is a string"),
//     str1: String.enum(["a", "b", "c"] as const),
//     str2: String.default(""),
//     str3: String.optional.enum(["a", "b", "c"] as const),
//     str4: String.enum(["a", "b", "c"] as const).optional,
//     num: Number,
//     num1: Number.enum([1, 2, 3] as const),
//     num2: Number.optional,
//     num3: Number.optional.enum([1, 2, 3] as const),
//     num4: Number.enum([1, 2, 3] as const).optional,
//     int: BigInt,
//     int1: BigInt.enum([1n, 2n, 3n] as const),
//     int2: BigInt.optional,
//     int3: BigInt.optional.enum([1n, 2n, 3n] as const),
//     int4: BigInt.enum([1n, 2n, 3n] as const).optional,
//     bool: Boolean,
//     bool1: Boolean.optional,
//     date: Date,
//     date1: Date.optional,
//     date2: Date.optional.required,
//     buf: as(Buffer).optional,
//     custom: as(Number).optional,
//     union: as(Number, String).optional,
//     obj: Object,
//     any: Any,
//     arr: [as(String, Number)],
//     arr1: [String.enum(["foo", "bar"] as const)],
//     arr2: [String, Number],
//     arr3: as([String, Number, String] as const),
//     // arr4: ([String, Number, Boolean] as const),
//     // arr5: ([String, Number, Boolean, String] as const),
//     deep: as({
//         str: String,
//         str1: String.enum(["a", "b", "c"] as const),
//         str2: String.optional,
//         str3: String.optional.enum(["a", "b", "c"] as const),
//         num: NumberType,
//         num1: Number.enum([1, 2, 3] as const),
//         num2: Number.optional,
//         num3: Number.optional.enum([1, 2, 3] as const),
//         union: as(Number, Boolean).optional,
//     }).optional,
//     dict: Dict(String, Number).optional,
//     dict1: Dict(String.enum(["foo", "bar"] as const), Number).optional,
//     dict2: Dict(String.optional.enum(["foo", "bar"] as const), String).optional,
//     nil: Void,
// };

// console.log(JSON.stringify(createJSONSchema(type, {
//     $id: "https://example.com/ExampleType.schema.json",
//     title: "ExampleType",
//     description: "This is just an example",
// }), null, "    "));

// class Example {
//     @remarks("Echo what you input")
//     @param("text", String, "the text you want to echo")
//     @returns(String, "returns what you input")
//     echo(text: string) {
//         return text;
//     }
// }

// console.log(new Example().echo.getJSONSchema());

// const myType = ensured(type, ["union", "custom"]);

// const value: ExtractInstanceType<typeof type> = null;

// value.arr1;

// type Arr = readonly [number, string];

// value.custom;

// value.deep.num;

// if (typeof value.deep === "string") {

// } else {
//     value.arr;
// }


// console.log(validate([1, 2, "foo", "bar", { foo: "a" }], [Number, String, Boolean, { foo: String.optional.enum(["a", "b", "c"] as const) }]));

// type _ExtractInstanceType<T> = T extends UnionType<infer U> ? U : T;

// const Union = as(String, Number).optional;
// const union: ExtractInstanceType<typeof Union> = null;

// console.log(validate({ null: "hollo" }, Dict(String.optional, as(String, Number))));

// export const QueryParams = as({
//     page: Number.optional,
//     pageSize: Number.optional,
//     filters: Dict(String, Any).optional,
//     orders: Dict(String.enum(["foo", "bar"] as const), String.enum(["asc", "desc"] as const)),
//     fields: [String].optional,
//     $project: Dict(String, Boolean).optional,
// });
// type QueryParams = ExtractInstanceType<typeof QueryParams>;
// let params: QueryParams = { orders: { foo: "asc", bar1: "desc" } };

// params = validate(params, QueryParams);


// console.log(params);

// const type = {
//     foo: String.optional,
//     bar: String.optional,
//     bar1: String.optional.alternatives("foo", "bar", "bar2").associates("bar2", "bar3"),
//     bar2: String.optional,
//     bar3: as(String, Number, Date).optional,
// };
// let value = { bar1: "123" };

// console.log(validate(value, type));

// class Example {
//     @param(Date)
//     @returns(String)
//     @throws(ReferenceError, TypeError)
//     transform(date) {
//         return date.toString();
//         // throw new TypeError("something is wrong");
//     }
// }

// (async () => {
//     const example = new Example();
//     const value = example.transform(new Date().toISOString());

//     console.log(value);
// })().catch(err => {
//     console.error(err);
// });

// const type = {
//     any: as(as(String, Number)).default("abc"),
//     dict: Dict(String, Number).default({ foo: 123 }),
// };

// console.log(validate({}, type));

// class Example {

// }

// const Type = {
//     my: Object.optional
// };

// const warnings: ValidationWarning[] = [];

// console.log(validate({
//     foo: ["A", 1],
//     bar: ["B", 2, 3, 4],
//     str: "ABC",
//     union1: "ABCD",
//     union2: 123,
//     dict2: { }
// }, {
//     foo: as([String, Number] as const),
//     bar: [String, Number],
//     str: as(String),
//     union1: as(String, Number),
//     union2: as(String, Number),
//     dict2: Dict(String.enum(["foo", "bar"] as const).optional, String),
// }, "variable", { warnings, removeUnknownProps: true }));


// console.log(warnings);

// const Type = {
//     str: String.optional.enum(["A", "B", "C"] as const),
// };
// type Type = ExtractInstanceType<typeof Type>;


// console.log(validate({
//     arr1: [1, 2, 3],
//     // @ts-ignore
//     arr2: [1, 2, 3, 3, "hello", "world"],
//     // @ts-ignore
//     tuple: [1, 2, 3],
// }, {
//     arr1: [Number],
//     arr2: [Number, String].maxItems(6).uniqueItems,
//     tuple: as([String, Number] as const),
// }, "$", { removeUnknownProps: true }));

// console.log(validate("1,2,3", [String, Number], "$", { removeUnknownProps: true }));

// const Article = {
//     id: Number.remarks("The ID of article"),
//     title: String.remarks("The title of the article"),
//     content: String.remarks("The content of the article"),
//     status: String.enum(["created", "published", "archived"] as const).remarks("The status of the article"),
//     tags: [String].optional.remarks("The tags of the article"),
// };

// type Article = ExtractInstanceType<typeof Article>; // type declaration

// const ArticleSchema = createJSONSchema(Article, { // and JSON Schema
//     $id: "https://myapi.com/article.schema.json",
//     title: "Article",
//     description: "",
// });

// class ArticleController {
//     @remarks("Create a new article")
//     @param(Article, "article")
//     @returns(Article)
//     async create(article: Article) {
//         return article;
//     }
// }

// console.log(JSON.stringify(ArticleController.prototype.create.getJSONSchema(), null, "    "));
