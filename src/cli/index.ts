import { program } from "commander";
import { Alldebrid } from "../sdk";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import * as yaml from "js-yaml";
import chalk from "chalk";
import { DEFAULT_BASE_URL } from "../sdk/core/http/client";

type CliConfig = {
  ALLDEBRID_API_KEY?: string;
  BASE_URL?: string;
  LOG_LEVEL?: "error" | "fatal" | "warn" | "info" | "debug" | "trace";
  OUTPUT_FORMAT?: "text" | "json" | "yaml";
};

type OutputFormat = "text" | "json" | "yaml";


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

function formatOutput(data: unknown, format: OutputFormat): string {
  switch (format) {
    case "json":
      return JSON.stringify(data, null, 2);
    case "yaml":
      return yaml.dump(data, { indent: 2, lineWidth: -1 });
    case "text":
    default:
      if (typeof data === "object" && data !== null) {
        return formatAsText(data);
      }
      return String(data);
  }
}

function formatAsText(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return chalk.yellow("No items found.");
    
    // For arrays, create a cleaner table-like format with colors
    return data.map((item, index) => {
      if (typeof item === "object" && item !== null) {
        const formatted = formatAsText(item);
        const separator = chalk.blue("=".repeat(50));
        const itemNumber = chalk.bold.cyan(`[${index + 1}]`);
        return `\n${separator}\n${itemNumber}\n${separator}\n${formatted}`;
      }
      return `${chalk.cyan(`${index + 1}.`)} ${formatAsText(item)}`;
    }).join("\n\n");
  }
  
  if (typeof data === "object" && data !== null) {
    // Handle DateTime objects from Luxon
    if ('toISO' in data && typeof data.toISO === 'function') {
      return (data as any).toISO();
    }
    
    // Handle Date objects
    if (data instanceof Date) {
      return data.toISOString();
    }
    
    const entries = Object.entries(data as Record<string, unknown>);
    return entries
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, " $1")
          .replace(/^./, str => str.toUpperCase())
          .trim();
        
        if (typeof value === "object" && value !== null) {
          // Handle DateTime/Date objects inline
          if ('toISO' in value && typeof (value as any).toISO === 'function') {
            return `${chalk.bold.green(formattedKey)}: ${chalk.magenta((value as any).toISO())}`;
          }
          if (value instanceof Date) {
            return `${chalk.bold.green(formattedKey)}: ${chalk.magenta(value.toISOString())}`;
          }
          return `${chalk.bold.green(formattedKey)}:\n${formatAsText(value).split('\n').map(line => `  ${line}`).join('\n')}`;
        }
        
        // Add colors based on value type
        let coloredValue;
        if (typeof value === 'boolean') {
          coloredValue = value ? chalk.green('true') : chalk.red('false');
        } else if (typeof value === 'number') {
          coloredValue = chalk.yellow(String(value));
        } else if (typeof value === 'string') {
          // Color URLs differently
          if (value.startsWith('http')) {
            coloredValue = chalk.blue.underline(value);
          } else {
            coloredValue = chalk.white(value);
          }
        } else {
          coloredValue = chalk.gray(String(value));
        }
        
        return `${chalk.bold.green(formattedKey)}: ${coloredValue}`;
      })
      .join("\n");
  }
  
  return String(data);
}

function getOutputFormat(): OutputFormat {
  const config = loadConfig();
  return program.opts().format || config.OUTPUT_FORMAT || "text";
}

function getApiKey(): string {
  const config = loadConfig();
  return program.opts().apiKey || process.env.ALLDEBRID_API_KEY || config.ALLDEBRID_API_KEY || "";
}

function createClient(): Alldebrid {
  const config = loadConfig();
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(chalk.red.bold('Error: API key required.\n'));
    console.error(chalk.yellow('Options (in order of priority):'));
    console.error(chalk.cyan('1. Use --api-key flag: ') + chalk.white('alldebrid --api-key YOUR_KEY user info'));
    console.error(chalk.cyan('2. Set ALLDEBRID_API_KEY environment variable'));
    console.error(chalk.cyan('3. Create a config file at one of these locations:'));
    console.error(chalk.gray('   - ~/.config/alldebrid/config.yml (recommended)'));
    console.error(chalk.gray('   - %APPDATA%/alldebrid/config.yml (Windows)'));
    console.error(chalk.gray('   - ~/.alldebrid/config.yml\n'));
    console.error(chalk.yellow('Config file format (YAML):'));
    console.error(chalk.green('ALLDEBRID_API_KEY: ') + chalk.white('your-api-key-here'));
    console.error(chalk.green('BASE_URL: ') + chalk.gray('https://api.alldebrid.com/v4  # optional'));
    console.error(chalk.green('LOG_LEVEL: ') + chalk.gray('error  # optional'));
    console.error(chalk.green('OUTPUT_FORMAT: ') + chalk.gray('text  # optional (text|json|yaml)'));
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
    .version("2.0.0")
    .option("-f, --format <format>", "Output format (text|json|yaml)")
    .option("-k, --api-key <key>", "AllDebrid API key");

  // User commands
  const userCmd = program.command("user").description("User-related commands");

  userCmd
    .command("info")
    .description("Show user information")
    .action(async () => {
      try {
        const client = createClient();
        const user = await client.user.get();
        const format = getOutputFormat();
        console.log(formatOutput(user, format));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
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
        const format = getOutputFormat();
        console.log(formatOutput(hosts, format));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
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
        const format = getOutputFormat();
        console.log(formatOutput(hosts, format));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
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
        const format = getOutputFormat();
        console.log(formatOutput(magnets, format));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
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
        const format = getOutputFormat();
        console.log(formatOutput(result, format));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
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
        const format = getOutputFormat();
        console.log(formatOutput(result, format));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
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
        const format = getOutputFormat();
        console.log(formatOutput(result, format));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
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
        const format = getOutputFormat();
        console.log(formatOutput(result, format));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
