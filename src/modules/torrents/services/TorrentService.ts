import request from 'request-promise-native';
import { Torrent, TorrentStatus } from '../entities/Torrent';
import { AlldebridConfig } from '../../global/entities/AlldebridConfig';

class TorrentService {
  async getTorrent({ BASE_URL, AGENT, API_KEY }: AlldebridConfig, torrentId: number): Promise<Torrent> {
    const reqOptions: request.Options = {
      uri: `${BASE_URL}/magnet/status`,
      method: 'GET',
      qs: Object.assign({ agent: AGENT, apikey: API_KEY, id: torrentId }),
      json: true,
    };
    const response = await request(reqOptions);

    if (response.status === 'success') {
      const magnet: Torrent = response.data.magnets;
      return magnet;
    }
    throw response.error;
  }

  async getTorrentList({ BASE_URL, AGENT, API_KEY }: AlldebridConfig, filters?: { regex?: string; status?: TorrentStatus[] }): Promise<Torrent[]> {
    const reqOptions: request.Options = {
      uri: `${BASE_URL}/magnet/status`,
      method: 'GET',
      qs: { agent: AGENT, apikey: API_KEY },
      json: true,
    };
    const response = await request(reqOptions);
    const regex = filters?.regex && /^\/(.+)\/([a-zA-Z]*$)/gi.test(filters.regex) ? /^\/(.+)\/([a-zA-Z]*$)/gi.exec(filters.regex) : undefined;

    if (response.status === 'success') {
      const torrents: Torrent[] = response.data.magnets;
      return filters
        ? torrents.filter((torrent) => {
            let regexFilter = regex ? new RegExp(regex[1], regex[2].length ? regex[2] : undefined).test(torrent.filename) : true;
            if (!regex && filters.regex) regexFilter = new RegExp(filters.regex).test(torrent.filename);
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
      method: 'GET',
      qs: { agent: AGENT, apikey: API_KEY, magnets: magnetLinks },
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
  }
}

export = new TorrentService();
