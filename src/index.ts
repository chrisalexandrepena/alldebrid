import TorrentService from './modules/torrents/services/TorrentService';
import { Torrent, TorrentStatus } from './modules/torrents/entities/Torrent';
import moment from 'moment';

export type AlldebridConfig = {
  BASE_URL: string;
  AGENT: string;
  API_KEY: string;
};

export class Alldebrid {
  private TIME_BETWEEN_CALLS = 1500;
  private lastCall: moment.Moment;
  public config: AlldebridConfig;

  constructor(agent: string, apiKey: string) {
    this.config = {
      BASE_URL: 'https://api.alldebrid.com/v4',
      AGENT: agent,
      API_KEY: apiKey,
    };
  }

  private async checkTimer(): Promise<void> {
    if (!this.lastCall) return;
    const diff = moment().diff(this.lastCall);
    if (diff < this.TIME_BETWEEN_CALLS) await new Promise((resolve) => setTimeout(resolve, diff));
    return;
  }

  async getTorrent(torrentId: number): Promise<Torrent> {
    await this.checkTimer();
    const response = await TorrentService.getTorrent(this.config, torrentId);
    this.lastCall = moment();
    return response;
  }

  async getTorrentList(filters?: { regex?: RegExp; status?: TorrentStatus[] }): Promise<Torrent[]> {
    await this.checkTimer();
    const response = await TorrentService.getTorrentList(this.config, filters);
    this.lastCall = moment();
    return response;
  }

  async uploadTorrents(options: { magnetLinks?: string[]; torrentFilePaths?: string[] }): Promise<void> {
    await this.checkTimer();
    const { magnetLinks, torrentFilePaths } = options;
    if (magnetLinks?.length) {
      const response = await TorrentService.postMagnets(this.config, magnetLinks);
      this.lastCall = moment();

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
    for (const torrentId of torrentIds) {
      console.log(`---- deleting torrent n°${torrentId} ----`);

      const response = await TorrentService.deleteTorrent(this.config, torrentId);
      this.lastCall = moment();

      if (response.status === 'success') console.log(`success`);
      else console.error(`error: ${response.error.message}`);

      await this.checkTimer();
    }
  }
}
