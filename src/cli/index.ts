import { program } from "commander";
import { Alldebrid } from "../sdk";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import * as yaml from "js-yaml";
import { DEFAULT_BASE_URL } from "../sdk/core/http/client";

type CliConfig = {
  ALLDEBRID_API_KEY?: string;
  BASE_URL?: string;
  LOG_LEVEL?: "error" | "fatal" | "warn" | "info" | "debug" | "trace";
};

function loadConfig(): CliConfig {
  // Config file locations in order of preference
  const XDG_CONFIG_HOME =
    process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  const configPaths = [
    // XDG config directory (Linux/Unix standard)
    join(XDG_CONFIG_HOME, "alldebrid", "config.yml"),
    join(XDG_CONFIG_HOME, "alldebrid", "config.yaml"),
    join(homedir(), ".alldebrid.yml"),
    join(homedir(), ".alldebrid.yaml"),
    join(homedir(), ".alldebrid", "config.yml"),
    join(homedir(), ".alldebrid", "config.yaml"),
    // Application data directory (Windows)
    process.env.APPDATA
      ? join(process.env.APPDATA, "alldebrid", "config.yml")
      : null,
  ].filter(Boolean) as string[];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, "utf8");
        // Try YAML first, fallback to JSON for legacy support
        return yaml.load(content) as CliConfig;
      } catch {
        // Ignore config file errors and try next location
      }
    }
  }
  return {};
}

function createClient(): Alldebrid {
  const config = loadConfig();
  const apiKey = process.env.ALLDEBRID_API_KEY || config.ALLDEBRID_API_KEY;

  if (!apiKey) {
    console.error(`Error: API key required.
Options:
1. Set ALLDEBRID_API_KEY environment variable
2. Create a config file at one of these locations:
   - ~/.config/alldebrid/config.yml (recommended)
   - %APPDATA%/alldebrid/config.yml (Windows)
   - ~/.alldebrid/config.yml`);
    process.exit(1);
  }

  return new Alldebrid({
    apiKey,
    baseUrl: config.BASE_URL ?? DEFAULT_BASE_URL,
    logLevel: config.LOG_LEVEL ?? "error",
  });
}

async function main() {
  program
    .name("alldebrid")
    .description("AllDebrid CLI - Command line interface for AllDebrid")
    .version("2.0.0");

  // User commands
  const userCmd = program.command("user").description("User-related commands");

  userCmd
    .command("info")
    .description("Show user information")
    .action(async () => {
      try {
        const client = createClient();
        const user = await client.user.get();
        console.log(JSON.stringify(user, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  userCmd
    .command("hosts")
    .description("List user hosts")
    .action(async () => {
      try {
        const client = createClient();
        const hosts = await client.user.getHosts();
        console.log(JSON.stringify(hosts, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Hosts command
  program
    .command("hosts")
    .description("List all available hosts")
    .action(async () => {
      try {
        const client = createClient();
        const hosts = await client.host.list();
        console.log(JSON.stringify(hosts, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Magnet commands
  const magnetCmd = program
    .command("magnet")
    .description("Magnet-related commands");

  magnetCmd
    .command("list")
    .description("List your magnets")
    .action(async () => {
      try {
        const client = createClient();
        const magnets = await client.magnet.list();
        console.log(JSON.stringify(magnets, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  magnetCmd
    .command("upload")
    .description("Upload a magnet link")
    .argument("<magnet>", "Magnet link to upload")
    .action(async (magnet: string) => {
      try {
        const client = createClient();
        const result = await client.magnet.upload([magnet]);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  magnetCmd
    .command("delete")
    .description("Delete a magnet")
    .argument("<id>", "Magnet ID to delete", parseInt)
    .action(async (id: number) => {
      try {
        const client = createClient();
        const result = await client.magnet.delete(id);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  magnetCmd
    .command("restart")
    .description("Restart a magnet")
    .argument("<id>", "Magnet ID to restart", parseInt)
    .action(async (id: number) => {
      try {
        const client = createClient();
        const result = await client.magnet.restart(id);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Link commands
  const linkCmd = program.command("link").description("Link-related commands");

  linkCmd
    .command("unlock")
    .description("Unlock a premium link")
    .argument("<url>", "URL to unlock")
    .action(async (url: string) => {
      try {
        const client = createClient();
        const result = await client.link.debrid(url);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
