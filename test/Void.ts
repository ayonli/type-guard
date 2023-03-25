import * as assert from "node:assert";
import { describe, it } from "mocha";
import _try from "dotry";
import { validate, ValidationWarning, Void } from "..";

describe("Void", () => {
    it("should import Void type", () => {
        assert.strictEqual(typeof Void, "object");
        assert.strictEqual(String(Void), "[object VoidType]");
        assert.strictEqual(String(Void.optional), "[object VoidType]");
        assert.strictEqual(Void.optional, Void.optional);

        const [err] = _try(() => { Void.required; });
        assert(String(err).includes("VoidType is always optional"));
    });

    it("should validate Void against null and undefined", () => {
        // @ts-ignore
        const nil1 = validate(null, Void, "nil1");
        assert.strictEqual(nil1, null);

        const nil2 = validate(void 0, Void, "nil2");
        assert.strictEqual(nil2, void 0);
    });

    it("should validate Void of default value null", () => {
        const nil3 = validate(void 0, Void.default(null), "nil3");
        assert.strictEqual(nil3, null);
    });

    it("should emit deprecation warning", () => {
        const warnings: ValidationWarning[] = [];

        // @ts-ignore
        const nil = validate(null, Void.deprecated("will no longer effect"), "nil", {
            warnings,
        });
        assert.strictEqual(nil, null);

        assert.deepStrictEqual(warnings, [{
            path: "nil",
            message: "nil is deprecated: will no longer effect"
        }] as ValidationWarning[]);
    });
});
