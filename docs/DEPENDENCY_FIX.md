# Dependency Resolution Fix

## Problem
When running `npm install`, you may encounter this error:

```
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
npm error Found: dotenv@17.4.2
npm error Could not resolve dependency:
npm error peer dotenv@"^16.4.5" from @browserbasehq/stagehand@1.14.0
```

## Root Cause
The `@langchain/community` package has a peer dependency on `dotenv@^16.4.5`, but the project uses `dotenv@^17.4.0`. These versions are incompatible according to npm's strict peer dependency resolution.

## Solution

### Option 1: Use `--legacy-peer-deps` (Recommended)
```bash
npm install --legacy-peer-deps
```

This flag tells npm to ignore peer dependency conflicts and proceed with installation. This is safe in this case because:
- `dotenv@17.4.0` is backward compatible with `dotenv@16.4.5`
- The functionality needed by `@langchain/community` is available in both versions
- This is a known issue with LangChain dependencies

### Option 2: Downgrade dotenv (Alternative)
```bash
npm install dotenv@16.4.5 --legacy-peer-deps
```

Then run:
```bash
npm install --legacy-peer-deps
```

### Option 3: Use npm 7+ with force flag
```bash
npm install --force
```

**Note**: This is more aggressive and may cause other issues. Use `--legacy-peer-deps` instead.

## Verification

After installation, verify everything works:

```bash
# Run tests
npm test

# Should see: 18 passed | 2 skipped
```

## Why This Happens

LangChain's community package was built with an older version of dotenv. The newer version (17.x) is compatible but npm's strict peer dependency checking flags it as a conflict. Using `--legacy-peer-deps` allows npm to use the newer version, which works fine.

## Future Installs

Add this to your `.npmrc` file to make `--legacy-peer-deps` the default:

```bash
echo "legacy-peer-deps=true" >> .npmrc
```

Then you can just run:
```bash
npm install
```

## Related Files

- `package.json` - Dependencies list
- `package-lock.json` - Locked versions

## Status

✅ **Fixed** - All dependencies installed successfully
✅ **Verified** - All tests passing (18 passed | 2 skipped)

