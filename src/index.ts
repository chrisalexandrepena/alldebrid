import TorrentService from './modules/torrents/services/TorrentService';
import { Torrent, TorrentStatus } from './modules/torrents/entities/Torrent';

export type AlldebridConfig = {
  BASE_URL: string;
  AGENT: string;
  API_KEY: string;
};

export class Alldebrid {
  public config: AlldebridConfig;

  constructor(agent: string, apiKey: string) {
    this.config = {
      BASE_URL: 'https://api.alldebrid.com/v4',
      AGENT: agent,
      API_KEY: apiKey,
    };
  }

  async getTorrent(torrentId: number): Promise<Torrent> {
    return await TorrentService.getTorrent(this.config, torrentId);
  }

  async getTorrentList(filters?: { regex?: RegExp; status?: TorrentStatus[] }): Promise<Torrent[]> {
    return await TorrentService.getTorrentList(this.config, filters);
  }

  async uploadTorrents(options: { magnetLinks?: string[]; torrentFilePaths?: string[] }): Promise<void> {
    const { magnetLinks, torrentFilePaths } = options;
    if (magnetLinks?.length) {
      await TorrentService.postMagnets(this.config, magnetLinks);
    }
    if (torrentFilePaths?.length) {
      // todo: torrent files upload
      console.error("Sorry torrent files aren't supported yet");
    }
  }
}
