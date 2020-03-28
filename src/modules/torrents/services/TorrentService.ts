import request from 'request-promise-native';
import { Torrent, TorrentStatus } from '../entities/Torrent';
import { AlldebridConfig } from '../../..';

class TorrentService {
  async getTorrent({ BASE_URL, AGENT, API_KEY }: AlldebridConfig, torrentId: number): Promise<Torrent> {
    const reqOptions: request.Options = {
      uri: `${BASE_URL}/magnet/status`,
      method: 'GET',
      qs: Object.assign({ agent: AGENT, apikey: API_KEY, id: torrentId }),
      json: true,
    };
    const response = await request(reqOptions);

    if ((response.status = 'success')) {
      const magnet: Torrent = response.data.magnets;
      return magnet;
    }
    throw response.error;
  }

  async getTorrentList({ BASE_URL, AGENT, API_KEY }: AlldebridConfig, filters?: { regex?: RegExp; status?: TorrentStatus[] }): Promise<Torrent[]> {
    const reqOptions: request.Options = {
      uri: `${BASE_URL}/magnet/status`,
      method: 'GET',
      qs: { agent: AGENT, apikey: API_KEY },
      json: true,
    };
    const response = await request(reqOptions);

    if (response.status == 'success') {
      const torrents: Torrent[] = response.data.magnets;
      return filters
        ? torrents.filter((torrent) => {
            const regexFilter = filters.regex ? filters.regex.test(torrent.filename) : true;
            const statusFilter = filters.status ? filters.status.includes(torrent.status) : true;
            return regexFilter && statusFilter;
          })
        : torrents;
    }
    throw response.error;
  }

  postMagnets({ BASE_URL, AGENT, API_KEY }: AlldebridConfig, magnetLinks: string[]): request.RequestPromise<any> {
    const reqOptions: request.Options = {
      uri: `${BASE_URL}/magnet/upload`,
      method: 'POST',
      qs: { agent: AGENT, apikey: API_KEY },
      body: { magnets: magnetLinks },
      json: true,
    };
    return request(reqOptions);
  }

  deleteTorrent({ BASE_URL, AGENT, API_KEY }: AlldebridConfig, torrentId: number): request.RequestPromise<any> {
    const reqOptions: request.Options = {
      uri: `${BASE_URL}/magnet/delete`,
      method: 'GET',
      qs: { agent: AGENT, apikey: API_KEY, id: torrentId },
      json: true,
    };
    return request(reqOptions);
  };
}

export default new TorrentService();
