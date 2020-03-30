import Alldebrid from '../..';
import { ParsedCommand } from '../parser/CommandParser';
import { AvailableActions, AvailableOptions } from '../parser/CommandParser';
import { Manager } from '../entities/Manager';

const { id } = AvailableOptions;

export = class TorrentManager extends Manager {
  constructor(alldebrid: Alldebrid) {
    super();
    this.alldebrid = alldebrid;
  }

  manage({ action, options }: ParsedCommand): void {
    if (!(this.alldebrid.config.AGENT && this.alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
    else
      switch (action) {
        // get
        case AvailableActions.get: {
          this.manageGet({ options });
          break;
        }

        // delete
        case AvailableActions.delete: {
          this.manageDelete({ options });
          break;
        }
      }
  }

  private async manageGet({ options }: ParsedCommand): Promise<void> {
    if (!options || !options[id]) console.error('You must specify a torrent id');
    else if (options[id].length > 1) console.error('You can only specify one id');
    else console.log(await this.alldebrid.getTorrent(options[id][0]));
  }

  private async manageDelete({ options }: ParsedCommand): Promise<void> {
    if (!options || !options[id]) console.error('You must specify a torrent id');
    else if (options[id].length > 1) console.error('You can only specify one id');
    else {
      await this.alldebrid.deleteTorrents(options[id]);
    }
  }
};
