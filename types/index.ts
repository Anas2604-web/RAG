export interface ReActStep{
    thought: string
    action: string
    input: string
    observation: string
}

export type ReActTrace = ReActStep[]

export interface DocumentChunk {
    id: string,
    documentId: string,
    filename: string,
    collection: string,
    chunkIndex: number,
    text: string,
    tokenCount: number,
    metadata: Record<string, unknown>
}

export interface MetaDataFilter{
    [key: string]: unknown
}