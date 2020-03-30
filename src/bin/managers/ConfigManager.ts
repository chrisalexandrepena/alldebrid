import Alldebrid from '../..';
import { ParsedCommand } from '../parser/CommandParser';
import { AvailableActions, AvailableOptions } from '../parser/CommandParser';
import { Manager } from '../entities/Manager';

const { agent, apikey } = AvailableOptions;

export = class ConfigManager extends Manager {
  constructor(alldebrid: Alldebrid) {
    super();
    this.alldebrid = alldebrid;
  }

  manage({ action, options }: ParsedCommand): void {
    switch (action) {
      // get
      case AvailableActions.get: {
        this.manageGet();
        break;
      }

      // set
      case AvailableActions.set: {
        this.manageSet({ options });
        break;
      }

      // reset
      case AvailableActions.reset: {
        this.manageReset();
        break;
      }
    }
  }

  private manageGet(): void {
    console.log(this.alldebrid.config);
  }

  private manageSet({ options }: ParsedCommand): void {
    this.alldebrid.setConfig(options ? options[agent] : undefined, options ? options[apikey] : undefined);
    this.saveConfig(this.alldebrid.config);
  }

  private manageReset(): void {
    this.saveConfig({ AGENT: undefined, API_KEY: undefined });
  }
};
