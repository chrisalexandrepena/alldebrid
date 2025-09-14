# AllDebrid SDK + CLI

TypeScript SDK and Command Line Interface for the AllDebrid API.

## 📦 Installation

### Global CLI Installation
```bash
npm install -g alldebrid
# or
pnpm add -g alldebrid

alldebrid --help
```

### Local SDK Installation
```bash
npm install alldebrid
# or  
pnpm add alldebrid
```

## 🚀 Quick Start

### SDK Usage
```typescript
import { Alldebrid } from "alldebrid";

const client = new Alldebrid({
  apiKey: process.env.ALLDEBRID_API_KEY!,
  logLevel: "warn", // optional: fatal|error|warn|info|debug|trace
  baseUrl: "https://api.alldebrid.com/v4", // optional
});

// Get user info
const user = await client.user.get();

// List magnets with status filter
const ready = await client.magnet.list("ready");

// Get specific magnet details
const magnet = await client.magnet.get(123456);

// Upload a magnet
const result = await client.magnet.upload(["magnet:?xt=urn:btih:..."]);

// Unlock a premium link
const unlocked = await client.link.debrid("https://example.com/file");
```

### CLI Usage
```bash
# Set API key (one of these methods)
export ALLDEBRID_API_KEY="your-api-key"
alldebrid --apikey "your-api-key" user info
# or create config file (see Configuration section)

# User commands
alldebrid user info
alldebrid user hosts
alldebrid user saved-links-list

# Magnet commands  
alldebrid magnet list
alldebrid magnet list --status ready
alldebrid magnet get 123456
alldebrid magnet upload "magnet:?xt=urn:btih:..."
alldebrid magnet delete 123456

# Link commands
alldebrid link info "https://example.com/file"
alldebrid link unlock "https://example.com/file"

# Host commands
alldebrid hosts
alldebrid host-domains
alldebrid host-priorities

# Output formats
alldebrid user info --format json
alldebrid user info --format yaml
alldebrid user info --format text  # default, with colors
```

## 📖 Documentation

- **[CLI Documentation](docs/cli.md)** - Complete command reference
- **[SDK Documentation](docs/sdk.md)** - Full API reference  
- **[Configuration Guide](docs/configuration.md)** - Setup and config options
- **[Examples](docs/examples.md)** - Common usage patterns

## ✨ Features

### SDK
- 🔷 **TypeScript first** - Full type safety with Zod validation
- 🔄 **Complete API coverage** - All AllDebrid endpoints supported
- 🛡️ **Error handling** - Structured error types with retry logic
- 📊 **Logging** - Configurable logging with Pino
- 🧪 **Well tested** - Unit and E2E tests

### CLI
- 🎨 **Beautiful output** - Colorized text with clean formatting
- 📄 **Multiple formats** - JSON, YAML, and human-readable text
- ⚙️ **Flexible config** - Environment variables, flags, or config files
- 🔑 **Multiple auth methods** - API key via flag, env, or config
- 📍 **Cross-platform** - Works on Windows, macOS, and Linux

## 🏗️ Architecture

### SDK Structure
```
src/sdk/
├── index.ts              # Public API exports
├── core/                 # Internal infrastructure  
│   ├── http/            # HTTP client and request handling
│   ├── errors.ts        # Error types and handling
│   └── logger.ts        # Logging configuration
└── resources/           # API resource implementations
    ├── users/           # User management
    ├── magnets/         # Torrent/magnet handling
    ├── links/           # Link unlocking
    └── hosts/           # Host information
```

### Public API Surface
The SDK exposes a clean, stable API via the `Alldebrid` class:
- **User Resource**: `client.user.*` - User info, saved links, recent links
- **Magnet Resource**: `client.magnet.*` - List, get, upload, delete, restart
- **Link Resource**: `client.link.*` - Get info, unlock premium links  
- **Host Resource**: `client.host.*` - List hosts, domains, priorities

### Internal Implementation
- HTTP client, logger, and error mapping are private
- Resource classes are internal; only their methods are exposed
- Type-safe with Zod schemas for all API responses

## End-to-End Tests

These tests call the real AllDebrid API to validate responses against the SDK schemas. They are opt-in and skipped by default.

- Local run:

```
ALLDEBRID_API_KEY=your_key ALLDEBRID_E2E=1 pnpm test
```

- Or use the helper script (Linux CI runners):

```
ALLDEBRID_API_KEY=your_key pnpm test:e2e
```

CI recommendation (GitHub Actions):

```
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build && pnpm typecheck && pnpm lint
      - name: Run E2E tests against AllDebrid API
        run: pnpm test:e2e
        env:
          ALLDEBRID_API_KEY: ${{ secrets.ALLDEBRID_API_KEY }}
```

Notes:
- Tests only perform read/inspect calls (no destructive actions).
- If the API payload shape changes, Zod parsing fails and CI will fail, alerting you to adjust schemas.
