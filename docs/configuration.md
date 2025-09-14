# Configuration Guide

The AllDebrid SDK and CLI support multiple configuration methods with a clear priority hierarchy to give you maximum flexibility.

## Priority Order

Configuration values are resolved in the following order (highest to lowest priority):

1. **Command-line flags** - Highest priority
2. **Environment variables** - Medium priority  
3. **Configuration files** - Lowest priority

## Command-Line Flags

### Global Options

```bash
alldebrid --apikey "your-key" user info          # API key flag
alldebrid --format json user info                 # Output format flag
```

Available global flags:
- `-k, --apikey <key>` - Your AllDebrid API key
- `-f, --format <format>` - Output format: `text`, `json`, or `yaml`
- `--help` - Show help information
- `--version` - Show version number

### Command-Specific Options

```bash
alldebrid magnet list --status ready              # Filter magnets by status
alldebrid link info "url" --password "pass"       # Password for protected links
```

## Environment Variables

Set these in your shell profile or `.bashrc`/`.zshrc`:

```bash
export ALLDEBRID_API_KEY="your-api-key-here"
```

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLDEBRID_API_KEY` | Your AllDebrid API key | *Required* |

## Configuration Files

### File Locations

Configuration files are searched in the following order:

#### Linux/Unix/macOS
1. `~/.config/alldebrid/config.yml` **(Recommended - XDG standard)**
2. `~/.config/alldebrid/config.yaml`
3. `~/.alldebrid.yml`
4. `~/.alldebrid.yaml`
5. `~/.alldebrid/config.yml`
6. `~/.alldebrid/config.yaml`

#### Windows
1. `%APPDATA%\alldebrid\config.yml` **(Recommended)**
2. `%USERPROFILE%\.alldebrid.yml`
3. `%USERPROFILE%\.alldebrid.yaml`
4. `%USERPROFILE%\.alldebrid\config.yml`

### File Format

Configuration files use YAML format:

```yaml
# ~/.config/alldebrid/config.yml (recommended location)

# Required: Your AllDebrid API key
ALLDEBRID_API_KEY: your-api-key-here

# Optional: API base URL (rarely needed)
BASE_URL: https://api.alldebrid.com/v4

# Optional: Log level for debugging
LOG_LEVEL: error  # fatal|error|warn|info|debug|trace

# Optional: Default output format
OUTPUT_FORMAT: text  # text|json|yaml
```

### Creating Your Configuration File

#### Recommended Setup (Linux/macOS)
```bash
# Create the config directory
mkdir -p ~/.config/alldebrid

# Create the config file
cat > ~/.config/alldebrid/config.yml << EOF
ALLDEBRID_API_KEY: your-api-key-here
LOG_LEVEL: error
OUTPUT_FORMAT: text
EOF
```

#### Windows Setup
```cmd
# Create the config directory
mkdir "%APPDATA%\alldebrid"

# Create the config file (use your text editor)
notepad "%APPDATA%\alldebrid\config.yml"
```

Then add the configuration content shown above.

## SDK Configuration

When using the SDK programmatically, pass options to the client constructor:

```typescript
import { Alldebrid } from "alldebrid";

const client = new Alldebrid({
  // Required
  apiKey: process.env.ALLDEBRID_API_KEY!,
  
  // Optional configurations
  baseUrl: "https://api.alldebrid.com/v4",  // Custom API URL
  logLevel: "warn",                         // Logging level
  timeout: 30000,                           // Request timeout (ms)
  retries: 3,                               // Retry attempts
});
```

### ClientOptions Interface

```typescript
interface ClientOptions {
  apiKey: string;                          // Required: Your API key
  baseUrl?: string;                        // Optional: API base URL
  logLevel?: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
  timeout?: number;                        // Optional: Request timeout in ms
  retries?: number;                        // Optional: Number of retries
}
```

## Getting Your API Key

1. Log in to your [AllDebrid account](https://alldebrid.com)
2. Go to **Account Settings** → **API**
3. Generate or copy your API key
4. Add it to your configuration using one of the methods above

## Configuration Examples

### Development Setup
```yaml
# ~/.config/alldebrid/config.yml
ALLDEBRID_API_KEY: your-dev-api-key
LOG_LEVEL: debug
OUTPUT_FORMAT: json
```

### Production/Automation Setup
```bash
# Environment variables in production
export ALLDEBRID_API_KEY="your-prod-api-key"

# Use in scripts
alldebrid magnet list --format json | jq '.[] | select(.status == "Ready")'
```

### Multiple Environments

You can use different configuration files for different environments:

```bash
# Development
alldebrid --apikey "$DEV_API_KEY" user info

# Production  
alldebrid --apikey "$PROD_API_KEY" user info
```

## Troubleshooting

### "API key required" Error

This means no API key was found. Check in order:

1. **CLI flag**: Did you pass `--apikey`?
2. **Environment**: Is `ALLDEBRID_API_KEY` set?
3. **Config file**: Does your config file exist and contain the key?

```bash
# Debug configuration loading
alldebrid user info --format json 2>&1 | head -10
```

### Config File Not Found

Verify your config file location and format:

```bash
# Check if file exists (Linux/macOS)
ls -la ~/.config/alldebrid/config.yml

# Check file contents
cat ~/.config/alldebrid/config.yml
```

### Invalid YAML Format

Ensure your YAML is valid:

```yaml
# Correct format
ALLDEBRID_API_KEY: your-key-here
LOG_LEVEL: error

# Common mistakes to avoid
ALLDEBRID_API_KEY your-key-here    # Missing colon
ALLDEBRID_API_KEY: "key with spaces but missing quotes around the whole value"
```

### Permission Issues

Make sure the config file has correct permissions:

```bash
# Set proper permissions (Linux/macOS)
chmod 600 ~/.config/alldebrid/config.yml
```

## Security Best Practices

1. **Protect your API key**: Never commit API keys to version control
2. **Use environment variables in CI/CD**: 
   ```bash
   # In GitHub Actions
   env:
     ALLDEBRID_API_KEY: ${{ secrets.ALLDEBRID_API_KEY }}
   ```
3. **Restrict file permissions**: `chmod 600` for config files
4. **Use different keys for different environments**

## Configuration Migration

### From v1.x to v2.x

If you had a simple text file with just the API key:

```bash
# Old format (~/.alldebrid)
your-api-key-here

# New format (~/.config/alldebrid/config.yml)
ALLDEBRID_API_KEY: your-api-key-here
```

Migration script:
```bash
#!/bin/bash
# Migrate old config to new format
if [ -f ~/.alldebrid ]; then
    mkdir -p ~/.config/alldebrid
    echo "ALLDEBRID_API_KEY: $(cat ~/.alldebrid)" > ~/.config/alldebrid/config.yml
    echo "Migrated config to ~/.config/alldebrid/config.yml"
fi
```