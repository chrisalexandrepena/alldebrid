# Examples and Usage Guides

This document provides practical examples and common workflows for both the SDK and CLI.

## Table of Contents

- [SDK Examples](#sdk-examples)
- [CLI Examples](#cli-examples)
- [Common Workflows](#common-workflows)
- [Error Handling](#error-handling)
- [Integration Examples](#integration-examples)

## SDK Examples

### Basic Setup

```typescript
import { Alldebrid } from "alldebrid";

const client = new Alldebrid({
  apiKey: process.env.ALLDEBRID_API_KEY!,
  logLevel: "warn",
});
```

### User Management

#### Get User Information
```typescript
async function getUserInfo() {
  try {
    const user = await client.user.get();
    console.log(`Welcome ${user.username}!`);
    console.log(`Premium until: ${user.premiumUntil.toLocaleString()}`);
    console.log(`Fidelity points: ${user.fidelityPoints}`);
    
    if (!user.isPremium) {
      console.log("⚠️ Premium account required for full functionality");
    }
  } catch (error) {
    console.error("Failed to get user info:", error);
  }
}
```

#### Check Premium Status and Days Remaining
```typescript
async function checkPremiumStatus() {
  const user = await client.user.get();
  
  if (user.isPremium) {
    const daysRemaining = user.premiumUntil.diffNow('days').days;
    console.log(`✅ Premium active - ${Math.ceil(daysRemaining)} days remaining`);
  } else {
    console.log("❌ Premium expired or not active");
  }
}
```

#### Manage Saved Links
```typescript
async function manageSavedLinks() {
  // Save multiple links
  const linksToSave = [
    "https://rapidgator.net/file/abc123",
    "https://mega.nz/file/def456",
  ];
  
  await client.user.saveLinks(linksToSave);
  console.log(`✅ Saved ${linksToSave.length} links`);
  
  // List all saved links
  const savedLinks = await client.user.listSavedLinks();
  console.log(`📋 You have ${savedLinks.length} saved links`);
  
  // Delete specific links
  const linksToDelete = savedLinks
    .filter(link => link.filename.includes("old"))
    .map(link => link.link);
    
  if (linksToDelete.length > 0) {
    await client.user.deleteLinks(linksToDelete);
    console.log(`🗑️ Deleted ${linksToDelete.length} old links`);
  }
}
```

### Magnet/Torrent Management

#### Upload and Monitor Torrents
```typescript
async function uploadTorrent(magnetLink: string) {
  console.log("📤 Uploading magnet...");
  
  const results = await client.magnet.upload([magnetLink]);
  const result = results[0];
  
  if (result.success) {
    console.log(`✅ Upload successful! ID: ${result.id}`);
    
    // Monitor progress
    await monitorMagnet(result.id);
  } else {
    console.error(`❌ Upload failed: ${result.error.message}`);
  }
}

async function monitorMagnet(id: number) {
  console.log(`👀 Monitoring magnet ${id}...`);
  
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes with 10s intervals
  
  while (attempts < maxAttempts) {
    const magnet = await client.magnet.get(id);
    
    console.log(`Status: ${magnet.status} (${magnet.statusCode})`);
    
    if (magnet.status === "Ready") {
      console.log(`🎉 Magnet ready! ${magnet.files.length} files available`);
      
      // List download links
      magnet.files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${formatBytes(file.size)})`);
        if (file.link) {
          console.log(`   📥 ${file.link}`);
        }
      });
      break;
    } else if (magnet.status === "Error") {
      console.error(`❌ Magnet failed: ${magnet.error?.message || "Unknown error"}`);
      break;
    }
    
    // Wait 10 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 10000));
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    console.log("⏰ Monitoring timeout - magnet still processing");
  }
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
```

#### Batch Operations
```typescript
async function cleanupOldMagnets() {
  const magnets = await client.magnet.list();
  const oneWeekAgo = DateTime.now().minus({ weeks: 1 });
  
  const oldMagnets = magnets.filter(magnet => 
    magnet.status === "Error" || 
    (magnet.completionDate && magnet.completionDate < oneWeekAgo)
  );
  
  console.log(`🧹 Found ${oldMagnets.length} old magnets to cleanup`);
  
  for (const magnet of oldMagnets) {
    try {
      await client.magnet.delete(magnet.id);
      console.log(`🗑️ Deleted: ${magnet.filename}`);
    } catch (error) {
      console.error(`❌ Failed to delete ${magnet.filename}:`, error);
    }
  }
}
```

### Link Unlocking

#### Smart Link Processing
```typescript
async function processLinks(links: string[]) {
  for (const link of links) {
    try {
      // Get info first
      console.log(`🔍 Checking: ${link}`);
      const info = await client.link.getInfo(link);
      console.log(`📄 ${info.filename} (${formatBytes(info.filesize)})`);
      
      // Unlock the link
      const result = await client.link.debrid(link);
      console.log(`✅ Unlocked: ${result.link}`);
      
      // Save to recent links automatically happens via API
      
    } catch (error) {
      console.error(`❌ Failed to process ${link}:`, error);
    }
  }
}
```

#### Password-Protected Links
```typescript
async function unlockProtectedLink(url: string, password: string) {
  try {
    // Check if password is needed
    const info = await client.link.getInfo(url);
    console.log(`🔒 Protected file: ${info.filename}`);
    
    // Unlock with password
    const result = await client.link.debrid(url, password);
    console.log(`✅ Unlocked with password: ${result.link}`);
    
    return result.link;
  } catch (error) {
    console.error("❌ Password unlock failed:", error);
    throw error;
  }
}
```

### Host Information

#### Check Host Status
```typescript
async function checkHostAvailability(domain: string) {
  const hosts = await client.host.list();
  
  const host = hosts.hosts.find(h => 
    h.name.toLowerCase() === domain.toLowerCase()
  );
  
  if (host) {
    console.log(`🌐 ${host.name}: ${host.status}`);
    return host.status === "up";
  } else {
    console.log(`❓ Host ${domain} not found or not supported`);
    return false;
  }
}
```

## CLI Examples

### Daily Usage Patterns

#### Check Account Status
```bash
# Quick status check
alldebrid user info

