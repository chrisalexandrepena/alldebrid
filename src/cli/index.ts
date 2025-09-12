import { Command } from "commander";
import { Alldebrid } from "../sdk";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface CliConfig {
  apiKey?: string;
  agent?: string;
  baseUrl?: string;
}

function loadConfig(): CliConfig {
  const configPath = join(homedir(), ".alldebrid");
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, "utf8"));
    } catch {
      // Ignore config file errors
    }
  }
  return {};
}

function createClient(): Alldebrid {
  const config = loadConfig();
  const apiKey = process.env.ALLDEBRID_API_KEY || config.apiKey;
  
  if (!apiKey) {
    console.error("Error: API key required. Set ALLDEBRID_API_KEY environment variable or create ~/.alldebrid config file.");
    process.exit(1);
  }

  return new Alldebrid({
    apiKey,
    agent: config.agent || "alldebrid-cli",
    baseUrl: config.baseUrl,
    logLevel: "error"
  });
}

async function main() {
  const program = new Command();
  
  program
    .name("alldebrid")
    .description("AllDebrid CLI - Command line interface for AllDebrid")
    .version("2.0.0");

  // User commands
  const userCmd = program
    .command("user")
    .description("User-related commands");

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
        const result = await client.magnet.delete([id]);
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
        const result = await client.magnet.restart([id]);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Link commands
  const linkCmd = program
    .command("link")
    .description("Link-related commands");

  linkCmd
    .command("unlock")
    .description("Unlock a premium link")
    .argument("<url>", "URL to unlock")
    .action(async (url: string) => {
      try {
        const client = createClient();
        const result = await client.link.unlock(url);
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
