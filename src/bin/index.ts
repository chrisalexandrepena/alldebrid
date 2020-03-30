#!/usr/bin/env node

import { CommandParser, ParsedCommand, AvailableObjects, AvailableActions, AvailableOptions } from './parser/CommandParser';
import Alldebrid from '..';
import { existsSync, readFileSync } from 'fs';
import { configPath } from './entities/Manager';
import ConfigManager from './managers/ConfigManager';
import TorrentsManager from './managers/TorrentsManager';
import TorrentManager from './managers/TorrentManager';
import MagnetManager from './managers/MagnetManager';
import MagnetsManager from './managers/MagnetsManager';
import LinkManager from './managers/LinkManager';
import LinksManager from './managers/LinksManager';

if (existsSync(configPath)) {
  const { agent, apikey } = JSON.parse(readFileSync(configPath, { encoding: 'utf8' }));
  if (agent) process.env.ALLDEBRID_AGENT = agent;
  if (apikey) process.env.ALLDEBRID_APIKEY = apikey;
}
const alldebrid = new Alldebrid(process.env.ALLDEBRID_AGENT, process.env.ALLDEBRID_APIKEY);
const parsedCommand: ParsedCommand = CommandParser.parseCommand();
const { config, torrents } = AvailableObjects;

(async () => {
  switch (parsedCommand.object) {
    /**
     *
     * =========== CONFIG ===========
     *
     */

    case config: {
      const configManager = new ConfigManager(alldebrid);
      configManager.manage(parsedCommand);
      break;
    }

    /**
     *
     * =========== TORRENTS ===========
     *
     */

    case torrents: {
      const torrentsManager = new TorrentsManager(alldebrid);
      torrentsManager.manage(parsedCommand);
      break;
    }

    /**
     *
     * =========== TORRENT ===========
     *
     */

    case AvailableObjects.torrent: {
      const torrentManager = new TorrentManager(alldebrid);
      torrentManager.manage(parsedCommand);
      break;
    }

    /**
     *
     * =========== MAGNET ===========
     *
     */

    case AvailableObjects.magnet: {
      const magnetManager = new MagnetManager(alldebrid);
      magnetManager.manage(parsedCommand);
      break;
    }

    /**
     *
     * =========== MAGNETS ===========
     *
     */

    case AvailableObjects.magnets: {
      const magnetsManager = new MagnetsManager(alldebrid);
      magnetsManager.manage(parsedCommand);
      break;
    }

    /**
     *
     * =========== LINK ===========
     *
     */

    case AvailableObjects.link: {
      const linkManager = new LinkManager(alldebrid);
      linkManager.manage(parsedCommand);
      break;
    }

    /**
     *
     * =========== LINKS ===========
     *
     */

    case AvailableObjects.links: {
      const linksManager = new LinksManager(alldebrid);
      linksManager.manage(parsedCommand);
      break;
    }
  }
})();
