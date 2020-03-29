#!/usr/bin/env node

import { CommandParser, ParsedCommand, AvailableObjects, AvailableActions, AvailableOptions } from './modules/commandParsing/CommandParser';
import { Alldebrid } from '..';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const configPath = join(__dirname, '.tmp/config.json');
function saveConfig(creds: { AGENT?: string; API_KEY?: string }) {
  if (!existsSync(join(__dirname, '.tmp'))) mkdirSync(join(__dirname, '.tmp'));
  const { AGENT, API_KEY } = creds;
  writeFileSync(configPath, JSON.stringify({ agent: AGENT, apikey: API_KEY }));
}

if (existsSync(configPath)) {
  const { agent, apikey } = JSON.parse(readFileSync(configPath, { encoding: 'utf8' }));
  if (agent) process.env.ALLDEBRID_AGENT = agent;
  if (apikey) process.env.ALLDEBRID_APIKEY = apikey;
}
const alldebrid = new Alldebrid(process.env.ALLDEBRID_AGENT, process.env.ALLDEBRID_APIKEY);
const { action, object, options }: ParsedCommand = CommandParser.parseCommand();

(async () => {
  switch (object) {
    /**
     *
     * =========== CONFIG ===========
     *
     */

    case AvailableObjects.config: {
      switch (action) {
        // get
        case AvailableActions.get: {
          console.log(alldebrid.config);
          break;
        }
        // set
        case AvailableActions.set: {
          const agent: AvailableOptions = options ? options[AvailableOptions.agent] : undefined;
          const apikey: AvailableOptions = options ? options[AvailableOptions.apikey] : undefined;

          alldebrid.setConfig(agent, apikey);
          saveConfig(alldebrid.config);
          break;
        }
        // reset
        case AvailableActions.reset: {
          saveConfig({ AGENT: undefined, API_KEY: undefined });
          break;
        }
      }
      break;
    }

    /**
     *
     * =========== TORRENTS ===========
     *
     */
    case AvailableObjects.torrents: {
      switch (action) {
        case AvailableActions.get: {
          const response = options
            ? await alldebrid.getTorrentList({ regex: options[AvailableOptions.regex], status: options[AvailableOptions.status] })
            : await alldebrid.getTorrentList();
          console.log(response);
          break;
        }
      }
      break;
    }

    /**
     *
     * =========== TORRENT ===========
     *
     */
    case AvailableObjects.torrent: {
      switch (action) {
        case AvailableActions.get: {
          if (!options || !options[AvailableOptions.id]) console.error('You must specify a torrent id');
          else console.log(await alldebrid.getTorrent(options[AvailableOptions.id]));
          break;
        }
      }
      break;
    }
  }
})();
