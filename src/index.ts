import TorrentService from './modules/torrents/services/TorrentService';
import { Torrent, TorrentStatus } from './modules/torrents/entities/Torrent';
import moment from 'moment';

export type AlldebridConfig = {
  BASE_URL: string;
  AGENT?: string;
  API_KEY?: string;
};

export class Alldebrid {
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

  async uploadMagnet(magnetLink: string): Promise<void> {
    if (!(this.config.AGENT && this.config.API_KEY)) {
      throw new Error('Please set agent and api key first');
    }
    await this.checkTimer();

    const response = await TorrentService.postMagnets(this.config, [magnetLink]);
    this._lastCall = moment();

    if (response.data.magnets[0].error) {
      console.error(response.data.magnets[0].error.message);
    } else {
      console.log('Torrent was uploaded successfuly');
    }
  }

  async uploadTorrents(options: { magnetLinks?: string[]; torrentFilePaths?: string[] }): Promise<void> {
    if (!(this.config.AGENT && this.config.API_KEY)) {
      throw new Error('Please set agent and api key first');
    }
    await this.checkTimer();

    const { magnetLinks, torrentFilePaths } = options;
    if (magnetLinks?.length) {
      const response = await TorrentService.postMagnets(this.config, magnetLinks);
      this._lastCall = moment();

      if (response.status === 'success') {
        const errors = response.data.files.filter((file) => file.error);
        console.log('Magnet links were uploaded successfuly');
        if (errors.length) {
          console.error('But the following torrents returned errors:\n');
          console.error(errors.map((error) => error.file));
        }
      }
    }
    if (torrentFilePaths?.length) {
      // todo: torrent files upload
      console.error("Sorry torrent files aren't supported yet");
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

      await this.checkTimer();
    }
  }
}