# Get detailed info in JSON for scripting
alldebrid user info --format json | jq '.premiumUntil'
```

#### Torrent Management Workflow
```bash
# Upload a magnet
alldebrid magnet upload "magnet:?xt=urn:btih:abc123..."

# Check all active downloads
alldebrid magnet list --status active

# Get details for a specific magnet
alldebrid magnet get 123456

# When ready, extract download URLs
alldebrid magnet get 123456 --format json | jq -r '.files[].link' | grep -v null
```

#### Link Processing
```bash
# Check link info before unlocking
alldebrid link info "https://rapidgator.net/file/abc123"

# Unlock the link
alldebrid link unlock "https://rapidgator.net/file/abc123"

# Process password-protected link
alldebrid link info "https://protected-site.com/file" --password "mypass"
```

### Automation Scripts

#### Bash Download Manager
```bash
#!/bin/bash
# download-manager.sh

MAGNET_LINK="$1"

if [ -z "$MAGNET_LINK" ]; then
  echo "Usage: $0 <magnet-link>"
  exit 1
fi

echo "🚀 Starting download process..."

# Upload magnet
UPLOAD_RESULT=$(alldebrid magnet upload "$MAGNET_LINK" --format json)
MAGNET_ID=$(echo "$UPLOAD_RESULT" | jq -r '.[0].id')

if [ "$MAGNET_ID" = "null" ]; then
  echo "❌ Upload failed"
  exit 1
fi

echo "✅ Upload successful - ID: $MAGNET_ID"
echo "⏳ Waiting for completion..."

# Monitor until ready
while true; do
  STATUS=$(alldebrid magnet get "$MAGNET_ID" --format json | jq -r '.status')
  
  case "$STATUS" in
    "Ready")
      echo "🎉 Download ready!"
      # Extract download links
      alldebrid magnet get "$MAGNET_ID" --format json | \
        jq -r '.files[] | select(.link != null) | "\(.name): \(.link)"'
      break
      ;;
    "Error")
      echo "❌ Download failed"
      exit 1
      ;;
    *)
      echo "📊 Status: $STATUS"
      sleep 30
      ;;
  esac
