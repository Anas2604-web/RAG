# Document Isolation and Session-Based Filtering

## Problem

Previously, the RAG system was searching across **all documents** in the Qdrant vector store, regardless of:
- Which user uploaded them
- Which session they belong to
- Whether the user has access to them

This meant users could see citations and answers from documents uploaded by other users or in other sessions.

## Solution

Implemented **session-based document isolation** to ensure users only see results from documents they've uploaded to the current session.

## Critical Fix: Qdrant Payload Index

**Important**: Qdrant requires a payload index on the `documentId` field to enable filtering. Without this index, all filter queries will fail with a "Bad Request" error.

### Creating the Index

The index is automatically created when a new collection is initialized. For existing collections, run the migration:

```bash
npx tsx migrate-add-index.ts
```

This creates a keyword index on the `documentId` field, enabling fast filtering by document ID.

## How It Works

### 1. Session Document Tracking

Each `ChatSession` maintains a list of documents uploaded to that session:

```typescript
interface IChatSession {
  userId: ObjectId;
  documents: ISessionDocument[];  // Documents in THIS session
  messages: IMessage[];
  // ...
}
```

### 2. Query Filtering Logic

When a user asks a question, the system:

1. **Retrieves session documents**: Gets all `documentId`s from the current session
2. **Validates session ownership**: Ensures the session belongs to the logged-in user
3. **Requires explicit selection**: User MUST select at least one document before asking
4. **Filters by selected documents**: Only searches within explicitly selected documents
5. **Validates selection**: Ensures selected documents belong to the session

### 3. Implementation in `/api/ask`

```typescript
// Get all document IDs from this session
const sessionDocumentIds = chatSession.documents.map((doc) => doc.documentId);

// If no documents in session, return early
if (sessionDocumentIds.length === 0) {
  return "Please upload documents to this session before asking questions.";
}

// REQUIRE explicit document selection
if (!documentIds || documentIds.length === 0) {
  return "Please select at least one document from the list on the left before asking questions.";
}

// Verify selected documents belong to this session
const documentsToSearch = documentIds.filter(id => 
  sessionDocumentIds.includes(id)
);

// Build Qdrant filter
const filter = {
  should: documentsToSearch.map(docId => ({
    key: "documentId",
    match: { value: docId }
  }))
};

// Search only within selected documents
const chunks = await retrieve(query, undefined, filter);
```

## Security Benefits

### ✅ User Isolation
- Users can only query documents they've uploaded
- No cross-user data leakage

### ✅ Session Isolation
- Each chat session has its own document scope
- Documents from other sessions are not accessible

### ✅ Validation
- Selected documents are validated against session documents
- Invalid document IDs are rejected with clear error messages

## User Experience

### Before
- User sees citations from documents they didn't upload
- Confusing results from unrelated documents
- No clear document boundaries
- System searches all documents even when none selected

### After
- User MUST select documents before asking questions
- Clear feedback when no documents are selected
- Only sees results from explicitly selected documents
- Explicit document selection with validation

## Error Messages

### No Documents in Session
```
Please upload documents to this session before asking questions. 
I can only answer based on documents you've uploaded.
```

### No Documents Selected
```
Please select at least one document from the list on the left before asking questions. 
I can only answer based on the documents you explicitly select.
```

### Invalid Document Selection
```
The selected documents are not available in this session. 
Please select documents from the list on the left.
```

### No Relevant Information Found
```
I couldn't find any relevant information in the selected documents. 
Try selecting different documents or rephrasing your question.
```

## Testing

To verify document isolation:

1. **Create two sessions** with different documents
2. **Ask the same question** in both sessions
3. **Verify** that each session only returns results from its own documents
4. **Try selecting documents** from another session (should fail validation)

## Future Enhancements

- [ ] Add user-level document library (shared across sessions)
- [ ] Implement document sharing between users
- [ ] Add workspace-level document collections
- [ ] Support document access control lists (ACLs)
- [ ] Add audit logging for document access

## Related Files

- `app/api/ask/route.ts` - Main query handler with filtering logic
- `lib/vectorstore/retriever.ts` - Vector search with filter support
- `lib/vectorstore/qdrant-client.ts` - Qdrant client with index creation
- `lib/db/models/ChatSession.ts` - Session and document schema
- `components/chat/ChatWindow.tsx` - Sends selected document IDs
- `components/documents/DocumentPanel.tsx` - Document selection UI
- `migrate-add-index.ts` - Migration script to add payload index

## Troubleshooting

### "Bad Request" Error on Queries

If you see "Bad Request" errors when querying:

1. Check if the payload index exists:
   ```bash
   # The index should be created automatically, but if not:
   npx tsx migrate-add-index.ts
   ```

2. Verify the index was created successfully in Qdrant Cloud dashboard

3. Check the error logs for "Index required but not found" messages

### No Results Returned

If queries return no results:

1. Verify documents are uploaded to the current session
2. Check that `documentId` is being stored in Qdrant payloads during ingestion
3. Use the test script to verify filtering works:
   ```bash
   npx tsx test-real-filter.ts
   ```
