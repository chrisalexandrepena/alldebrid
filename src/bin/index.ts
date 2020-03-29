#!/usr/bin/env node
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { Alldebrid, AlldebridConfig } from '..';
import { existsSync, readFileSync, fstat, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

enum possibleCommands {
  upload = 'upload',
  get = 'get',
  set = 'set',
  reset = 'reset'
}
enum possibleObjects {
  torrent = 'torrent',
  torrents = 'torrents',
  config= 'config'
}

const configPath = join(__dirname, '.tmp/config.json');
function saveConfig(creds: AlldebridConfig) {
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

const commandOptions = commandLineArgs([
  { name: 'command', defaultOption: true, multiple: true, group: ['main'] },
  { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
  { name: 'magnetlink', alias: 'm', group: ['magnet', 'get'] },
  { name: 'agent', alias: 'a', group: ['config'] },
  { name: 'apikey', alias: 'k', group: ['config'] },
]);

const command = commandOptions.main.command;
if (command) {
  switch (command[0]) {
    case possibleCommands.get: {
      if (command[1]) {
        switch (command[1]) {
          case 'config': {
            console.log(alldebrid.config);
            break;
          }
        }
      }
      break;
    }
    case possibleCommands.set: {
      if (command[1]) {
        switch (command[1]) {
          case 'config': {
            const { agent, apikey } = commandOptions.config;
            alldebrid.setConfig(agent, apikey);
            saveConfig(alldebrid.config);
            break;
          }
        }
      }
    }
  }
}