done
```

#### Python Automation Example
```python
#!/usr/bin/env python3
import subprocess
import json
import time
import sys

def run_cli(cmd):
    """Run alldebrid CLI command and return JSON result"""
    result = subprocess.run(
        ["alldebrid"] + cmd + ["--format", "json"],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        raise Exception(f"CLI error: {result.stderr}")
    return json.loads(result.stdout)

def batch_upload_magnets(magnet_file):
    """Upload multiple magnets from file"""
    with open(magnet_file, 'r') as f:
        magnets = [line.strip() for line in f if line.strip()]
    
    print(f"📤 Uploading {len(magnets)} magnets...")
    
    for i, magnet in enumerate(magnets, 1):
        try:
            result = run_cli(["magnet", "upload", magnet])
            magnet_id = result[0]["id"]
            print(f"{i}/{len(magnets)} ✅ Uploaded: {magnet_id}")
        except Exception as e:
            print(f"{i}/{len(magnets)} ❌ Failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 batch_upload.py <magnet_file>")
        sys.exit(1)
    
    batch_upload_magnets(sys.argv[1])
```

## Common Workflows

### Complete Download Workflow

#### 1. Premium Links
```bash
# Check if host is supported
alldebrid hosts | grep -i rapidgator

# Get link information
alldebrid link info "https://rapidgator.net/file/abc123"

# Unlock and download
DIRECT_LINK=$(alldebrid link unlock "https://rapidgator.net/file/abc123" --format json | jq -r '.link')
curl -L -o "downloaded_file" "$DIRECT_LINK"
```

#### 2. Torrent Downloads
```bash
# Upload magnet
MAGNET_ID=$(alldebrid magnet upload "magnet:?xt=urn:btih:..." --format json | jq -r '.[0].id')

# Wait for processing (manual check)
alldebrid magnet get "$MAGNET_ID"

# When ready, get download links
alldebrid magnet get "$MAGNET_ID" --format json | jq -r '.files[].link' > download_links.txt

# Download all files
while IFS= read -r link; do
  if [ "$link" != "null" ]; then
    curl -L -O "$link"
  fi
done < download_links.txt
```

### Bulk Management

#### Clean Up Old Downloads
```bash
#!/bin/bash
# cleanup.sh

echo "🧹 Cleaning up old torrents..."

# Delete expired magnets
EXPIRED=$(alldebrid magnet list --status expired --format json)
echo "$EXPIRED" | jq -r '.[].id' | while read -r id; do
  alldebrid magnet delete "$id"
  echo "🗑️ Deleted expired magnet: $id"
done

# Delete error magnets
ERROR=$(alldebrid magnet list --status error --format json)
echo "$ERROR" | jq -r '.[].id' | while read -r id; do
  alldebrid magnet delete "$id"
  echo "🗑️ Deleted failed magnet: $id"
done

echo "✅ Cleanup complete"
```

## Error Handling

### SDK Error Handling
```typescript
import { 
  ApiError, 
  NetworkError, 
  ValidationError,
  ConfigurationError 
} from "alldebrid";

async function robustApiCall() {
  try {
    const result = await client.user.get();
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      // API-specific errors (invalid key, quota exceeded, etc.)
      console.error(`API Error [${error.code}]: ${error.message}`);
      
      if (error.code === "AUTH_BAD_APIKEY") {
        console.log("💡 Check your API key in the configuration");
      } else if (error.code === "AUTH_USER_BANNED") {
        console.log("🚫 Account is banned - contact AllDebrid support");
      }
    } else if (error instanceof NetworkError) {
      // Network/HTTP errors
      console.error(`Network Error: ${error.message}`);
      console.log("🌐 Check your internet connection and try again");
    } else if (error instanceof ValidationError) {
      // Response parsing errors
      console.error(`Validation Error: ${error.message}`);
      console.log("⚠️ API response format may have changed - check for SDK updates");
    } else if (error instanceof ConfigurationError) {
      // Client configuration errors
      console.error(`Config Error: ${error.message}`);
      console.log("⚙️ Check your client configuration");
    } else {
      // Unknown errors
      console.error("Unknown error:", error);
    }
    
    throw error; // Re-throw if needed
  }
}
```

### CLI Error Handling
```bash
#!/bin/bash
# robust-cli.sh

