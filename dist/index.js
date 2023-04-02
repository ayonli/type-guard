"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensured = exports.optional = exports.required = exports.partial = exports.def = exports.decorate = exports.remarks = exports.deprecated = exports.throws = exports.returns = exports.param = exports.emitWarnings = exports.setWarningHandler = exports.validate = exports.as = exports.Dict = exports.Void = exports.Any = exports.OptionalTupleType = exports.TupleType = exports.OptionalArrayType = exports.ArrayType = exports.OptionalDictType = exports.DictType = exports.OptionalUnionType = exports.UnionType = exports.OptionalCustomType = exports.CustomType = exports.VoidType = exports.OptionalAnyType = exports.AnyType = exports.OptionalObjectType = exports.ObjectType = exports.OptionalDateType = exports.DateType = exports.OptionalBooleanType = exports.BooleanType = exports.OptionalBigIntEnum = exports.BigIntEnum = exports.OptionalBigIntType = exports.BigIntType = exports.OptionalNumberEnum = exports.NumberEnum = exports.OptionalNumberType = exports.NumberType = exports.OptionalStringEnum = exports.StringEnum = exports.OptionalStringType = exports.StringType = exports.ValidateableType = void 0;
exports.getJSONSchema = void 0;
const tslib_1 = require("tslib");
require("@hyurl/utils/types");
const omit_1 = require("@hyurl/utils/omit");
const pick_1 = require("@hyurl/utils/pick");
const isVoid_1 = require("@hyurl/utils/isVoid");
const jsonSchemaDraftLink = "https://json-schema.org/draft/2020-12/schema";
class ValidateableType {
    constructor() {
        this._optional = false;
        this._default = void 0;
        this._remarks = void 0;
        this._deprecated = void 0;
        this._alternatives = null;
        this._associates = null;
    }
    /**
     * Marks the current variable/property/parameter as required.
     *
     * NOTE: by default, the variable/property/parameter is required, this
     * option is used to remark an optional type when it is reused somewhere else.
     */
    get required() {
        return this.deriveWith({ _optional: false });
    }
    /** Adds a remark message to the variable/property/parameter. */
    remarks(note) {
        return this.deriveWith({ _remarks: note });
    }
    /**
     * Marks the current variable/property/parameter as deprecated and provide
     * a message.
     */
    deprecated(message = "") {
        return this.deriveWith({ _deprecated: message });
    }
    alternatives(...props) {
        if (props.length) {
            return this.deriveWith({ _alternatives: props });
        }
        else {
            return this._alternatives;
        }
    }
    associates(...props) {
        if (props.length) {
            return this.deriveWith({ _associates: props });
        }
        else {
            return this._associates;
        }
    }
    /** @internal */
    validate(path, value, options = null) {
        if (value === null || value === void 0 || Object.is(value, NaN)) {
            if (this._default !== void 0) {
                return this._default;
            }
            else if (this._optional) {
                return Object.is(value, NaN) ? null : value;
            }
            else if (!(options === null || options === void 0 ? void 0 : options.suppress)) {
                throw new Error(`${path} is required, but no value is given`);
            }
        }
        else if (!(0, isVoid_1.default)(this._deprecated) && (options === null || options === void 0 ? void 0 : options.warnings)) {
            const message = this._deprecated
                ? `${path} is deprecated: ${this._deprecated}`
                : `${path} is deprecated`;
            if (!options.warnings.some(item => item.path === path && item.message === message)) {
                options.warnings.push({ path, message });
            }
        }
        return value;
    }
    deriveWith(props, ins = null) {
        if (!ins) {
            const ctor = this.constructor;
            ins = new ctor();
        }
        Object.assign(ins, this, props);
        return ins;
    }
    createTypeError(path, value, expectedType, asConst = false) {
        const _expectedType = read(expectedType);
        const actualType = readType(value, asConst);
        return new TypeError(`${path} is expected to be ${_expectedType}, but ${actualType} is given`);
    }
    conversionWarning(path, value, expectedType) {
        expectedType = read(expectedType, true);
        const actualType = readType(value);
        return `${actualType} at ${path} has been converted to ${expectedType}`;
    }
}
exports.ValidateableType = ValidateableType;
class StringType extends ValidateableType {
    constructor() {
        super(...arguments);
        this._minLength = void 0;
        this._maxLength = void 0;
        this._trim = false;
        this._spaceless = false;
        this._lowercase = false;
        this._uppercase = false;
        this._enum = null;
        this._match = null;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "StringType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalStringType());
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalStringType());
    }
    /** Sets the minimal length of the text. */
    minLength(length) {
        if (length < 0 || !Number.isInteger(length)) {
            throw new RangeError(`length must be a non-negative integer`);
        }
        return this.deriveWith({ _minLength: length });
    }
    /** Sets the maximal length of the text. */
    maxLength(length) {
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
    enum(values) {
        return this.deriveWith({ _enum: values }, new StringEnum());
    }
    /**
     * Sets a pattern to test whether the text fulfills the requirements, or
     * sets a custom function to do the test.
     */
    match(pattern) {
        return this.deriveWith({ _match: pattern });
    }
    validate(path, value, options = null) {
        var _a, _b, _c, _d;
        value = super.validate(path, value, options);
        let _value;
        let err;
        if (value === null || value === void 0) {
            return value;
        }
        else if ((options === null || options === void 0 ? void 0 : options.strict) && typeof value !== "string") {
            throw this.createTypeError(path, value, "string");
        }
        else if (typeof value === "number" ||
            typeof value === "bigint" ||
            typeof value === "boolean") {
            _value = String(value);
        }
        else if (value instanceof Date) {
            _value = value.toISOString();
        }
        else if (typeof value !== "string") {
            throw this.createTypeError(path, value, "string");
        }
        else {
            _value = value;
        }
        if (_value !== value) {
            (_a = options === null || options === void 0 ? void 0 : options.warnings) === null || _a === void 0 ? void 0 : _a.push({
                path,
                message: this.conversionWarning(path, value, "string")
            });
        }
        if (this._spaceless) {
            _value = _value.replace(/\s/g, "");
        }
        else if (this._trim) {
            _value = _value.trim();
        }
        this._lowercase && (_value = _value.toLowerCase());
        this._uppercase && (_value = _value.toUpperCase());
        if (!_value) {
            if (this._optional || this._default === "" || ((_b = this._enum) === null || _b === void 0 ? void 0 : _b.includes(""))) {
                return _value;
            }
            else {
                err = new Error(`${path} is expected to be a non-empty string`);
            }
        }
        else if (this._minLength && _value.length < this._minLength) {
            const unit = this._minLength === 1 ? "character" : `characters`;
            err = new Error(`${path} is expected to contain at least ${this._minLength} ${unit}`);
        }
        else if (this._maxLength && _value.length > this._maxLength) {
            const unit = this._maxLength === 1 ? "character" : `characters`;
            err = new Error(`${path} is expected to contain no more than ${this._maxLength} ${unit}`);
        }
        else if (((_c = this._enum) === null || _c === void 0 ? void 0 : _c.length) && !this._enum.includes(_value)) {
            const asConst = typeof value === "string";
            if (this._enum.length === 1) {
                err = this.createTypeError(path, value, `'${this._enum[0]}'`, asConst);
            }
            else {
                const types = this._enum.map(value => `'${value}'`);
                err = this.createTypeError(path, value, types, asConst);
            }
        }
        else if (this._match === "email" && !StringType.EmailRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid email address`);
        }
        else if (this._match === "ip" && !StringType.IpRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid IP address`);
        }
        else if (this._match === "url" && !StringType.UrlRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid URL address`);
        }
        else if (this._match === "hostname" && !StringType.HostnameRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid hostname`);
        }
        else if (this._match === "phone" && !StringType.PhoneRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid phone number`);
        }
        else if (this._match === "date" && !StringType.DateRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid date string (format: YYYY-MM-DD)`);
        }
        else if (this._match === "time" && !StringType.TimeRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid time string (format: HH:mm[:ss])`);
        }
        else if (this._match === "datetime" && !StringType.DatetimeRegex.test(_value)) {
            err = new TypeError(`${path} is not a valid datetime string (format: YYYY-MM-DD HH:mm:ss)`);
        }
        else if (this._match instanceof RegExp && !this._match.test(_value)) {
            err = new Error(`${path} does not match the pattern: ${this._match}`);
        }
        else if (typeof this._match === "function" && !this._match(_value)) {
            err = new Error(`${path} does not fulfill the requirement`);
        }
        if (err) {
            if (!(options === null || options === void 0 ? void 0 : options.suppress)) {
                throw err;
            }
            else {
                (_d = options === null || options === void 0 ? void 0 : options.warnings) === null || _d === void 0 ? void 0 : _d.push({ path, message: err.message });
            }
        }
        return _value;
    }
    toJSONSchema() {
        let format;
        let pattern;
        if (this._match === "email") {
            format = this._match;
        }
        else if (this._match === "phone") {
            pattern = StringType.PhoneRegex;
        }
        else if (this._match === "ip") {
            format = "ipv4";
        }
        else if (this._match === "hostname") {
            format = "hostname";
        }
        else if (this._match === "url") {
            format = "uri";
        }
        else if (this._match === "date") {
            format = "date";
        }
        else if (this._match === "time") {
            format = "time";
        }
        else if (this._match === "datetime") {
            format = "date-time";
        }
        else if (this._match instanceof RegExp) {
            pattern = this._match;
        }
        const schema = {
            type: "string",
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
            minLength: this._minLength,
            maxLength: this._maxLength,
            format,
            pattern: pattern === null || pattern === void 0 ? void 0 : pattern.source,
        };
        if (this._enum) {
            if (this._enum.length === 1) {
                schema["const"] = this._enum[0];
            }
            else {
                schema["enum"] = this._enum;
            }
        }
        return omitUndefined(schema);
    }
}
StringType.EmailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
StringType.PhoneRegex = /^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/;
StringType.IpRegex = /^(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))$/;
StringType.UrlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
StringType.HostnameRegex = /^localhost$|^(([a-z0-9A-Z]\.)*[a-z0-9-]+\.)?([a-z0-9]{2,24})+(\.co\.([a-z0-9]{2,24})|\.([a-z0-9]{2,24}))$/;
StringType.DateRegex = /^(19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)$/;
StringType.TimeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
StringType.DatetimeRegex = /^(19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31) ([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
exports.StringType = StringType;
class OptionalStringType extends StringType {
    constructor() {
        super(...arguments);
        this._optional = true;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalStringType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new StringType());
    }
    // @ts-ignore
    enum(values) {
        return this.deriveWith({ _enum: values }, new OptionalStringEnum());
    }
}
exports.OptionalStringType = OptionalStringType;
class StringEnum extends StringType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "StringEnum";
    }
    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalStringEnum());
    }
    // @ts-ignore
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalStringEnum());
    }
    enum(values = void 0) {
        if (values !== void 0) {
            return super.enum(values);
        }
        else {
            return this._enum;
        }
    }
}
exports.StringEnum = StringEnum;
class OptionalStringEnum extends StringEnum {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalStringEnum";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new StringEnum());
    }
    // @ts-ignore
    enum(values = void 0) {
        return super.enum(values);
    }
}
exports.OptionalStringEnum = OptionalStringEnum;
class NumberType extends ValidateableType {
    constructor() {
        super(...arguments);
        this._integer = false;
        this._min = void 0;
        this._max = void 0;
        this._enum = null;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "NumberType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalNumberType());
    }
    /** Restrains the number to be an integer. */
    get integer() {
        return this.deriveWith({ _integer: true });
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalNumberType());
    }
    /** Sets the minimal value of the number. */
    min(value) {
        if (this._integer && !Number.isInteger(value)) {
            throw new RangeError("value must be an integer when `integer` option is set");
        }
        return this.deriveWith({ _min: value });
    }
    /** Sets the maximal value of the number. */
    max(value) {
        if (this._integer && !Number.isInteger(value)) {
            throw new RangeError("value must be an integer when `integer` option is set");
        }
        return this.deriveWith({ _max: value });
    }
    /** Sets the enum options of which the number can be. */
    enum(values) {
        return this.deriveWith({ _enum: values }, new NumberEnum());
    }
    validate(path, value, options = null) {
        var _a, _b, _c;
        value = super.validate(path, value, options);
        let _value;
        let err;
        if (value === null || value === void 0) {
            return value;
        }
        else if ((options === null || options === void 0 ? void 0 : options.strict) && typeof value !== "number") {
            throw this.createTypeError(path, value, "number");
        }
        else if (typeof value === "bigint") {
            if (value <= Number.MAX_SAFE_INTEGER) {
                _value = Number(value);
            }
            else {
                throw this.createTypeError(path, value, "number");
            }
        }
        else if (typeof value === "boolean") {
            _value = Number(value);
        }
        else if (typeof value === "string") {
            _value = Number(value);
            if (Number.isNaN(_value) || _value > Number.MAX_SAFE_INTEGER) {
                throw this.createTypeError(path, value, "number");
            }
        }
        else if (value instanceof Date) {
            _value = value.valueOf();
        }
        else if (typeof value !== "number") {
            throw this.createTypeError(path, value, "number");
        }
        else {
            _value = value;
        }
        if (_value !== value) {
            (_a = options === null || options === void 0 ? void 0 : options.warnings) === null || _a === void 0 ? void 0 : _a.push({
                path,
                message: this.conversionWarning(path, value, "number")
            });
        }
        if (this._integer && !Number.isInteger(_value)) {
            err = new TypeError(`${path} is expected to be an integer`);
        }
        else if (this._min && _value < this._min) {
            err = new RangeError(`${path} is expected not to be less than ${this._min}`);
        }
        else if (this._max && _value > this._max) {
            err = new RangeError(`${path} is expected not to be greater than ${this._max}`);
        }
        else if (((_b = this._enum) === null || _b === void 0 ? void 0 : _b.length) && !this._enum.includes(_value)) {
            const asConst = ["number", "bigint"].includes(typeof value);
            if (this._enum.length === 1) {
                err = this.createTypeError(path, value, String(this._enum[0]), asConst);
            }
            else {
                err = this.createTypeError(path, value, this._enum.map(String), asConst);
            }
        }
        if (err) {
            if (!(options === null || options === void 0 ? void 0 : options.suppress)) {
                throw err;
            }
            else {
                (_c = options === null || options === void 0 ? void 0 : options.warnings) === null || _c === void 0 ? void 0 : _c.push({ path, message: err.message });
            }
        }
        return _value;
    }
    toJSONSchema() {
        const schema = {
            type: this._integer ? "integer" : "number",
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
            minimum: this._min,
            maximum: this._max,
        };
        if (this._enum) {
            if (this._enum.length === 1) {
                schema["const"] = this._enum[0];
            }
            else {
                schema["enum"] = this._enum;
            }
        }
        return omitUndefined(schema);
    }
}
exports.NumberType = NumberType;
class OptionalNumberType extends NumberType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalNumberType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new NumberType());
    }
    // @ts-ignore
    enum(values) {
        return this.deriveWith({ _enum: values }, new OptionalNumberEnum());
    }
}
exports.OptionalNumberType = OptionalNumberType;
class NumberEnum extends NumberType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "NumberEnum";
    }
    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalNumberEnum());
    }
    // @ts-ignore
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalNumberEnum());
    }
    enum(values = void 0) {
        if (values !== void 0) {
            return super.enum(values);
        }
        else {
            return this._enum;
        }
    }
}
exports.NumberEnum = NumberEnum;
class OptionalNumberEnum extends NumberEnum {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalNumberEnum";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new NumberEnum());
    }
    // @ts-ignore
    enum(values = void 0) {
        return super.enum(values);
    }
}
exports.OptionalNumberEnum = OptionalNumberEnum;
class BigIntType extends ValidateableType {
    constructor() {
        super(...arguments);
        this._min = void 0;
        this._max = void 0;
        this._enum = null;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "BigIntType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalBigIntType());
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalBigIntType());
    }
    /** Sets the minimal value of the number. */
    min(value) {
        return this.deriveWith({ _min: value });
    }
    /** Sets the maximal value of the number. */
    max(value) {
        return this.deriveWith({ _max: value });
    }
    /** Sets the enum options of which the number can be. */
    enum(values) {
        return this.deriveWith({ _enum: values }, new BigIntEnum());
    }
    validate(path, value, options = null) {
        var _a, _b, _c;
        value = super.validate(path, value, options);
        let _value;
        let err;
        if (value === null || value === void 0) {
            return value;
        }
        else if ((options === null || options === void 0 ? void 0 : options.strict) && typeof value !== "bigint") {
            throw this.createTypeError(path, value, "bigint");
        }
        else if (typeof value === "number") {
            _value = BigInt(value);
        }
        else if (typeof value === "boolean") {
            _value = BigInt(value);
        }
        else if (typeof value === "string" && !Number.isNaN(Number(value))) {
            _value = BigInt(value);
        }
        else if (typeof value !== "bigint") {
            throw this.createTypeError(path, value, "bigint");
        }
        else {
            _value = value;
        }
        if (_value !== value) {
            (_a = options === null || options === void 0 ? void 0 : options.warnings) === null || _a === void 0 ? void 0 : _a.push({
                path,
                message: this.conversionWarning(path, value, "bigint")
            });
        }
        if (this._min && _value < this._min) {
            err = new RangeError(`${path} is expected not to be less than ${this._min}`);
        }
        else if (this._max && _value > this._max) {
            err = new RangeError(`${path} is expected not to be greater than ${this._max}`);
        }
        else if (((_b = this._enum) === null || _b === void 0 ? void 0 : _b.length) && !this._enum.includes(_value)) {
            const asConst = ["number", "bigint"].includes(typeof value);
            if (this._enum.length === 1) {
                err = this.createTypeError(path, value, String(this._enum[0]), asConst);
            }
            else {
                err = this.createTypeError(path, value, this._enum.map(String), asConst);
            }
        }
        if (err) {
            if (!(options === null || options === void 0 ? void 0 : options.suppress)) {
                throw err;
            }
            else {
                (_c = options === null || options === void 0 ? void 0 : options.warnings) === null || _c === void 0 ? void 0 : _c.push({ path, message: err.message });
            }
        }
        return _value;
    }
    toJSONSchema() {
        const schema = {
            type: "integer",
            description: this._remarks,
            default: (0, isVoid_1.default)(this._default) ? void 0 : Number(this._default),
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
            minimum: (0, isVoid_1.default)(this._min) ? void 0 : Number(this._min),
            maximum: (0, isVoid_1.default)(this._max) ? void 0 : Number(this._max),
        };
        if (this._enum) {
            if (this._enum.length === 1) {
                schema["const"] = Number(this._enum[0]);
            }
            else {
                schema["enum"] = this._enum.map(Number);
            }
        }
        return omitUndefined(schema);
    }
}
exports.BigIntType = BigIntType;
class OptionalBigIntType extends BigIntType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalBigIntType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new BigIntType());
    }
    // @ts-ignore
    enum(values) {
        return this.deriveWith({ _enum: values }, new OptionalBigIntEnum());
    }
}
exports.OptionalBigIntType = OptionalBigIntType;
class BigIntEnum extends BigIntType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "BigIntEnum";
    }
    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalBigIntEnum());
    }
    // @ts-ignore
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalBigIntEnum());
    }
    enum(values = void 0) {
        if (values !== void 0) {
            return super.enum(values);
        }
        else {
            return this._enum;
        }
    }
}
exports.BigIntEnum = BigIntEnum;
class OptionalBigIntEnum extends BigIntEnum {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalBigIntEnum";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new BigIntEnum());
    }
    // @ts-ignore
    enum(values = void 0) {
        return super.enum(values);
    }
}
exports.OptionalBigIntEnum = OptionalBigIntEnum;
class BooleanType extends ValidateableType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "BooleanType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalBooleanType());
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalBooleanType());
    }
    validate(path, value, options = null) {
        var _a;
        value = super.validate(path, value, options);
        let _value;
        if (value === null || value === void 0) {
            return value;
        }
        else if ((options === null || options === void 0 ? void 0 : options.strict) && typeof value !== "boolean") {
            throw this.createTypeError(path, value, "boolean");
        }
        else if (typeof value === "number") {
            if (value === 1) {
                _value = true;
            }
            else if (value === 0) {
                _value = false;
            }
            else {
                throw this.createTypeError(path, value, "boolean");
            }
        }
        else if (typeof value === "bigint") {
            if (value === BigInt(1)) {
                _value = true;
            }
            else if (value === BigInt(0)) {
                _value = false;
            }
            else {
                throw this.createTypeError(path, value, "boolean");
            }
        }
        else if (typeof value === "string") {
            if (value === "true") {
                _value = true;
            }
            else if (value === "false") {
                _value = false;
            }
            else {
                throw this.createTypeError(path, value, "boolean");
            }
        }
        else if (typeof value !== "boolean") {
            throw this.createTypeError(path, value, "boolean");
        }
        else {
            _value = value;
        }
        if (_value !== value) {
            (_a = options === null || options === void 0 ? void 0 : options.warnings) === null || _a === void 0 ? void 0 : _a.push({
                path,
                message: this.conversionWarning(path, value, "boolean")
            });
        }
        return _value;
    }
    toJSONSchema() {
        return omitUndefined({
            type: "boolean",
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
        });
    }
}
exports.BooleanType = BooleanType;
class OptionalBooleanType extends BooleanType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalBooleanType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new BooleanType());
    }
}
exports.OptionalBooleanType = OptionalBooleanType;
class DateType extends ValidateableType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "DateType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalDateType());
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalDateType());
    }
    validate(path, value, options = null) {
        var _a;
        value = super.validate(path, value, options);
        let _value;
        if (value === null || value === void 0) {
            return value;
        }
        else if ((options === null || options === void 0 ? void 0 : options.strict) && !(value instanceof Date)) {
            throw this.createTypeError(path, value, "Date");
        }
        else if (typeof value === "string") {
            _value = new Date(value);
            if (String(_value) === "Invalid Date") {
                throw this.createTypeError(path, value, "Date");
            }
        }
        else if (typeof value === "number") {
            if (value >= 0) {
                _value = new Date(value);
            }
            else {
                throw this.createTypeError(path, value, "Date");
            }
        }
        else if (!(value instanceof Date)) {
            throw this.createTypeError(path, value, "Date");
        }
        else {
            _value = value;
        }
        if (_value !== value && _value.toISOString() !== value) {
            (_a = options === null || options === void 0 ? void 0 : options.warnings) === null || _a === void 0 ? void 0 : _a.push({
                path,
                message: this.conversionWarning(path, value, "Date")
            });
        }
        return _value;
    }
    toJSONSchema() {
        return omitUndefined({
            type: "string",
            description: this._remarks,
            default: this._default ? this._default.toISOString() : void 0,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
            format: "date-time",
        });
    }
}
exports.DateType = DateType;
class OptionalDateType extends DateType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalDateType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new DateType());
    }
}
exports.OptionalDateType = OptionalDateType;
class ObjectType extends ValidateableType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "ObjectType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalObjectType());
    }
    default(value) {
        if (Array.isArray(value)) {
            throw new TypeError("value must be an object but not an array");
        }
        return this.deriveWith({ _optional: true, _default: value }, new OptionalObjectType());
    }
    validate(path, value, options = null) {
        value = super.validate(path, value, options);
        if (value === null || value === void 0) {
            return value;
        }
        else if (!(value instanceof Object) || Array.isArray(value)) {
            throw this.createTypeError(path, value, "object");
        }
        else {
            return value;
        }
    }
    toJSONSchema() {
        return omitUndefined({
            type: "object",
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
        });
    }
}
exports.ObjectType = ObjectType;
class OptionalObjectType extends ObjectType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalObjectType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new ObjectType());
    }
}
exports.OptionalObjectType = OptionalObjectType;
// @ts-ignore
class AnyType extends ValidateableType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "AnyType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalAnyType());
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalAnyType());
    }
    toJSONSchema() {
        return omitUndefined({
            type: ["string", "number", "integer", "boolean", "object", "array", "null"],
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
        });
    }
}
exports.AnyType = AnyType;
class OptionalAnyType extends AnyType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalAnyType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new AnyType());
    }
}
exports.OptionalAnyType = OptionalAnyType;
class VoidType extends ValidateableType {
    constructor() {
        super(...arguments);
        this._optional = true;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "VoidType";
    }
    get optional() {
        console.warn("VoidType is always optional, calling `optional` makes no difference");
        return this;
    }
    get required() {
        throw new ReferenceError("VoidType is always optional, calling `required` makes no sense");
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value });
    }
    validate(path, value, options = null) {
        if (value !== null && value !== void 0) {
            throw this.createTypeError(path, value, "void");
        }
        else if (this._default !== void 0) {
            return this._default;
        }
        else if (!(0, isVoid_1.default)(this._deprecated) && (options === null || options === void 0 ? void 0 : options.warnings)) {
            const message = this._deprecated
                ? `${path} is deprecated: ${this._deprecated}`
                : `${path} is deprecated`;
            if (!options.warnings.some(item => item.path === path && item.message === message)) {
                options.warnings.push({ path, message });
            }
        }
        return value;
    }
    toJSONSchema() {
        return omitUndefined({
            type: "null",
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
        });
    }
}
exports.VoidType = VoidType;
class CustomType extends ValidateableType {
    constructor(type) {
        super();
        this.type = type;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "CustomType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalCustomType(this.type));
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalCustomType(this.type));
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
    guard(transform) {
        this._guard = transform;
        return this;
    }
    validate(path, value, options = null) {
        var _a;
        value = super.validate(path, value, options);
        if (value === null || value === void 0) {
            return value;
        }
        else if (this._guard) {
            value = this._guard(value, path, (_a = options === null || options === void 0 ? void 0 : options.warnings) !== null && _a !== void 0 ? _a : []);
        }
        if (typeof this.type === "boolean") {
            const _value = new BooleanType().validate(path, value, options);
            if (_value === this.type) {
                return _value;
            }
            else {
                throw this.createTypeError(path, value, String(this.type), typeof value === "boolean");
            }
        }
        else if (this.type instanceof Function) {
            if (value instanceof this.type) {
                return value;
            }
            else if (Object.is(this.type, Function)) {
                throw this.createTypeError(path, value, "function");
            }
            else {
                throw this.createTypeError(path, value, this.type.name);
            }
        }
        else if (isObject(this.type)) {
            if (isObject(value)) {
                return validate(value, this.type, path, options);
            }
            else {
                throw this.createTypeError(path, value, "object");
            }
        }
        else if (Array.isArray(this.type)) {
            if (Array.isArray(value)) {
                return validate(value, this.type, path, options);
            }
            else {
                throw this.createTypeError(path, value, "array");
            }
        }
        else {
            return validate(value, this.type, path, options);
        }
    }
    toJSONSchema(parent = null) {
        if (typeof this.type === "boolean") {
            return omitUndefined({
                type: "boolean",
                description: this._remarks,
                default: toJSON(this._default),
                deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
                const: this.type,
            });
        }
        else if (this.type instanceof Function) {
            return omitUndefined({
                type: Object.is(this.type, Function) ? "function" : "object",
                description: this._remarks,
                default: toJSON(this._default),
                deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
            });
        }
        else {
            return toJSONSchema(this.type, {
                description: this._remarks,
                default: toJSON(this._default),
                deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
                parent,
            });
        }
    }
}
exports.CustomType = CustomType;
class OptionalCustomType extends CustomType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalCustomType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new CustomType(this.type));
    }
}
exports.OptionalCustomType = OptionalCustomType;
class UnionType extends ValidateableType {
    constructor(types) {
        super();
        this.types = types;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "UnionType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalUnionType(this.types));
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalUnionType(this.types));
    }
    validate(path, value, options = null) {
        try {
            value = super.validate(path, value, options);
        }
        catch (err) {
            if (!String(err).includes("required") ||
                !this.types.some(type => type instanceof VoidType)) {
                throw err;
            }
        }
        let _value;
        let requireErr;
        let lastError;
        if (value === null || value === void 0) {
            return value;
        }
        for (const type of this.types) {
            try {
                _value !== null && _value !== void 0 ? _value : (_value = validate(value, type, path, {
                    strict: true,
                    suppress: options === null || options === void 0 ? void 0 : options.suppress,
                    warnings: options === null || options === void 0 ? void 0 : options.warnings,
                    removeUnknownItems: options === null || options === void 0 ? void 0 : options.removeUnknownItems,
                }));
                if (_value !== null && _value !== void 0) {
                    return _value;
                }
            }
            catch (err) {
                if (!isObject(type) && !Array.isArray(type) && String(err).includes("required")) {
                    requireErr !== null && requireErr !== void 0 ? requireErr : (requireErr = err);
                }
            }
        }
        if (!(options === null || options === void 0 ? void 0 : options.strict)) {
            for (const type of this.types) {
                try {
                    _value !== null && _value !== void 0 ? _value : (_value = validate(value, type, path, {
                        strict: false,
                        suppress: options === null || options === void 0 ? void 0 : options.suppress,
                        warnings: options === null || options === void 0 ? void 0 : options.warnings,
                        removeUnknownItems: options === null || options === void 0 ? void 0 : options.removeUnknownItems,
                    }));
                    if (_value !== null && _value !== void 0) {
                        return _value;
                    }
                }
                catch (err) {
                    lastError = err;
                } // eslint-disable-line
            }
        }
        if (requireErr) {
            throw requireErr;
        }
        const typesOfConsts = [];
        let types = this.types.map(type => {
            if (Object.is(type, String) || Object.is(type, StringType)) {
                return "string";
            }
            else if (Object.is(type, Number) || Object.is(type, NumberType)) {
                return "number";
            }
            else if (Object.is(type, BigInt) || Object.is(type, BigIntType)) {
                return "bigint";
            }
            else if (Object.is(type, Boolean) || Object.is(type, BooleanType)) {
                return "boolean";
            }
            else if (Object.is(type, Date) || Object.is(type, DateType)) {
                return "Date";
            }
            else if (Object.is(type, Object) || Object.is(type, ObjectType) || isObject(type)) {
                return "object";
            }
            else if (Object.is(type, exports.Any) || Object.is(type, AnyType)) {
                return "any";
            }
            else if (Object.is(type, exports.Void) || Object.is(type, VoidType)) {
                return "void";
            }
            else if (Array.isArray(type)) {
                return "array";
            }
            else if (typeof type === "function") {
                return type.name;
            }
            else if (isConst(type)) {
                const _type = typeof type;
                typesOfConsts.push(_type === "bigint" ? "number" : _type);
                return _type === "string" ? `'${type}'` : String(type);
            }
            else if (typeof type.constructor === "function") {
                return type.constructor.name;
            }
            else {
                return "unknown";
            }
        });
        types = [...new Set(types)];
        if (types.includes("object") && isObject(value)) {
            throw lastError;
        }
        else if (types.includes("array") && Array.isArray(value)) {
            throw lastError;
        }
        else {
            throw this.createTypeError(path, value, types.length > 1 ? types : types[0], typesOfConsts.includes(typeof value === "bigint" ? "number" : typeof value));
        }
    }
    toJSONSchema(parent = null) {
        const types = [];
        const oneOf = [];
        for (const type of this.types) {
            const _schema = toJSONSchema(type, { parent });
            types.push(_schema.type);
            oneOf.push(_schema);
        }
        const _types = [...new Set(types.flat())];
        const type = _types.length === 1 ? _types[0] : _types;
        const schema = {
            type,
            description: this._remarks,
            default: toJSON(this._default),
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
        };
        if (typeof type === "string") {
            if (type !== "boolean" && oneOf.every(item => item.const !== undefined)) {
                schema["enum"] = oneOf.map(item => item.const);
            }
        }
        else if (oneOf.some(item => Object.keys(item).length >= 2)) {
            schema["oneOf"] = oneOf;
        }
        return omitUndefined(schema);
    }
}
exports.UnionType = UnionType;
class OptionalUnionType extends UnionType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalUnionType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new UnionType(this.types));
    }
}
exports.OptionalUnionType = OptionalUnionType;
class DictType extends ValidateableType {
    constructor(key, value) {
        super();
        this.key = key;
        this.value = value;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "DictType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalDictType(this.key, this.value));
    }
    default(value) {
        return this.deriveWith({
            _optional: true,
            _default: value,
        }, new OptionalDictType(this.key, this.value));
    }
    validate(path, value, options = null) {
        var _a, _b, _c;
        value = super.validate(path, value, options);
        if (value === null || value === void 0) {
            return value;
        }
        else if (!isObject(value)) {
            throw this.createTypeError(path, value, "object");
        }
        else {
            const records = {};
            const keys = this.keyEnum();
            for (let [_key, _value] of Object.entries(value)) {
                try {
                    if (keys === null || keys === void 0 ? void 0 : keys.length) {
                        if (!keys.includes(_key)) {
                            const types = keys.map(type => `'${type}'`);
                            const props = types.length === 1
                                ? `property ${types[0]}`
                                : `properties ${join(types, "and")}`;
                            throw new RangeError(`${path} is expected to contain only ${props}`);
                        }
                    }
                    else {
                        _key = validate(_key, this.key, path, Object.assign(Object.assign({}, options), { suppress: false }));
                    }
                }
                catch (err) {
                    if (err instanceof Error && String(err).includes("expected to contain only")) {
                        if (options === null || options === void 0 ? void 0 : options.removeUnknownItems) {
                            if (!options.suppress) {
                                const _path = path ? `${path}.${_key}` : _key;
                                (_a = options === null || options === void 0 ? void 0 : options.warnings) === null || _a === void 0 ? void 0 : _a.push({
                                    path: _path,
                                    message: `unknown property ${_path} has been removed`,
                                });
                            }
                            _key = null;
                        }
                        else if (options === null || options === void 0 ? void 0 : options.suppress) {
                            (_b = options === null || options === void 0 ? void 0 : options.warnings) === null || _b === void 0 ? void 0 : _b.push({
                                path,
                                message: err instanceof Error ? err.message : String(err),
                            });
                        }
                        else {
                            throw err;
                        }
                    }
                    else if (options === null || options === void 0 ? void 0 : options.suppress) {
                        (_c = options === null || options === void 0 ? void 0 : options.warnings) === null || _c === void 0 ? void 0 : _c.push({
                            path,
                            message: err instanceof Error ? err.message : String(err),
                        });
                    }
                    else {
                        throw err;
                    }
                }
                if (_key !== null && _key !== void 0) {
                    _value = validate(_value, this.value, path ? `${path}.${_key}` : _key, options);
                    if (_value !== void 0) {
                        records[_key] = _value;
                    }
                }
            }
            return records;
        }
    }
    toJSONSchema(parent = null) {
        const schema = {
            type: "object",
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
        };
        const keys = this.keyEnum();
        if (keys === null || keys === void 0 ? void 0 : keys.length) {
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
    keyEnum() {
        let enums;
        if (this.key instanceof StringEnum) {
            enums = this.key.enum();
        }
        else if (this.key instanceof NumberEnum || this.key instanceof BigIntEnum) {
            enums = this.key.enum().map(String);
        }
        else if (this.key instanceof UnionType) {
            const _enums = this.key.types.filter(type => isConst(type));
            if (_enums.length) {
                enums = _enums.map(String);
            }
        }
        return enums !== null && enums !== void 0 ? enums : null;
    }
}
exports.DictType = DictType;
class OptionalDictType extends DictType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalDictType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new DictType(this.key, this.value));
    }
}
exports.OptionalDictType = OptionalDictType;
class ArrayType extends CustomType {
    constructor(type) {
        super(type);
        this.type = type;
        this._minItems = void 0;
        this._maxItems = void 0;
        this._uniqueItems = false;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "ArrayType";
    }
    // @ts-ignore
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalArrayType(this.type));
    }
    // @ts-ignore
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalArrayType(this.type));
    }
    /** Sets the minimum items of the array. */
    minItems(count) {
        if (count < 0 || !Number.isInteger(count)) {
            throw new RangeError("count must be a non-negative integer");
        }
        return this.deriveWith({ _minItems: count });
    }
    /** Sets the maximum items of the array. */
    maxItems(count) {
        if (count < 0 || !Number.isInteger(count)) {
            throw new RangeError("count must be a non-negative integer");
        }
        return this.deriveWith({ _maxItems: count });
    }
    /** Restrains the array to have unique items. */
    get uniqueItems() {
        return this.deriveWith({ _uniqueItems: true });
    }
    validate(path, value, options = null) {
        var _a, _b, _c, _d;
        value = ValidateableType.prototype.validate.call(this, path, value, options);
        let _value;
        let err;
        if (value === null || value === void 0 || (this._default && value === this._default)) {
            return value;
        }
        else if (this._guard) {
            value = this._guard(value, path, (_a = options === null || options === void 0 ? void 0 : options.warnings) !== null && _a !== void 0 ? _a : []);
        }
        if (!Array.isArray(value)) {
            throw this.createTypeError(path, value, "array");
        }
        else {
            _value = value;
        }
        if (this._minItems && _value.length < this._minItems) {
            const count = this._minItems === 1 ? "1 item" : `${this._minItems} items`;
            err = new RangeError(`${path} is expected to contain at least ${count}`);
        }
        else if (this._maxItems && _value.length > this._maxItems) {
            if (options === null || options === void 0 ? void 0 : options.removeUnknownItems) {
                const offset = this._maxItems;
                const end = _value.length - 1;
                _value = _value.slice(0, offset);
                if (!(options === null || options === void 0 ? void 0 : options.suppress)) {
                    const target = end === offset
                        ? `element ${path}[${offset}] has`
                        : `elements ${path}[${offset}...${end}] have`;
                    (_b = options === null || options === void 0 ? void 0 : options.warnings) === null || _b === void 0 ? void 0 : _b.push({
                        path,
                        message: `outranged ${target} been removed`,
                    });
                }
            }
            else {
                const count = this._maxItems === 1 ? "1 item" : `${this._maxItems} items`;
                err = new RangeError(`${path} is expected to contain no more than ${count}`);
            }
        }
        else if (this._uniqueItems && new Set(_value).size !== _value.length) {
            err = new Error(`${path} is expected to contain unique items`);
        }
        if (err) {
            if (!(options === null || options === void 0 ? void 0 : options.suppress)) {
                throw err;
            }
            else {
                (_c = options === null || options === void 0 ? void 0 : options.warnings) === null || _c === void 0 ? void 0 : _c.push({ path, message: err.message });
            }
        }
        return validate(_value, (_d = this.type) !== null && _d !== void 0 ? _d : [], path, options);
    }
    toJSONSchema(parent = null) {
        var _a;
        const schema = {
            type: "array",
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
            minItems: this._minItems,
            maxItems: this._maxItems,
            uniqueItems: this._uniqueItems || void 0,
        };
        if (((_a = this.type) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            if (this.type.length === 1 && !(this.type[0] instanceof AnyType)) {
                schema["items"] = toJSONSchema(this.type[0], { parent });
            }
            else if (this.type.length > 1) {
                const oneOf = this.type.map(type => toJSONSchema(type, { parent }));
                if (oneOf.every(item => Object.keys(item).length === 1)) {
                    schema["items"] = { type: oneOf.map(item => item.type) };
                }
                else {
                    schema["oneOf"] = oneOf;
                }
            }
        }
        return omitUndefined(schema);
    }
}
exports.ArrayType = ArrayType;
class OptionalArrayType extends ArrayType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalArrayType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new ArrayType(this.type));
    }
}
exports.OptionalArrayType = OptionalArrayType;
class TupleType extends ValidateableType {
    constructor(type) {
        super();
        this.type = type;
    }
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    get [Symbol.toStringTag]() {
        return "TupleType";
    }
    get optional() {
        return this.deriveWith({ _optional: true }, new OptionalTupleType(this.type));
    }
    default(value) {
        return this.deriveWith({ _optional: true, _default: value }, new OptionalTupleType(this.type));
    }
    validate(path, value, options = null) {
        var _a, _b;
        value = ValidateableType.prototype.validate.call(this, path, value, options);
        let _value;
        if (value === null || value === void 0) {
            return value;
        }
        if (!Array.isArray(value)) {
            throw this.createTypeError(path, value, "array");
        }
        else {
            _value = value;
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
            if (options === null || options === void 0 ? void 0 : options.removeUnknownItems) {
                if (!(options === null || options === void 0 ? void 0 : options.suppress)) {
                    const target = end === offset
                        ? `item ${path}[${offset}] has`
                        : `items ${path}[${offset}...${end}] have`;
                    (_a = options === null || options === void 0 ? void 0 : options.warnings) === null || _a === void 0 ? void 0 : _a.push({
                        path,
                        message: `unknown ${target} been removed`,
                    });
                }
            }
            else {
                const count = this.type.length === 1 ? "1 item" : `${this.type.length} items`;
                const err = new RangeError(`${path} is expected to contain no more than ${count}`);
                if (options === null || options === void 0 ? void 0 : options.suppress) {
                    (_b = options === null || options === void 0 ? void 0 : options.warnings) === null || _b === void 0 ? void 0 : _b.push({ path, message: err.message });
                }
                else {
                    throw err;
                }
            }
        }
        return items;
    }
    toJSONSchema(parent = null) {
        const schema = {
            type: "array",
            description: this._remarks,
            default: this._default,
            deprecated: (0, isVoid_1.default)(this._deprecated) ? void 0 : true,
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
exports.TupleType = TupleType;
class OptionalTupleType extends TupleType {
    /** @internal Used for TypeScript to distinguish the type from similar types. */
    // @ts-ignore
    get [Symbol.toStringTag]() {
        return "OptionalTupleType";
    }
    // @ts-ignore
    get required() {
        return this.deriveWith({ _optional: false }, new TupleType(this.type));
    }
}
exports.OptionalTupleType = OptionalTupleType;
function augmentStaticMethods(ctor, type) {
    const ins = new type();
    ctor["optional"] = ins.optional;
    ctor["required"] = ins.required;
    ctor["default"] = (value) => ins.default(value);
    ctor["deprecated"] = (message) => ins.deprecated(message);
    ctor["alternatives"] = (...props) => ins.alternatives(...props);
    ctor["associates"] = (...props) => ins.associates(...props);
    ctor["remarks"] = (note) => ins.remarks(note);
    if (typeof ins["guard"] === "function") {
        ctor["guard"] = (transform) => ins["guard"](transform);
    }
    Object.getOwnPropertyNames(type.prototype).forEach(prop => {
        if (prop !== "constructor" && !ctor[prop]) {
            const desc = Object.getOwnPropertyDescriptor(type.prototype, prop);
            if (typeof desc.get === "function") {
                ctor[prop] = ins[prop];
            }
            else if (typeof desc.value === "function") {
                ctor[prop] = (value) => ins[prop](value);
            }
        }
    });
}
augmentStaticMethods(String, StringType);
augmentStaticMethods(Number, NumberType);
augmentStaticMethods(BigInt, BigIntType);
augmentStaticMethods(Boolean, BooleanType);
augmentStaticMethods(Date, DateType);
augmentStaticMethods(Object, ObjectType);
augmentStaticMethods(Array, ArrayType);
/** Any type of value except void values (`null` and `undefined`). */
exports.Any = new AnyType();
/** `null` and `undefined`. */
exports.Void = new VoidType();
function Dict(key, value) {
    return new DictType(key, value);
}
exports.Dict = Dict;
// augment Array on the prototype level
Object.defineProperties(Array.prototype, {
    optional: {
        configurable: true,
        get: function () {
            return new OptionalArrayType(this).optional;
        },
    },
    required: {
        configurable: true,
        get: function () {
            return new ArrayType(this).required;
        },
    },
    default: {
        configurable: true,
        value: function (value) {
            return new OptionalArrayType(this).default(value);
        },
    },
    remarks: {
        configurable: true,
        value: function (note) {
            return new ArrayType(this).remarks(note);
        },
    },
    deprecated: {
        configurable: true,
        value: function (message = "") {
            return new ArrayType(this).deprecated(message);
        },
    },
    alternatives: {
        configurable: true,
        value: function (...props) {
            return new ArrayType(this).alternatives(...props);
        },
    },
    associates: {
        configurable: true,
        value: function (...props) {
            return new ArrayType(this).associates(...props);
        },
    },
    guard: {
        configurable: true,
        value: function (transform) {
            return new ArrayType(this).guard(transform);
        },
    },
    minItems: {
        configurable: true,
        value: function (count) {
            return new ArrayType(this).minItems(count);
        },
    },
    maxItems: {
        configurable: true,
        value: function (count) {
            return new ArrayType(this).maxItems(count);
        },
    },
    uniqueItems: {
        configurable: true,
        get: function () {
            return new ArrayType(this).uniqueItems;
        },
    },
});
function as(...types) {
    if (types.length === 1) {
        const [type] = types;
        if (Array.isArray(type)) {
            return new TupleType(type);
        }
        else if ([String, Number, BigInt, Boolean, Date, Object, Array].includes(type)
            || (type instanceof ValidateableType)) {
            return type;
        }
        else {
            return new CustomType(types[0]);
        }
    }
    else if (types.length > 1) {
        return new UnionType(types);
    }
    else {
        throw new TypeError(`as() requires at least one argument`);
    }
}
exports.as = as;
function isObject(value) {
    return typeof value === "object" && !!value && value.constructor === Object;
}
function isEmptyValue(value) {
    return value === null || value === void 0 || value === "";
}
function isConst(type) {
    return ["string", "number", "bigint", "boolean"].includes(typeof type);
}
function join(strings, op = "and") {
    if (!strings.length) {
        return "";
    }
    else if (strings.length === 1) {
        return strings[0];
    }
    else if (strings.length === 2) {
        return strings[0] + " " + op + " " + strings[1];
    }
    else {
        return strings.slice(0, -1).join(", ") + " " + op + " " + strings.slice(-1);
    }
}
function read(text, noArticle = false) {
    if (Array.isArray(text)) {
        return join([read(text[0]), ...text.slice(1)], "or");
    }
    else if (noArticle
        || ["true", "false", "any", "unknown", "null", "undefined", "void"].includes(text)) {
        return text;
    }
    else if (text[0] === "'" || text[0] === '"' || !isNaN(text)) {
        return text;
    }
    else if (["a", "e", "i", "o", "u"].includes(text[0].toLowerCase())) {
        return "an " + text;
    }
    else {
        return "a " + text;
    }
}
function readType(value, asConst = false) {
    let type;
    if (value === null) {
        type = "null";
    }
    else if (value === void 0) {
        type = "undefined";
    }
    else if (typeof value === "function") {
        type = "a function";
    }
    else if (Array.isArray(value)) {
        type = "an array";
    }
    else if (isObject(value)) {
        type = "an object";
    }
    else if (typeof value === "object") {
        const name = value.constructor.name;
        if (["a", "e", "i", "o", "u"].includes(name[0].toLowerCase())) {
            return "an " + name;
        }
        else {
            return "a " + name;
        }
    }
    else if (asConst) {
        type = read(typeof value === "string" ? `'${value}'` : String(value));
    }
    else {
        type = read(typeof value);
    }
    return type;
}
function omitUndefined(obj) {
    return Object.keys(obj).reduce((record, prop) => {
        if (obj[prop] !== undefined) {
            record[prop] = obj[prop];
        }
        return record;
    }, {});
}
function copyFunctionProperties(source, target) {
    Object.defineProperty(target, "name", { value: source.name, configurable: true });
    Object.defineProperty(target, "length", { value: source.length, configurable: true });
    Object.defineProperty(target, "toString", {
        value: function toString() {
            return source.toString();
        },
        configurable: true,
    });
}
function purifyStackTrace(err, ctorOpt) {
    var _a;
    err instanceof Error && ((_a = Error.captureStackTrace) === null || _a === void 0 ? void 0 : _a.call(Error, err, ctorOpt));
    return err;
}
function toJSON(value) {
    let json;
    if (value === null) {
        json = null;
    }
    else if (value !== void 0) {
        if (Array.isArray(value) ||
            isObject(value) ||
            isConst(value)) {
            json = typeof value === "bigint" ? Number(value) : value;
        }
        else if (typeof value === "object" && typeof value.toJSON === "function") {
            json = value.toJSON();
        }
    }
    return json;
}
function ensureType(type, path = "$", deep = false) {
    const reduce = (type, path) => {
        var _a;
        if (type instanceof ValidateableType) {
            return type;
        }
        else if (Object.is(type, String) || Object.is(type, StringType)) {
            return new StringType();
        }
        else if (Object.is(type, Number) || Object.is(type, NumberType)) {
            return new NumberType();
        }
        else if (Object.is(type, BigInt) || Object.is(type, BigIntType)) {
            return new BigIntType();
        }
        else if (Object.is(type, Boolean) || Object.is(type, BooleanType)) {
            return new BooleanType();
        }
        else if (Object.is(type, Date) || Object.is(type, DateType)) {
            return new DateType();
        }
        else if (Object.is(type, Object) || Object.is(type, ObjectType)) {
            return new ObjectType();
        }
        else if (Object.is(type, Array) || Object.is(type, ArrayType)) {
            return new ArrayType([]);
        }
        else if (Object.is(type, AnyType)) {
            return new AnyType();
        }
        else if (Object.is(type, VoidType)) {
            return new VoidType();
        }
        else if (Array.isArray(type)) {
            return !deep ? type : type.map((_type, index) => {
                return reduce(_type, path ? `${path}[${index}]` : String(index));
            });
        }
        else if (isObject(type)) {
            return !deep ? type : Object.keys(type).reduce((_type, prop) => {
                _type[prop] = reduce(type[prop], path ? `${path}.${prop}` : prop);
                return _type;
            }, {});
        }
        else if (typeof type === "function") {
            return as(type);
        }
        else if (typeof type === "string") {
            return new StringType().enum([type]);
        }
        else if (typeof type === "number") {
            return new NumberType().enum([type]);
        }
        else if (typeof type === "bigint") {
            return new BigIntType().enum([type]);
        }
        else if (typeof type === "boolean") {
            return new CustomType(type);
        }
        else if (type === null || type === void 0) {
            return new VoidType().default(type);
        }
        else {
            const name = ((_a = type.constructor) === null || _a === void 0 ? void 0 : _a.name) || "unknown";
            throw new TypeError(`${path} (${name}) is not a validateable type`);
        }
    };
    return reduce(type, path);
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
function validate(value, type, variable = "$", options = null) {
    const reduce = (type, value, path) => {
        var _a, _b;
        if (Array.isArray(type)) {
            if (Array.isArray(value)) {
                if (!type.length) {
                    return value.map((item, index) => {
                        return reduce(exports.Any, item, path ? `${path}[${index}]` : String(index));
                    });
                }
                else if (type.length === 1) {
                    return value.map((item, index) => {
                        return reduce(type[0], item, path ? `${path}[${index}]` : String(index));
                    });
                }
                else {
                    const _type = as(...type); // as union type
                    return value.map((item, index) => {
                        return reduce(_type, item, path ? `${path}[${index}]` : String(index));
                    });
                }
            }
            else if (!type.length) {
                return new ArrayType([exports.Any]).validate(path, value, options);
            }
            else {
                return new ArrayType(type).validate(path, value, options);
            }
        }
        else if (isObject(type)) {
            if (isObject(value)) {
                const knownProps = Object.keys(type);
                const alternatives = {};
                const associates = {};
                knownProps.forEach((prop) => {
                    const _type = type[prop];
                    if (_type instanceof ValidateableType) {
                        const _alternatives = _type.alternatives();
                        const _associates = _type.associates();
                        if (_alternatives === null || _alternatives === void 0 ? void 0 : _alternatives.length) {
                            alternatives[prop] = _alternatives;
                        }
                        if (_associates === null || _associates === void 0 ? void 0 : _associates.length) {
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
                        otherProps.every(_prop => isEmptyValue(records[_prop]))) {
                        const props = [prop, ...otherProps].map(p => `'${p}'`).join(", ");
                        const message = `${path} is expected to contain `
                            + `one of these properties: ${props}`;
                        if (options === null || options === void 0 ? void 0 : options.suppress) {
                            (_a = options.warnings) === null || _a === void 0 ? void 0 : _a.push({ path, message });
                        }
                        else {
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
                            if (options === null || options === void 0 ? void 0 : options.suppress) {
                                (_b = options.warnings) === null || _b === void 0 ? void 0 : _b.push({ path, message });
                            }
                            else {
                                throw new Error(message);
                            }
                        }
                    }
                }
                if (!(options === null || options === void 0 ? void 0 : options.removeUnknownItems)) {
                    Object.keys(value).reduce((records, prop) => {
                        if (!knownProps.includes(prop) && value[prop] !== void 0) {
                            records[prop] = value[prop];
                        }
                        return records;
                    }, records);
                }
                else if ((options === null || options === void 0 ? void 0 : options.warnings) && !(options === null || options === void 0 ? void 0 : options.suppress)) {
                    Object.keys(value).forEach(prop => {
                        if (!knownProps.includes(prop)) {
                            const _path = path ? `${path}.${prop}` : prop;
                            options === null || options === void 0 ? void 0 : options.warnings.push({
                                path: _path,
                                message: `unknown property ${_path} has been removed`,
                            });
                        }
                    });
                }
                return records;
            }
            else {
                return as(type).validate(path, value, options);
            }
        }
        else {
            return ensureType(type, path, true).validate(path, value, options);
        }
    };
    try {
        return reduce(type, value, variable);
    }
    catch (err) {
        throw purifyStackTrace(err, validate);
    }
}
exports.validate = validate;
const _source = Symbol("source");
const _params = Symbol.for("params");
const _returns = Symbol.for("returns");
const _throws = Symbol.for("throws");
const _title = Symbol.for("title");
const _remarks = Symbol.for("remarks");
const _deprecated = Symbol.for("deprecated");
let warningHandler = null;
/**
 * By default, warnings are emitted to the stdout when occurred, use this
 * function to set a custom function to change this behavior. For example, emit
 * them to the client response if the function is called as an HTTP API.
 * @param this The instance that the function is bound to.
 */
function setWarningHandler(handler) {
    warningHandler = handler;
}
exports.setWarningHandler = setWarningHandler;
function emitWarnings(warnings, returns) {
    if (warningHandler) {
        warningHandler.call(this, warnings, returns);
    }
    else {
        for (const { message } of warnings) {
            console.warn(message);
        }
    }
}
exports.emitWarnings = emitWarnings;
class ValidationError extends Error {
    constructor(message, options) {
        var _a;
        // @ts-ignore
        super(message, options);
        (_a = this.cause) !== null && _a !== void 0 ? _a : (this.cause = options.cause);
    }
}
function wrap(target, prop = void 0, desc = null) {
    let fn = desc ? desc.value : target;
    if (!fn[_source]) {
        const fnName = prop
            || (typeof target === "function" ? target.name : "")
            || "anonymous";
        const originFn = fn;
        const newFn = (function (...args) {
            let paramsDef = newFn[_params];
            const returnDef = newFn[_returns];
            const throwDef = newFn[_throws];
            const warnings = [];
            const options = { warnings, removeUnknownItems: true };
            if (!(0, isVoid_1.default)(newFn[_deprecated])) {
                const message = newFn[_deprecated]
                    ? `${fnName}() is deprecated: ${newFn[_deprecated]}`
                    : `${fnName}() is deprecated`;
                warnings.push({ path: `${fnName}()`, message });
            }
            if (paramsDef) {
                if (paramsDef.length === 1 && [exports.Void, VoidType].includes(paramsDef[0].type)) {
                    paramsDef = [];
                    if (args.length === 1 && [null, undefined].includes(args[0])) {
                        args = [];
                    }
                    else if (args.length > 1 || ![null, undefined].includes(args[0])) {
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
                    return Object.assign(Object.assign({}, item), { name: item.name || "arg" + index });
                }).reduce((record, item, index) => {
                    record[item.name] = item.type;
                    _args[item.name] = args[index];
                    paramList.push(item.name);
                    return record;
                }, {});
                for (let i = paramList.length; i < args.length; i++) {
                    _args[`arg${i}`] = args[i];
                }
                try {
                    _args = validate(_args, params, "parameters", options);
                }
                catch (err) {
                    throw purifyStackTrace(err, newFn);
                }
                args = paramList.map(name => _args[name]);
            }
            const handleReturns = (returns, returnDef, promiseResolver = null) => {
                try {
                    return validate(returns, as(returnDef.type), returnDef.name, Object.assign(Object.assign({}, options), { suppress: true }));
                }
                catch (err) {
                    err = purifyStackTrace(err, promiseResolver !== null && promiseResolver !== void 0 ? promiseResolver : newFn);
                    if (throwDef) {
                        throw new ValidationError("validation failed", { cause: err });
                    }
                    else {
                        throw err;
                    }
                }
            };
            const handleError = (err, promiseCatcher = null) => {
                if (err instanceof ValidationError) {
                    throw err.cause;
                }
                else if (throwDef) {
                    try {
                        err = validate(err, as(throwDef.type), throwDef.name, Object.assign(Object.assign({}, options), { suppress: true }));
                    }
                    catch (_err) {
                        err = purifyStackTrace(_err, promiseCatcher !== null && promiseCatcher !== void 0 ? promiseCatcher : newFn);
                    }
                    throw err;
                }
                else {
                    throw err;
                }
            };
            const handleResult = () => {
                let returns = originFn.apply(this, args);
                if (returns && typeof returns === "object" && typeof returns.then === "function") {
                    if (returnDef) {
                        returns = returns
                            .then(function resolver(result) {
                            return handleReturns(result, returnDef, resolver);
                        });
                    }
                    returns = returns.then(result => {
                        emitWarnings.call(this, warnings, result);
                        return result;
                    });
                    if (throwDef) {
                        return returns.catch(function catcher(err) {
                            handleError(err, catcher);
                        });
                    }
                    else {
                        return returns;
                    }
                }
                else {
                    if (returnDef) {
                        returns = handleReturns(returns, returnDef);
                    }
                    emitWarnings.call(this, warnings, returns);
                    return returns;
                }
            };
            try {
                return handleResult();
            }
            catch (err) {
                handleError(err);
            }
        });
        newFn[_source] = originFn;
        if (typeof target === "function") {
            newFn[_title] = fnName;
        }
        else {
            newFn[_title] = target.constructor.name + "." + fnName;
        }
        copyFunctionProperties(originFn, newFn);
        if (desc) {
            fn = (desc.value = newFn);
        }
        else {
            fn = newFn;
        }
    }
    return fn;
}
;
function param(arg0, arg1, remarks = void 0) {
    const type = typeof arg0 === "string" ? arg1 : arg0;
    const name = typeof arg0 === "string" ? arg0 : arg1;
    return (target, prop = void 0, desc = null) => {
        var _a;
        const fn = wrap(target, prop, desc);
        const params = ((_a = fn[_params]) !== null && _a !== void 0 ? _a : (fn[_params] = []));
        params.unshift({ type, name, remarks });
        return desc !== null && desc !== void 0 ? desc : fn;
    };
}
exports.param = param;
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
function returns(type, remarks = void 0) {
    return ((target, prop = void 0, desc = null) => {
        const fn = wrap(target, prop, desc);
        fn[_returns] = { type, name: "returns", remarks };
        return desc !== null && desc !== void 0 ? desc : fn;
    });
}
exports.returns = returns;
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
function throws(type) {
    return ((target, prop = void 0, desc = null) => {
        const fn = wrap(target, prop, desc);
        fn[_throws] = { type, name: "throws" };
        return desc !== null && desc !== void 0 ? desc : fn;
    });
}
exports.throws = throws;
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
function deprecated(message = "") {
    return ((target, prop = void 0, desc = null) => {
        const fn = wrap(target, prop, desc);
        fn[_deprecated] = message;
        return desc !== null && desc !== void 0 ? desc : fn;
    });
}
exports.deprecated = deprecated;
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
function remarks(note) {
    return ((target, prop = void 0, desc = null) => {
        const fn = wrap(target, prop, desc);
        fn[_remarks] = note;
        return desc !== null && desc !== void 0 ? desc : fn;
    });
}
exports.remarks = remarks;
function decorate(...decorators) {
    return (fn) => {
        var _a;
        for (let i = decorators.length - 1; i >= 0; i--) {
            fn = (_a = decorators[i](fn)) !== null && _a !== void 0 ? _a : fn;
        }
        return fn;
    };
}
exports.decorate = decorate;
function def(fn, paramsDef, returnDef) {
    const fnName = fn.name || "anonymous";
    function wrapper(...args) {
        const warnings = [];
        const options = { warnings, removeUnknownItems: true };
        try {
            if (paramsDef.length === 1 && [exports.Void, VoidType].includes(paramsDef[0])) {
                paramsDef = [];
                if (args.length === 1 && [null, undefined].includes(args[0])) {
                    args = [];
                }
                else if (args.length > 1 || ![null, undefined].includes(args[0])) {
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
            }, {});
            for (let i = paramList.length; i < args.length; i++) {
                _args[`arg${i}`] = args[i];
            }
            _args = validate(_args, params, "parameters", options);
            args = paramList.map(name => _args[name]);
        }
        catch (err) {
            throw purifyStackTrace(err, wrapper);
        }
        let result = fn.call(this, ...args);
        if (result && typeof result === "object" && typeof result["then"] === "function") {
            return result
                .then(function resolver(res) {
                try {
                    return validate(res, returnDef, "returns", Object.assign(Object.assign({}, options), { suppress: true }));
                }
                catch (err) {
                    throw purifyStackTrace(err, resolver);
                }
            }).then(res => {
                emitWarnings.call(this, warnings, res);
                return res;
            });
        }
        else {
            try {
                result = validate(result, returnDef, "returns", Object.assign(Object.assign({}, options), { suppress: true }));
                emitWarnings.call(this, warnings, result);
                return result;
            }
            catch (err) {
                throw purifyStackTrace(err, wrapper);
            }
        }
    }
    ;
    wrapper[_title] = fnName;
    wrapper[_params] = paramsDef.map((type, index) => ({ type, name: "arg" + index }));
    wrapper[_returns] = { type: returnDef, name: "returns" };
    copyFunctionProperties(fn, wrapper);
    return wrapper;
}
exports.def = def;
function partial(type) {
    if (type instanceof DictType) {
        if (type.key instanceof ValidateableType) {
            if (type.key["_optional"]) {
                return type;
            }
            else {
                return new DictType(type.key.optional, type.value);
            }
        }
        else {
            // @ts-ignore
            return new DictType(ensureType(type.key).optional, type.value);
        }
    }
    return Object.keys(type).reduce((records, prop) => {
        const _type = type[prop];
        if (_type instanceof ValidateableType) {
            if (_type["_optional"]) {
                // @ts-ignore
                records[prop] = _type;
            }
            else {
                // @ts-ignore
                records[prop] = _type.optional;
            }
        }
        else {
            // @ts-ignore
            records[prop] = ensureType(_type, prop).optional;
        }
        return records;
    }, 
    // @ts-ignore
    {});
}
exports.partial = partial;
function required(type) {
    return Object.keys(type).reduce((records, prop) => {
        const _type = type[prop];
        if (_type instanceof ValidateableType) {
            if (!_type["_optional"]) {
                // @ts-ignore
                records[prop] = _type;
            }
            else {
                // @ts-ignore
                records[prop] = _type.required;
            }
        }
        else {
            // @ts-ignore
            records[prop] = ensureType(_type, prop).required;
        }
        return records;
    }, {});
}
exports.required = required;
function optional(type, props) {
    return Object.assign(Object.assign({}, partial((0, pick_1.default)(type, props))), (0, omit_1.default)(type, props));
}
exports.optional = optional;
function ensured(type, props) {
    return Object.assign(Object.assign({}, required((0, pick_1.default)(type, props))), (0, omit_1.default)(type, props));
}
exports.ensured = ensured;
function toJSONSchema(type, extra = {}) {
    const { parent } = extra, rest = tslib_1.__rest(extra, ["parent"]);
    let _type;
    if (type instanceof CustomType) {
        _type = type.type;
    }
    else if (type instanceof ArrayType) {
        _type = type.type;
    }
    else if (type instanceof TupleType) {
        _type = type.type;
    }
    else {
        _type = type;
    }
    if (parent && _type === parent) {
        return { $ref: "#" };
    }
    else if (Array.isArray(type)) {
        if (!type.length) {
            return omitUndefined(Object.assign(Object.assign({}, new ArrayType([exports.Any]).toJSONSchema(parent)), rest));
        }
        else {
            return omitUndefined(Object.assign(Object.assign({}, new ArrayType(type).toJSONSchema(parent)), rest));
        }
    }
    else if (isObject(type)) {
        const required = [];
        const schema = {
            type: "object",
            properties: Object.keys(type).reduce((properties, prop) => {
                const subSchema = toJSONSchema(type[prop], { parent: _type });
                if (subSchema) {
                    properties[prop] = subSchema;
                    const subType = ensureType(type[prop]);
                    let isRequired;
                    if (subType instanceof ValidateableType) {
                        isRequired = !subType["_optional"];
                    }
                    else if (Array.isArray(subType)) {
                        isRequired = true;
                    }
                    else {
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
        return omitUndefined(Object.assign(Object.assign({}, schema), rest));
    }
    else {
        return omitUndefined(Object.assign(Object.assign({}, ensureType(type, "", true).toJSONSchema(parent)), rest));
    }
}
function getJSONSchema(type, options = null) {
    const schema = toJSONSchema(type);
    if (options === null || options === void 0 ? void 0 : options.$id) {
        return omitUndefined(Object.assign(Object.assign({ $schema: jsonSchemaDraftLink, $id: options.$id, title: options.title }, schema), { description: schema.description || options.description }));
    }
    else {
        return schema;
    }
}
exports.getJSONSchema = getJSONSchema;
Function.prototype.getJSONSchema = function (options) {
    const title = (options === null || options === void 0 ? void 0 : options.title) || this[_title];
    const $id = (options === null || options === void 0 ? void 0 : options.$id) || title;
    const hasSuffix = $id === null || $id === void 0 ? void 0 : $id.endsWith(".schema.json");
    const parentId = hasSuffix ? $id.slice(0, -12) : $id;
    const paramsDef = this[_params];
    const returnDef = this[_returns];
    const isVoidParam = (paramsDef === null || paramsDef === void 0 ? void 0 : paramsDef.length) === 1 && paramsDef[0].type instanceof VoidType;
    return this[_title] ? omitUndefined({
        $schema: jsonSchemaDraftLink,
        $id: (options === null || options === void 0 ? void 0 : options.$id) || title,
        title,
        type: "function",
        description: (options === null || options === void 0 ? void 0 : options.description) || this[_remarks],
        deprecated: (0, isVoid_1.default)(this[_deprecated]) ? void 0 : true,
        parameters: paramsDef && !isVoidParam ? paramsDef.reduce((records, item, index) => {
            const name = item.name || "arg" + index;
            records[name] = getJSONSchema(item.type, {
                $id: `${parentId}.parameters.${name}` + (hasSuffix ? ".schema.json" : ""),
                title: `${title}.parameters.${name}`,
                description: item.remarks,
            });
            return records;
        }, {}) : null,
        returns: returnDef && !(returnDef.type instanceof VoidType) ? getJSONSchema(returnDef.type, {
            $id: `${parentId}.${returnDef.name}` + (hasSuffix ? ".schema.json" : ""),
            title: `${title}.${returnDef.name}`,
            description: returnDef.remarks,
        }) : null,
    }) : null;
};
//# sourceMappingURL=index.js.map