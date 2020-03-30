#!/usr/bin/env node

import { CommandParser, ParsedCommand, AvailableObjects, AvailableActions, AvailableOptions } from './modules/commandParsing/CommandParser';
import Alldebrid from '..';
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
      if (!(alldebrid.config.AGENT && alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
      else
        switch (action) {
          // get
          case AvailableActions.get: {
            const response = options
              ? await alldebrid.getTorrentList({ regex: options[AvailableOptions.regex], status: options[AvailableOptions.status] })
              : await alldebrid.getTorrentList();
            console.log(response);
            break;
          }

          // delete
          case AvailableActions.delete: {
            if (!options || !options[AvailableOptions.id]) console.error('You must specify at least one torrent id');
            else {
              await alldebrid.deleteTorrents(options[AvailableOptions.id]);
            }
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
      if (!(alldebrid.config.AGENT && alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
      else
        switch (action) {
          // get
          case AvailableActions.get: {
            if (!options || !options[AvailableOptions.id]) console.error('You must specify a torrent id');
            else if (options[AvailableOptions.id].length > 1) console.error('You can only specify one id');
            else console.log(await alldebrid.getTorrent(options[AvailableOptions.id][0]));
            break;
          }

          // delete
          case AvailableActions.delete: {
            if (!options || !options[AvailableOptions.id]) console.error('You must specify a torrent id');
            else if (options[AvailableOptions.id].length > 1) console.error('You can only specify one id');
            else {
              await alldebrid.deleteTorrents(options[AvailableOptions.id]);
            }
            break;
          }
        }
      break;
    }

    /**
     *
     * =========== MAGNET ===========
     *
     */
    case AvailableObjects.magnet: {
      if (!(alldebrid.config.AGENT && alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
      else
        switch (action) {
          // upload
          case AvailableActions.upload: {
            if (!options || !options[AvailableOptions.link]) console.error('You must specify at least one magnet link');
            else if (options[AvailableOptions.link].length > 1) console.error('You can only specify one magnet link');
            else {
              const response = await alldebrid.uploadMagnets(options[AvailableOptions.link]);
              console.log(response);
            }
            break;
          }
        }
      break;
    }

    /**
     *
     * =========== MAGNETS ===========
     *
     */
    case AvailableObjects.magnets: {
      if (!(alldebrid.config.AGENT && alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
      else
        switch (action) {
          // upload
          case AvailableActions.upload: {
            if (!options || !options[AvailableOptions.link]) console.error('You must specify at least one magnet link');
            else {
              const response = await alldebrid.uploadMagnets(options[AvailableOptions.link]);
              console.log(response);
            }
            break;
          }
        }
      break;
    }

    /**
     *
     * =========== LINK ===========
     *
     */
    case AvailableObjects.link: {
      if (!(alldebrid.config.AGENT && alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
      else
        switch (action) {
          // debrid
          case AvailableActions.debrid: {
            if (!options || !options[AvailableOptions.link]) console.error('You must specify at least one link');
            else if (options[AvailableOptions.link].length > 1) console.error('You can only specify one link');
            else {
              const response = await alldebrid.debridLink(options[AvailableOptions.link][0], options[AvailableOptions.password]);
              console.log(response);
            }
            break;
          }
        }
      break;
    }

    /**
     *
     * =========== LINKS ===========
     *
     */
    case AvailableObjects.links: {
      if (!(alldebrid.config.AGENT && alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
      else
        switch (action) {
          // debrid
          case AvailableActions.debrid: {
            if (!options || !options[AvailableOptions.link]) console.error('You must specify at least one link');
            else {
              const response = await alldebrid.debridLinks(options[AvailableOptions.link], options[AvailableOptions.password]);
              console.log(response);
            }
            break;
          }
        }
      break;
    }
  }
})();
