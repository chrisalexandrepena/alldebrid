# SDK API Documentation

The AllDebrid SDK provides a complete TypeScript interface to the AllDebrid API with full type safety and comprehensive error handling.

## Installation

```bash
npm install alldebrid
# or
pnpm add alldebrid
```

## Quick Start

```typescript
import { Alldebrid } from "alldebrid";

const client = new Alldebrid({
  apiKey: process.env.ALLDEBRID_API_KEY!,
  logLevel: "warn", // optional
  baseUrl: "https://api.alldebrid.com/v4", // optional
  timeout: 30000, // optional, in milliseconds
  retries: 3, // optional
});
```

## Client Configuration

### `ClientOptions`

```typescript
interface ClientOptions {
  apiKey: string;                    // Required: Your AllDebrid API key
  baseUrl?: string;                  // Optional: API base URL (default: official endpoint)
  logLevel?: "fatal" | "error" | "warn" | "info" | "debug" | "trace"; // Optional: Log level
  timeout?: number;                  // Optional: Request timeout in milliseconds
  retries?: number;                  // Optional: Number of retry attempts
}
```

**Example:**
```typescript
const client = new Alldebrid({
  apiKey: "your-api-key-here",
  logLevel: "info",
  timeout: 60000, // 60 seconds
  retries: 5,
});
```

## User Resource

Access user account information and manage saved/recent links.

### `client.user.get()`
Get user account information.

**Returns:** `Promise<User>`

```typescript
const user = await client.user.get();
console.log(user.username, user.isPremium);
```

**Response Type:**
```typescript
interface User {
  username: string;
  email: string;
  isPremium: boolean;
  isSubscribed: boolean;
  isTrial: boolean;
  premiumUntil: DateTime; // Luxon DateTime object
  lang: string;
  preferedDomain: string;
  fidelityPoints: number;
  limitedHostersQuotas: Record<string, number>;
  notifications: any[];
}
```

### `client.user.getHosts()`
Get user's available hosts.

**Returns:** `Promise<Record<string, UserHost>>`

```typescript
const hosts = await client.user.getHosts();
Object.entries(hosts).forEach(([hostId, host]) => {
  console.log(`${host.name}: ${host.status}`);
});
```

### `client.user.listSavedLinks()`
List user's saved links.

**Returns:** `Promise<SavedLink[]>`

```typescript
const savedLinks = await client.user.listSavedLinks();
```

### `client.user.saveLinks(links: string[])`
Save links to user's account.

**Parameters:**
- `links: string[]` - Array of URLs to save

**Returns:** `Promise<{ saved: boolean }>`

```typescript
const result = await client.user.saveLinks([
  "https://example.com/file1",
  "https://example.com/file2"
]);
```

### `client.user.deleteLinks(links: string[])`
Delete saved links from user's account.

**Parameters:**
- `links: string[]` - Array of URLs to delete

**Returns:** `Promise<{ deleted: boolean }>`

### `client.user.listRecentLinks()`
List user's recent links.

**Returns:** `Promise<SavedLink[]>`

```typescript
const recentLinks = await client.user.listRecentLinks();
```

### `client.user.purgeRecentLinks()`
Clear all recent links.

**Returns:** `Promise<{ deleted: boolean }>`

### `client.user.clearNotifications(id: number)`
Clear a specific notification.

**Parameters:**
- `id: number` - Notification ID to clear

**Returns:** `Promise<{ cleared: boolean }>`

## Magnet Resource

Manage torrents and magnet links.

### `client.magnet.list(status?)`
List user's magnets with optional status filtering.

**Parameters:**
- `status?: "active" | "ready" | "expired" | "error"` - Optional status filter

**Returns:** `Promise<MagnetListed[]>`

```typescript
// List all magnets
const allMagnets = await client.magnet.list();

// List only ready magnets
const readyMagnets = await client.magnet.list("ready");

// List only active magnets  
const activeMagnets = await client.magnet.list("active");
```

