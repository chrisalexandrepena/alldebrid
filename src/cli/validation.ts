import { z } from "zod";
import chalk from "chalk";

// Configuration schema
export const CliConfigSchema = z.object({
  ALLDEBRID_API_KEY: z.string().optional(),
  BASE_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),
  OUTPUT_FORMAT: z.enum(["text", "json", "yaml"]).optional(),
}).strict();

export type CliConfig = z.infer<typeof CliConfigSchema>;

// CLI option schemas
export const OutputFormatSchema = z.enum(["text", "json", "yaml"]);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

export const MagnetStatusSchema = z.enum(["active", "ready", "expired", "error"]);

// Validation functions
export function validateOutputFormat(format: string): OutputFormat {
  try {
    return OutputFormatSchema.parse(format);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(chalk.red.bold("❌ Invalid output format:"), chalk.red(format));
      console.error(chalk.yellow("Valid formats: text, json, yaml"));
      process.exit(1);
    }
    throw error;
  }
}

export function validateMagnetStatus(status: string) {
  try {
    return MagnetStatusSchema.parse(status);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(chalk.red.bold("❌ Invalid status filter:"), chalk.red(status));
      console.error(chalk.yellow("Valid statuses: active, ready, expired, error"));
      process.exit(1);
    }
    throw error;
  }
}

export function validateConfig(rawConfig: unknown, configPath: string): CliConfig {
  try {
    return CliConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(chalk.red.bold(`❌ Invalid configuration in ${configPath}:`));
      error.issues.forEach((issue: z.ZodIssue) => {
        console.error(chalk.red(`  - ${issue.path.join('.')}: ${issue.message}`));
      });
      console.error(chalk.yellow("\n💡 Check the configuration guide for valid options."));
      process.exit(1);
    }
    throw error;
  }
}