set -euo pipefail  # Exit on error

# Function to check if command succeeded
check_command() {
  if [ $? -eq 0 ]; then
    echo "✅ $1 successful"
  else
    echo "❌ $1 failed"
    exit 1
  fi
}

# Test API connectivity
echo "🔍 Testing API connection..."
alldebrid user info --format json > /dev/null 2>&1
check_command "API connection test"

# Robust magnet upload with retries
upload_with_retry() {
  local magnet="$1"
  local max_attempts=3
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "📤 Upload attempt $attempt/$max_attempts"
    
    if alldebrid magnet upload "$magnet" --format json; then
      echo "✅ Upload successful on attempt $attempt"
      return 0
    else
      echo "❌ Attempt $attempt failed"
      if [ $attempt -eq $max_attempts ]; then
        echo "💥 All upload attempts failed"
        return 1
      fi
      sleep 5
    fi
    
    ((attempt++))
  done
}
```

## Integration Examples

### GitHub Actions Workflow
```yaml
# .github/workflows/alldebrid.yml
name: AllDebrid Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install AllDebrid CLI
        run: npm install -g alldebrid
        
      - name: Backup saved links
        run: |
          alldebrid user saved-links-list --format yaml > saved-links-backup.yml
        env:
          ALLDEBRID_API_KEY: ${{ secrets.ALLDEBRID_API_KEY }}
          
      - name: Commit backup
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add saved-links-backup.yml
          git commit -m "Daily backup: $(date)" || exit 0
          git push
```

### Docker Container
```dockerfile
# Dockerfile
FROM node:20-alpine

# Install CLI globally
RUN npm install -g alldebrid

# Create app directory
WORKDIR /app

# Copy scripts
COPY scripts/ ./scripts/
RUN chmod +x scripts/*.sh

# Set default command
CMD ["./scripts/monitor.sh"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  alldebrid-monitor:
    build: .
    environment:
      - ALLDEBRID_API_KEY=${ALLDEBRID_API_KEY}
    volumes:
      - ./downloads:/downloads
    restart: unless-stopped
```

### Web Application Integration
```javascript
// Express.js endpoint
const express = require('express');
const { exec } = require('child_process');
const app = express();

app.post('/api/upload-magnet', async (req, res) => {
  const { magnetLink } = req.body;
  
  if (!magnetLink) {
    return res.status(400).json({ error: 'Magnet link required' });
  }
  
  const command = `alldebrid magnet upload "${magnetLink}" --format json`;
  
  exec(command, { env: { ...process.env } }, (error, stdout, stderr) => {
    if (error) {
      console.error('CLI error:', error);
      return res.status(500).json({ error: 'Upload failed' });
    }
    
    try {
      const result = JSON.parse(stdout);
      res.json({ success: true, data: result });
    } catch (parseError) {
      res.status(500).json({ error: 'Invalid response format' });
    }
  });
});
```

## Tips and Best Practices

1. **Always check API limits**: Monitor your usage to avoid hitting rate limits
2. **Use status filters**: `--status ready` for completed torrents saves bandwidth
3. **Implement retries**: Network requests can fail, especially for large operations
4. **Cache host information**: Host list doesn't change frequently
5. **Use configuration files**: Avoid hardcoding API keys in scripts
6. **Monitor disk space**: Downloads can be large, ensure adequate storage
7. **Log operations**: Keep track of successful/failed operations for debugging
8. **Use batch operations**: More efficient than individual API calls
9. **Handle timeouts**: Large torrents may take time to process
10. **Test with small files first**: Validate your workflow before processing large batches