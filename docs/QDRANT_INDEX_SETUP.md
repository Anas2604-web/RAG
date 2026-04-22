# Qdrant Payload Index Setup

## Overview

Qdrant requires payload indexes to enable filtering on specific fields. Without an index, any attempt to filter by a field will result in a "Bad Request" error.

## The Problem

When trying to filter documents by `documentId`:

```typescript
const results = await qdrantClient.search(collection, {
  vector: queryVector,
  limit: 5,
  filter: {
    must: [{ key: "documentId", match: { value: "some-id" } }]
  }
});
```

**Without an index**, Qdrant returns:
```
Bad Request: Index required but not found for "documentId" of one of the following types: [keyword]. 
Help: Create an index for this key or use a different filter.
```

## The Solution

Create a payload index on the `documentId` field:

```typescript
await qdrantClient.createPayloadIndex(collection, {
  field_name: "documentId",
  field_schema: "keyword",
});
```

## Implementation

### Automatic Index Creation

The `ensureCollection` function now automatically creates the index when initializing a collection:

```typescript
// lib/vectorstore/qdrant-client.ts
export async function ensureCollection(
  name: string,
  dimension: number
): Promise<void> {
  const exists = await collectionExists(name);

  if (!exists) {
    await qdrantClient.createCollection(name, {
      vectors: { size: dimension, distance: "Cosine" },
    });
  }

  // Ensure payload index for documentId field
  try {
    await qdrantClient.createPayloadIndex(name, {
      field_name: "documentId",
      field_schema: "keyword",
    });
  } catch (error) {
    // Index might already exist, ignore error
  }
}
```

### Manual Migration

For existing collections, run the migration script:

```bash
npx tsx migrate-add-index.ts
```

This script:
1. Connects to your Qdrant instance
2. Creates a keyword index on the `documentId` field
3. Handles cases where the index already exists

## Field Schema Types

Qdrant supports different field schema types for indexing:

- **keyword**: For exact string matching (used for `documentId`)
- **integer**: For numeric fields
- **float**: For floating-point numbers
- **bool**: For boolean values
- **geo**: For geographic coordinates
- **text**: For full-text search

## Testing

### Test Index Creation

```bash
npx tsx test-qdrant-filter.ts
```

This tests:
- No filter (baseline)
- Single document filter (must)
- Multiple document filter (should/OR)
- Actual document IDs from collection

### Test with Real Data

```bash
npx tsx test-real-filter.ts
```

This:
1. Fetches actual document IDs from your collection
2. Tests filtering with real IDs
3. Verifies OR logic with multiple documents

## Performance Considerations

### Index Benefits
- **Fast filtering**: O(log n) lookup instead of full scan
- **Reduced memory**: Only indexed fields are loaded
- **Scalability**: Handles millions of documents efficiently

### Index Costs
- **Storage**: Additional disk space for index
- **Write speed**: Slight overhead when inserting new points
- **Memory**: Index is kept in memory for fast access

### Best Practices

1. **Index only what you filter on**: Don't create unnecessary indexes
2. **Use appropriate schema types**: `keyword` for exact match, `text` for search
3. **Monitor index size**: Check Qdrant dashboard for index statistics
4. **Rebuild if needed**: Indexes can be recreated if corrupted

## Common Issues

### Issue: "Index already exists"

**Cause**: Trying to create an index that's already been created

**Solution**: This is harmless and can be ignored. The code handles this gracefully.

### Issue: "Bad Request" despite index

**Cause**: Index creation might have failed silently

**Solution**: 
1. Check Qdrant logs
2. Verify index exists in Qdrant dashboard
3. Try recreating the index manually

### Issue: Slow filter queries

**Cause**: Index not being used or collection too large

**Solution**:
1. Verify index exists and is active
2. Check query structure matches index type
3. Consider adding more specific indexes

## Qdrant Cloud Dashboard

To verify indexes in Qdrant Cloud:

1. Go to your Qdrant Cloud dashboard
2. Select your collection
3. Navigate to "Indexes" tab
4. Verify `documentId` index exists with type `keyword`

## Future Enhancements

Consider adding indexes for:
- `userId`: Filter by user (if added to payload)
- `uploadedAt`: Filter by date range
- `filename`: Search by filename
- `chunkIndex`: Order by chunk position

## References

- [Qdrant Filtering Documentation](https://qdrant.tech/documentation/concepts/filtering/)
- [Qdrant Payload Indexes](https://qdrant.tech/documentation/concepts/indexing/)
- [Qdrant JS Client](https://github.com/qdrant/qdrant-js)
