import Alldebrid from '../..';
import { ParsedCommand } from '../parser/CommandParser';
import { AvailableActions, AvailableOptions } from '../parser/CommandParser';
import { Manager } from '../entities/Manager';

const { link } = AvailableOptions;

export = class MagnetManager extends Manager {
  constructor(alldebrid: Alldebrid) {
    super();
    this.alldebrid = alldebrid;
  }

  manage({ action, options }: ParsedCommand): void {
    if (!(this.alldebrid.config.AGENT && this.alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
    else
      switch (action) {
        // upload
        case AvailableActions.upload: {
          this.manageUpload({options})
          break;
        }
      }
  }

  private async manageUpload({ options }: ParsedCommand): Promise<void> {
    if (!options || !options[link]) console.error('You must specify at least one magnet link');
    else if (options[link].length > 1) console.error('You can only specify one magnet link');
    else {
      const response = await this.alldebrid.uploadMagnets(options[link]);
      console.log(response);
    }
  }
};
