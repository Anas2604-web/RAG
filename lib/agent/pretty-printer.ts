import type { ReActTrace } from "@/types/index";

export function formatTrace(trace: ReActTrace): string {
    if(process.env.NODE_ENV !== "development") return "";

    return trace
        .map(
            (step, i) => 
                `[Step ${i + 1}]\n  Thought: ${step.thought}\n  Action: ${step.action}\n  Input: ${step.input}\n  Observation: ${step.observation}`
        )
        .join("\n\n")
}