**Response Types:**
```typescript
interface MagnetListedReady {
  id: number;
  filename: string;
  hash: string;
  status: "Ready";
  statusCode: 4;
  size: number;
  type: "m";
  completionDate: DateTime;
  uploadDate: DateTime;
  nbLinks: number;
}

interface MagnetListedError {
  id: number;
  filename: string;
  hash: string;
  status: "Error";
  statusCode: 6;
  error: {
    code: string;
    message: string;
  };
}
```

### `client.magnet.get(id: number)`
Get detailed information about a specific magnet.

**Parameters:**
- `id: number` - Magnet ID

**Returns:** `Promise<Magnet>`

```typescript
const magnet = await client.magnet.get(123456);
console.log(magnet.filename);
console.log(magnet.files.length, "files");
```

**Response Type:**
```typescript
interface Magnet {
  id: number;
  filename: string;
  hash: string;
  status: string;
  statusCode: number;
  size: number;
  type: "m";
  completionDate?: DateTime;
  uploadDate: DateTime;
  files: MagnetFile[];
  // ... other properties
}

interface MagnetFile {
  name: string;
  size: number;
  link?: string; // Available when magnet is ready
}
```

### `client.magnet.upload(magnets: string[])`
Upload magnet links or torrent hashes.

**Parameters:**
- `magnets: string[]` - Array of magnet URIs or info hashes

**Returns:** `Promise<(UploadedMagnetSuccess | UploadedMagnetErrored)[]>`

```typescript
const results = await client.magnet.upload([
  "magnet:?xt=urn:btih:abcdef1234567890...",
  "1234567890abcdef..." // Info hash
]);

results.forEach(result => {
  if (result.success) {
    console.log("Uploaded:", result.id);
  } else {
    console.error("Failed:", result.error);
  }
});
```

### `client.magnet.uploadFile(files: InputTorrentFile[])`
Upload torrent files.

**Parameters:**
- `files: InputTorrentFile[]` - Array of torrent file objects

```typescript
interface InputTorrentFile {
  fileName: string;
  blob: Blob;
}

// Example with file upload
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files?.[0];
if (file) {
  const result = await client.magnet.uploadFile([{
    fileName: file.name,
    blob: file
  }]);
}
```

### `client.magnet.delete(id: number)`
Delete a magnet.

**Parameters:**
- `id: number` - Magnet ID to delete

**Returns:** `Promise<DeleteMagnetResponse>`

```typescript
const result = await client.magnet.delete(123456);
console.log("Deleted:", result.success);
```

### `client.magnet.restart(id: number)`
Restart a magnet.

**Parameters:**
- `id: number` - Magnet ID to restart

**Returns:** `Promise<RestartMagnetSuccess | RestartMagnetErrored>`

```typescript
const result = await client.magnet.restart(123456);
if (result.success) {
  console.log("Restarted successfully");
} else {
  console.error("Restart failed:", result.error);
}
```

## Link Resource

Unlock premium links and get link information.

### `client.link.getInfo(link: string, password?: string)`
Get information about a link without unlocking it.

**Parameters:**
- `link: string` - URL to get info for
- `password?: string` - Optional password for protected links

**Returns:** `Promise<LinkInfo>`

```typescript
const info = await client.link.getInfo("https://rapidgator.net/file/abc123");
console.log("File size:", info.filesize);
console.log("Filename:", info.filename);

// With password
const protectedInfo = await client.link.getInfo(
  "https://example.com/protected", 
  "mypassword"
);
```

### `client.link.debrid(link: string, password?: string)`
Unlock a premium link.

**Parameters:**
- `link: string` - URL to unlock
- `password?: string` - Optional password for protected links

**Returns:** `Promise<DebridLinkResponse>`

```typescript
const result = await client.link.debrid("https://rapidgator.net/file/abc123");
console.log("Direct download URL:", result.link);
console.log("Filename:", result.filename);
console.log("File size:", result.filesize);
```

