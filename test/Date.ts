import * as assert from "assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { validate, ValidationWarning } from "..";

describe("Date", () => {
    it("should validate a Date instance", () => {
        const _date = new Date();
        const date = validate(_date, Date, "date");
        assert.strictEqual(date, _date);
    });

    it("should report error when the date is not provided", () => {
        // @ts-ignore
        const [err1] = _try(() => validate(null, Date, "date"));
        assert.strictEqual(String(err1), "Error: date is required, but no value is given");

        // @ts-ignore
        const [err2] = _try(() => validate(void 0, Date, "date"));
        assert.strictEqual(
            String(err2),
            "Error: date is required, but no value is given"
        );
    });

    it("should validate an optional Date", () => {
        // @ts-ignore
        const date1 = validate(null, Date.optional, "date1");
        assert.strictEqual(date1, null);

        // @ts-ignore
        const date2 = validate(void 0, Date.optional, "date2");
        assert.strictEqual(date2, void 0);
    });

    it("should validate optional dates with default value", () => {
        const _date = new Date();

        // @ts-ignore
        const date1 = validate(null, Date.default(_date), "date1");
        assert.strictEqual(date1, _date);

        // @ts-ignore
        const date2 = validate(void 0, Date.default(_date), "date2");
        assert.strictEqual(date2, _date);
    });

    it("should convert compatible values to date and emit warnings", () => {
        const warnings: ValidationWarning[] = [];
        const _date = new Date();

        // @ts-ignore
        const date = validate(_date.toISOString(), Date, "date", { warnings });
        assert(date instanceof Date);
        assert.strictEqual(date.toISOString(), _date.toISOString());

        // @ts-ignore
        const date1 = validate("2023-01-01 00:00:00", Date, "date1", { warnings });
        assert(date1 instanceof Date);
        assert.strictEqual(date1.toISOString(), new Date("2023-01-01 00:00:00").toISOString());

        // @ts-ignore
        const date2 = validate(_date.valueOf(), Date, "date2", { warnings });
        assert(date2 instanceof Date);
        assert.strictEqual(date2.toISOString(), _date.toISOString());

        assert.deepStrictEqual(warnings, [
            {
                path: "date1",
                message: "a string at date1 has been converted to Date"
            },
            {
                path: "date2",
                message: "a number at date2 has been converted to Date"
            }
        ] as ValidationWarning[]);
    });

    it("should throw error when the value is not compatible", () => {
        // @ts-ignore
        const [err1] = _try(() => validate("Not a date", Date, "date"));
        assert.strictEqual(
            String(err1),
            "TypeError: date is expected to be a Date, but a string is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate(-1, Date, "date"));
        assert.strictEqual(
            String(err2),
            "TypeError: date is expected to be a Date, but a number is given"
        );
    });

    it("should not convert type when in strict mode", () => {
        const _date = new Date();

        // @ts-ignore
        const [err1] = _try(() => validate(_date.toISOString(), Date, "date", { strict: true }));
        assert.strictEqual(
            String(err1),
            "TypeError: date is expected to be a Date, but a string is given"
        );

        // @ts-ignore
        const [err2] = _try(() => validate(_date.valueOf(), Date, "date", { strict: true }));
        assert.strictEqual(
            String(err2),
            "TypeError: date is expected to be a Date, but a number is given"
        );
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        validate(new Date(), Date.deprecated("will no longer effect"), "date", { warnings });

        assert.deepStrictEqual(warnings, [{
            path: "date",
            message: "date is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });
});
