import commandLineArgs from 'command-line-args';
import { TorrentStatus } from '../../../modules/torrents/entities/Torrent';

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
}

export enum AvailableObjects {
  torrent = 'torrent',
  torrents = 'torrents',
  magnet = 'magnet',
  magnets = 'magnets',
  config = 'config',
}

export enum AvailableOptions {
  verbose = 'verbose',
  agent = 'agent',
  apikey = 'apikey',
  id = 'id',
  regex = 'regex',
  status = 'status',
  magnetlinks = 'magnetlinks',
}

type CommandTree = { [action: string]: { [object: string]: string[] } };
const commandTree: CommandTree = {
  [AvailableActions.get]: {
    [AvailableObjects.config]: [],
    [AvailableObjects.torrent]: ['id'],
    [AvailableObjects.torrents]: ['regex', 'status'],
  },
  [AvailableActions.set]: {
    [AvailableObjects.config]: [AvailableOptions.agent, AvailableOptions.apikey],
  },
  [AvailableActions.reset]: {
    [AvailableObjects.config]: [],
  },
  [AvailableActions.upload]: {
    [AvailableObjects.magnets]: ['magnetlinks'],
    [AvailableObjects.magnet]: ['magnetlinks'],
  },
  [AvailableActions.delete]: {
    [AvailableObjects.torrents]: ['id'],
    [AvailableObjects.torrent]: ['id'],
  },
};

const parsingOptions: commandLineArgs.OptionDefinition[] = [
  { name: 'command', defaultOption: true, multiple: true, group: ['main'] },
  { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
  { name: 'agent', alias: 'a', group: ['config'] },
  { name: 'apikey', alias: 'k', group: ['config'] },
  { name: 'id', type: Number, multiple: true, group: ['torrent', 'torrents'] },
  { name: 'magnetlinks', alias: 'l', multiple: true, group: ['magnet', 'magnets'] },
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