## Host Resource

Get information about supported file hosts.

### `client.host.list()`
List all supported hosts.

**Returns:** `Promise<ListHostResponse>`

```typescript
const hosts = await client.host.list();
hosts.hosts.forEach(host => {
  console.log(`${host.name}: ${host.status}`);
});
```

### `client.host.listDomains()`
List all domains for supported hosts.

**Returns:** `Promise<ListDomainsResponse>`

```typescript
const domains = await client.host.listDomains();
console.log("Supported domains:", domains.domains);
```

### `client.host.listHostPriorities()`
List host download priorities.

**Returns:** `Promise<Record<string, number>>`

```typescript
const priorities = await client.host.listHostPriorities();
Object.entries(priorities).forEach(([host, priority]) => {
  console.log(`${host}: priority ${priority}`);
});
```

## Error Handling

The SDK provides structured error handling with specific error types:

```typescript
import { 
  Alldebrid, 
  SdkError, 
  NetworkError, 
  ApiError, 
  ValidationError,
  ConfigurationError 
} from "alldebrid";

try {
  const user = await client.user.get();
} catch (error) {
  if (error instanceof ApiError) {
    console.error("API Error:", error.code, error.message);
  } else if (error instanceof NetworkError) {
    console.error("Network Error:", error.message);
  } else if (error instanceof ValidationError) {
    console.error("Validation Error:", error.message);
  } else if (error instanceof ConfigurationError) {
    console.error("Config Error:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

### Error Types

- **`SdkError`** - Base error class for all SDK errors
- **`NetworkError`** - HTTP/network related errors
- **`ApiError`** - AllDebrid API errors (e.g., invalid API key, quota exceeded)
- **`ValidationError`** - Response validation errors (unexpected API response format)
- **`ConfigurationError`** - Client configuration errors

## Batch Results

Some operations return batch results for handling multiple items:

```typescript
import { createBatchResult, type BatchResult } from "alldebrid";

// Example: Upload multiple magnets
const results = await client.magnet.upload([
  "magnet:?xt=urn:btih:123...",
  "magnet:?xt=urn:btih:456..."
]);

// Process batch results
const batchResult = createBatchResult(results);
console.log(`Success: ${batchResult.successful.length}`);
console.log(`Failed: ${batchResult.failed.length}`);
```

## Type Exports

The SDK exports all relevant types for TypeScript usage:

```typescript
import type {
  // Client types
  ClientOptions,
  
  // User types
  User,
  UserHost,
  SavedLink,
  
  // Magnet types
  Magnet,
  MagnetListed,
  MagnetListedReady,
  MagnetListedError,
  MagnetFile,
  UploadedMagnetSuccess,
  UploadedMagnetErrored,
  
  // Link types  
  LinkInfo,
  DebridLinkResponse,
  
  // Host types
  Host,
  
  // Error types
  BatchResult,
} from "alldebrid";
```

## Advanced Usage

### Custom HTTP Configuration

```typescript
const client = new Alldebrid({
  apiKey: "your-key",
  timeout: 60000, // 60 second timeout
  retries: 5,     // 5 retry attempts
  logLevel: "debug", // Detailed logging
});
```

### Working with DateTime Objects

The SDK uses Luxon DateTime objects for all date/time fields:

```typescript
const user = await client.user.get();
console.log("Premium until:", user.premiumUntil.toISO());
console.log("Days remaining:", user.premiumUntil.diffNow('days').days);

const magnet = await client.magnet.get(123456);
console.log("Uploaded:", magnet.uploadDate.toLocaleString());
```

### Handling Large Lists

```typescript
// Use status filtering to reduce response size
const activeMagnets = await client.magnet.list("active");
const readyMagnets = await client.magnet.list("ready");

// Process in chunks if needed
const allMagnets = await client.magnet.list();
const chunks = [];
for (let i = 0; i < allMagnets.length; i += 10) {
  chunks.push(allMagnets.slice(i, i + 10));
}
```