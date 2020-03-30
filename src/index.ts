import TorrentService from './modules/torrents/services/TorrentService';
import LinkService from './modules/links/services/LinkService';
import { Torrent, TorrentStatus } from './modules/torrents/entities/Torrent';
import moment from 'moment';
import { Magnet } from './modules/torrents/entities/Magnet';
import { FailedMagnetUpload } from './modules/torrents/entities/FailedMagnetUpload';
import { Link } from './modules/links/entities/Link';

export type AlldebridConfig = {
  BASE_URL: string;
  AGENT?: string;
  API_KEY?: string;
};

export default class Alldebrid {
  private _timeBetweenCalls = 1500;
  private _lastCall: moment.Moment;
  private _config: AlldebridConfig;

  constructor(agent?: string, apiKey?: string) {
    this._config = {
      BASE_URL: 'https://api.alldebrid.com/v4',
      AGENT: agent ? agent : undefined,
      API_KEY: apiKey ? apiKey : undefined,
    };
  }

  private async checkTimer(): Promise<void> {
    if (!this._lastCall) return;
    const diff = moment().diff(this._lastCall);
    if (diff < this._timeBetweenCalls) await new Promise((resolve) => setTimeout(resolve, diff));
    return;
  }

  public get config() {
    return this._config;
  }

  setConfig(agent?: string, apiKey?: string): void {
    if (agent) this.config.AGENT = agent;
    if (apiKey) this.config.API_KEY = apiKey;
  }

  async getTorrent(torrentId: number): Promise<Torrent> {
    if (!(this.config.AGENT && this.config.API_KEY)) {
      throw new Error('Please set agent and api key first');
    }
    await this.checkTimer();

    const response = await TorrentService.getTorrent(this.config, torrentId);
    this._lastCall = moment();
    return response;
  }

  async getTorrentList(filters?: { regex?: RegExp; status?: TorrentStatus[] }): Promise<Torrent[]> {
    if (!(this.config.AGENT && this.config.API_KEY)) {
      throw new Error('Please set agent and api key first');
    }
    await this.checkTimer();

    const response = await TorrentService.getTorrentList(this.config, filters);
    this._lastCall = moment();
    return response;
  }

  async uploadMagnets(magnetLinks: string[]): Promise<{ magnets: Magnet[]; errors: FailedMagnetUpload[] }> {
    if (!(this.config.AGENT && this.config.API_KEY)) {
      throw new Error('Please set agent and api key first');
    }
    await this.checkTimer();

    const response = await TorrentService.postMagnets(this.config, magnetLinks);
    this._lastCall = moment();

    if (response.status === 'success') {
      return response.data.magnets.reduce(
        (accumulator, current) => {
          if (current.error) accumulator.errors.push({ magnet: current.magnet, error: current.error.message });
          else accumulator.magnets.push(current);
          return accumulator;
        },
        { magnets: [], errors: [] }
      );
    } else {
      return { magnets: [], errors: [response.error.message] };
    }
  }

  async deleteTorrents(torrentIds: number[]): Promise<void> {
    if (!(this.config.AGENT && this.config.API_KEY)) {
      throw new Error('Please set agent and api key first');
    }
    await this.checkTimer();

    for (const torrentId of torrentIds) {
      console.log(`---- deleting torrent n°${torrentId} ----`);

      const response = await TorrentService.deleteTorrent(this.config, torrentId);
      this._lastCall = moment();

      if (response.status === 'success') console.log(`success`);
      else console.error(`error: ${response.error.message}`);
      console.log('----------');

      await this.checkTimer();
    }
  }

  async debridLink(link: string, password?: string): Promise<Link> {
    if (!(this.config.AGENT && this.config.API_KEY)) {
      throw new Error('Please set agent and api key first');
    }
    await this.checkTimer();

    const response = await LinkService.debridLink(this.config, link, password);
    this._lastCall = moment();

    return response;
  }

  async debridLinks(links: string[], password?: string): Promise<Link[]> {
    if (!(this.config.AGENT && this.config.API_KEY)) {
      throw new Error('Please set agent and api key first');
    }
    await this.checkTimer();

    const response = await LinkService.debridLinks(this.config, links, password);
    this._lastCall = moment();

    if (response.error?.length) console.error(`The following errors have occured:\n${JSON.stringify(response.error, null, 2)}`);
    return response.valid;
  }
}
