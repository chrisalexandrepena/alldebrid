import Alldebrid from '../..';
import { ParsedCommand } from '../parser/CommandParser';
import { AvailableActions, AvailableOptions } from '../parser/CommandParser';
import { Manager } from '../entities/Manager';

const { id, regex, status } = AvailableOptions;

export = class TorrentsManager extends Manager {
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
    const response = options
      ? await this.alldebrid.getTorrentList({ regex: options[regex], status: options[status] })
      : await this.alldebrid.getTorrentList();
    console.log(response);
  }

  private async manageDelete({ options }: ParsedCommand): Promise<void> {
    if (!options || !options[id]) console.error('You must specify at least one torrent id');
    else {
      await this.alldebrid.deleteTorrents(options[id]);
    }
  }
};
