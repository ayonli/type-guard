import * as assert from "assert";
import { describe, it } from "mocha";
import { Any, as, Void } from "..";

describe("as()", () => {
    describe("as-is", () => {
        it("should return the input type if they are validateable by self", () => {
            const type1 = as(String);
            assert.strictEqual(type1, String);

            const type2 = as(Number);
            assert.strictEqual(type2, Number);

            const type3 = as(BigInt);
            assert.strictEqual(type3, BigInt);

            const type4 = as(Boolean);
            assert.strictEqual(type4, Boolean);

            const type5 = as(Date);
            assert.strictEqual(type5, Date);

            const type6 = as(Object);
            assert.strictEqual(type6, Object);

            const type7 = as(Array);
            assert.strictEqual(type7, Array);

            const type8 = as(Any);
            assert.strictEqual(type8, Any);

            const type9 = as(Void);
            assert.strictEqual(type9, Void);

            const type10 = as(String.optional);
            assert.strictEqual(type10, String.optional);

            const BufferType = as(Buffer);
            const type11 = as(BufferType);
            assert.strictEqual(type11, BufferType);
        });
    });
});
