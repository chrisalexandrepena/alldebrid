import Alldebrid from '../..';
import { ParsedCommand } from '../parser/CommandParser';
import { AvailableActions, AvailableOptions } from '../parser/CommandParser';
import { Manager } from '../entities/Manager';

const { link, password } = AvailableOptions;

export = class LinkManager extends Manager {
  constructor(alldebrid: Alldebrid) {
    super();
    this.alldebrid = alldebrid;
  }

  manage({ action, options }: ParsedCommand): void {
    if (!(this.alldebrid.config.AGENT && this.alldebrid.config.API_KEY)) console.error('Please set agent and api key first');
    else
      switch (action) {
        // debrid
        case AvailableActions.debrid: {
          this.manageDebrid({ options });
          break;
        }
      }
  }

  private async manageDebrid({ options }: ParsedCommand): Promise<void> {
    if (!options || !options[link]) console.error('You must specify at least one link');
    else if (options[link].length > 1) console.error('You can only specify one link');
    else {
      const response = await this.alldebrid.debridLink(options[link][0], options[password]);
      console.log(response);
    }
  }
};
