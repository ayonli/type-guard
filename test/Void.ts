import * as assert from "node:assert";
import { describe, it } from "mocha";
import { validate, Void } from "..";

describe("Void", () => {
    it("should import Void type", () => {
        assert.strictEqual(typeof Void, "object");
        assert.strictEqual(String(Void), "[object VoidType]");
        assert.strictEqual(String(Void.optional), "[object VoidType]");
        assert.strictEqual(Void.optional, Void.optional);

        try {
            Void.required;
        } catch (err) {
            assert(String(err).includes("VoidType is always optional"));
        }
    });

    it("should validate Void against null and undefined", () => {
        // @ts-ignore
        const nil1 = validate(null, Void, "nil1");
        assert.strictEqual(nil1, null);

        const nil2 = validate(void 0, Void, "nil2");
        assert.strictEqual(nil2, void 0);

        const nil3 = validate(void 0, Void.default(null), "nil3");
        assert.strictEqual(nil3, null);
    });
});
