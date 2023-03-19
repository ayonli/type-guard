import * as assert from "node:assert";
import { describe, it } from "mocha";
import { validate, ValidationWarning } from "..";

describe("Date", () => {
    it("should validate a Date instance", () => {
        const _date = new Date();
        const date = validate(_date, Date, "date");
        assert.strictEqual(date, _date);
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

    it("should report error when the date is not provided", () => {
        try {
            // @ts-ignore
            validate(null, Date, "date");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: date is required, but no value is provided"
            );
        }

        try {
            // @ts-ignore
            validate(void 0, Date, "date");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "Error: date is required, but no value is provided"
            );
        }
    });

    it("should convert compatible values to date and emit warnings", () => {
        const warnings: ValidationWarning[] = [];
        const _date = new Date();

        // @ts-ignore
        const date1 = validate(_date.toISOString(), Date, "date1", { warnings });
        assert(date1 instanceof Date);
        assert.strictEqual(date1.toISOString(), _date.toISOString());

        // @ts-ignore
        const date2 = validate(_date.valueOf(), Date, "date2", { warnings });
        assert(date2 instanceof Date);
        assert.strictEqual(date2.toISOString(), _date.toISOString());

        assert.deepStrictEqual(warnings, [
            {
                path: "date1",
                message: "a string at date1 has been converted to type of Date"
            },
            {
                path: "date2",
                message: "a number at date2 has been converted to type of Date"
            }
        ] as ValidationWarning[]);
    });

    it("should throw error when the value is not compatible", () => {
        try {
            // @ts-ignore
            validate("Not a date", Date, "date");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: date is expected to be type of Date, but a string is given"
            );
        }

        try {
            // @ts-ignore
            validate(-1, Date, "date");
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: date is expected to be type of Date, but a number is given"
            );
        }
    });

    it("should not convert type when in strict mode", () => {
        const _date = new Date();

        try {
            // @ts-ignore
            validate(_date.toISOString(), Date, "date", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: date is expected to be type of Date, but a string is given"
            );
        }

        try {
            // @ts-ignore
            validate(_date.valueOf(), Date, "date", { strict: true });
        } catch (err) {
            assert.strictEqual(
                String(err),
                "TypeError: date is expected to be type of Date, but a number is given"
            );
        }
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
