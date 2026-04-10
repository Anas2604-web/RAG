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

export interface DocumentMetaData{
    id: string, 
    filename: string,
    mimeType: string,
    uploadedAt: string,
    chunkCount: number,
    collection: string,
    sizeBytes: number
}