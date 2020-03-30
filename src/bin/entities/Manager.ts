import Alldebrid from '../..';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { ParsedCommand } from '../parser/CommandParser';

export const configPath = resolve(__dirname, '../.tmp/config.json');

export abstract class Manager {
  protected alldebrid: Alldebrid;
  protected configPath = configPath;

  protected saveConfig(creds: { AGENT?: string; API_KEY?: string }) {
    if (!existsSync(resolve(__dirname, '../.tmp'))) mkdirSync(resolve(__dirname, '../.tmp'));
    const { AGENT, API_KEY } = creds;
    writeFileSync(this.configPath, JSON.stringify({ agent: AGENT, apikey: API_KEY }));
  }

  abstract manage(parsedCommand: ParsedCommand): void;
}
