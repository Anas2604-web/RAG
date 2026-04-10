export interface ReActStep{
    thought: string
    action: string
    input: string
    observation: string
}

export type ReActTrace = ReActStep[];