import { describe, it, expect } from "vitest";
import * as fc from "fast-check"
import { formatTrace } from "@/lib/agent/pretty-printer";
import { trace } from "console";

describe("formatTrace", () => {
    it("contains Thought, Action, Observation for any non-empty trace", () => {
        const env = process.env as Record<string, string>;
        const original = env.NODE_ENV;
        env.NODE_ENV = "development";

        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        thought: fc.string({ minLength: 1 }),
                        action: fc.string({ minLength: 1 }),
                        input: fc.string({ minLength: 1 }),
                        observation: fc.string({ minLength: 1 }),
                    }),
                    { minLength: 1 }
                ),
                (trace) => {
                    const output = formatTrace(trace)
                    expect(output).toContain("Thought")
                    expect(output).toContain("Action")
                    expect(output).toContain("Observation")
                }
            ),
            { numRuns: 100 }
        )
        env.NODE_ENV = original
    })
})