# CLI Documentation

The AllDebrid CLI provides a complete command-line interface to the AllDebrid API with beautiful colored output and multiple format support.

## Installation

```bash
npm install -g alldebrid
# or
pnpm add -g alldebrid
```

## Global Options

### Authentication
```bash
# Priority order: flag > env variable > config file
alldebrid --apikey YOUR_KEY user info           # Highest priority
export ALLDEBRID_API_KEY=YOUR_KEY; alldebrid user info  # Medium priority  
# Config file (lowest priority) - see Configuration Guide
```

### Output Formats
```bash
alldebrid user info --format text    # Default: Beautiful colored text
alldebrid user info --format json    # JSON format
alldebrid user info --format yaml    # YAML format
```

### Help
```bash
alldebrid --help                     # Main help
alldebrid <command> --help           # Command-specific help  
alldebrid --version                  # Show version
```

## User Commands

### `alldebrid user info`
Get your account information including premium status, remaining days, and quotas.

```bash
alldebrid user info
alldebrid user info --format json
```

**Example output (text format):**
```
Username: myuser
Email: user@example.com
Is Premium: true
Premium Until: 2025-12-31T23:59:59.000+01:00
Fidelity Points: 1500
Limited Hosters Quotas:
  Ddl: 1000
  Mega: 5000
  ...
```

### `alldebrid user hosts`
List your available hosts and their status.

```bash
alldebrid user hosts
```

### `alldebrid user saved-links-list`
List all your saved links.

```bash
alldebrid user saved-links-list
alldebrid user saved-links-list --format json
```

### `alldebrid user saved-links-save <links...>`
Save one or more links to your account.

```bash
alldebrid user saved-links-save "https://example.com/file1" "https://example.com/file2"
```

### `alldebrid user recent-links-list`
List your recently unlocked links.

```bash
alldebrid user recent-links-list
```

## Magnet Commands

### `alldebrid magnet list [options]`
List your torrents/magnets with optional status filtering.

```bash
alldebrid magnet list                    # All magnets
alldebrid magnet list --status ready    # Only ready magnets
alldebrid magnet list --status active   # Only active magnets  
alldebrid magnet list --status expired  # Only expired magnets
alldebrid magnet list --status error    # Only error magnets
```

**Status options:** `active`, `ready`, `expired`, `error`

### `alldebrid magnet get <id>`
Get detailed information about a specific magnet including file list.

```bash
alldebrid magnet get 123456
alldebrid magnet get 123456 --format json
```

**Example output (text format):**
```
==================================================
[1]
==================================================
Id: 123456
Filename: Ubuntu 22.04 LTS
Status: Ready
Size: 4294967296
Upload Date: 2025-01-15T10:30:00.000+01:00
Files:
  [1] Name: ubuntu-22.04-desktop-amd64.iso
      Size: 4294967296
```

### `alldebrid magnet upload <magnet>`
Upload a magnet link or torrent hash.

```bash
alldebrid magnet upload "magnet:?xt=urn:btih:abcdef1234567890..."
```

### `alldebrid magnet delete <id>`
Delete a magnet from your account.

```bash
alldebrid magnet delete 123456
```

### `alldebrid magnet restart <id>`
Restart a failed or stuck magnet.

```bash
alldebrid magnet restart 123456
```

## Link Commands

### `alldebrid link info <url> [options]`
Get information about a link without unlocking it.

```bash
alldebrid link info "https://example.com/file"
alldebrid link info "https://example.com/file" --password mypass
```

**Options:**
- `-p, --password <password>` - Password for protected links

### `alldebrid link unlock <url>`
Unlock a premium link and get the direct download URL.

```bash
alldebrid link unlock "https://example.com/file"
```

## Host Commands

### `alldebrid hosts`
List all available file hosts supported by AllDebrid.

```bash
alldebrid hosts
alldebrid hosts --format json
```

### `alldebrid host-domains`
List all domains for supported hosts.

```bash
alldebrid host-domains
```

### `alldebrid host-priorities`
List host download priorities.

```bash
alldebrid host-priorities
```

## Output Formatting

### Text Format (Default)
The default text format provides beautiful, colorized output optimized for human readability:

- **Field names**: Bold green
- **Boolean values**: Green for true, red for false  
- **Numbers**: Yellow
- **URLs**: Blue and underlined
- **Dates**: Magenta
- **List separators**: Blue bars with item numbers

### JSON Format
Perfect for scripting and automation:

```bash
alldebrid user info --format json | jq '.username'
```

### YAML Format  
Clean and readable for configuration or documentation:

```bash
alldebrid magnet list --format yaml > my-magnets.yml
```

## Common Workflows

### Check Account Status
```bash
alldebrid user info --format text
```

### Download a File
```bash
# Get link info first (optional)
alldebrid link info "https://rapidgator.net/file/abc123"

# Unlock the link
alldebrid link unlock "https://rapidgator.net/file/abc123"
```

### Manage Torrents
```bash
# Upload a torrent
alldebrid magnet upload "magnet:?xt=urn:btih:..."

# Check status
alldebrid magnet list --status active

# Get detailed info when ready
alldebrid magnet get 123456

# Download files (copy URLs from output)
```

### Bulk Operations with JSON
```bash
# Get all ready magnets as JSON
alldebrid magnet list --status ready --format json > ready-magnets.json

# Process with jq
cat ready-magnets.json | jq '.[].files[].link' > download-urls.txt
```

## Error Handling

The CLI provides clear error messages with colored output:

- **Red text** for errors
- **Yellow text** for warnings  
- **Helpful suggestions** for common issues like missing API keys

Exit codes:
- `0` - Success
- `1` - General error (API error, network issue, etc.)

## Tips

1. **Use tab completion** - Most shells support command completion
2. **Combine with standard tools** - Pipe JSON output to `jq`, save YAML to files
3. **Set up config file** - Avoid typing API key every time
4. **Use status filters** - `--status ready` for completed torrents only
5. **Format for automation** - Use `--format json` in scripts