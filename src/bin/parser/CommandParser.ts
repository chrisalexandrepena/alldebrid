import commandLineArgs from 'command-line-args';
import { TorrentStatus } from '../../modules/torrents/entities/Torrent';

export type ParsedCommand = {
  action?: AvailableActions;
  object?: AvailableObjects;
  options?: { [option: string]: any };
};

export enum AvailableActions {
  upload = 'upload',
  get = 'get',
  set = 'set',
  reset = 'reset',
  delete = 'delete',
  debrid = 'debrid',
}

export enum AvailableObjects {
  torrent = 'torrent',
  torrents = 'torrents',
  magnet = 'magnet',
  magnets = 'magnets',
  config = 'config',
  links = 'links',
  link = 'link',
}

export enum AvailableOptions {
  verbose = 'verbose',
  agent = 'agent',
  apikey = 'apikey',
  id = 'id',
  regex = 'regex',
  status = 'status',
  link = 'link',
  password = 'password',
}

type CommandTree = { [action: string]: { [object: string]: string[] } };
let commandTree: CommandTree;
(() => {
  const { upload, get, set, reset, debrid } = AvailableActions;
  const deleteAction = AvailableActions.delete;
  const { torrent, torrents, magnet, magnets, config, link, links } = AvailableObjects;

  commandTree = {
    [get]: {
      [config]: [],
      [torrent]: ['id'],
      [torrents]: ['regex', 'status'],
    },
    [set]: {
      [config]: [AvailableOptions.agent, AvailableOptions.apikey],
    },
    [reset]: {
      [config]: [],
    },
    [upload]: {
      [magnets]: ['link'],
      [magnet]: ['link'],
    },
    [deleteAction]: {
      [torrents]: ['id'],
      [torrent]: ['id'],
    },
    [debrid]: {
      [link]: ['link', 'password'],
      [links]: ['link', 'password'],
    },
  };
})();

const parsingOptions: commandLineArgs.OptionDefinition[] = [
  { name: 'command', defaultOption: true, multiple: true, group: ['main'] },
  { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
  { name: 'agent', alias: 'a', group: ['config'] },
  { name: 'apikey', alias: 'k', group: ['config'] },
  { name: 'id', type: Number, multiple: true, group: ['torrent', 'torrents'] },
  { name: 'link', alias: 'l', multiple: true, group: ['magnet', 'magnets', 'link', 'links'] },
  { name: 'password', alias: 'p', group: ['link', 'links'] },
  {
    name: 'regex',
    type: (stringregex) => {
      const execRegex = /^\/(.+)\/([gi]{0,2}$)/gi.exec(stringregex);
      if (!execRegex) return new RegExp(stringregex);
      else return new RegExp(execRegex[1], execRegex[2]);
    },
    group: ['torrents'],
  },
  {
    name: 'status',
    type: (stringstatus) => {
      if (Object.keys(TorrentStatus).includes(stringstatus)) return TorrentStatus[stringstatus];
      else return undefined;
    },
    group: ['torrents'],
  },
];

class CommandParser {
  private _parsingOptions: commandLineArgs.OptionDefinition[];
  private _commandTree: CommandTree;

  constructor(options: commandLineArgs.OptionDefinition[], tree: CommandTree) {
    this._parsingOptions = options;
    this._commandTree = tree;
  }

  get parsingOptions() {
    return this._parsingOptions;
  }

  get commandTree() {
    return this._commandTree;
  }

  public parseCommand(): ParsedCommand {
    const command = commandLineArgs(this.parsingOptions);
    const action =
      command.main?.command && command.main?.command[0] && this.commandTree[command.main?.command[0]] ? command.main?.command[0] : undefined;
    const object =
      command.main?.command && action && command.main?.command[1] && this.commandTree[action][command.main?.command[1]]
        ? command.main?.command[1]
        : undefined;
    const options = {};
    if (command[object]) {
      for (const [key, value] of Object.entries(command[object])) {
        if (this.commandTree[action][object].includes(key)) options[key] = value;
      }
    }

    return {
      action,
      object,
      options,
    };
  }
}

const commandParser = new CommandParser(parsingOptions, commandTree);
export { commandParser as CommandParser };
