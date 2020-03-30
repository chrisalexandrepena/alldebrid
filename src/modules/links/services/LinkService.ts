import { LinkStatus } from '../entities/LinkStatus';
import { UnsupportedLinkStatus } from '../entities/UnsupportedLinkStatus';
import { AlldebridConfig } from '../../../index';
import { Link } from '../entities/Link';
import request from 'request-promise-native';

class LinkService {
  private async checkLinks(
    { BASE_URL, AGENT, API_KEY }: AlldebridConfig,
    links: string[],
    password?: string
  ): Promise<{ valid: LinkStatus[]; error: UnsupportedLinkStatus[] }> {
    const reqOptions: request.Options = {
      uri: `${BASE_URL}/link/infos`,
      method: 'GET',
      qs: Object.assign({ agent: AGENT, apikey: API_KEY, link: links }, password ? password : {}),
      json: true,
    };
    const response = await request(reqOptions);

    if (response.status !== 'success') {
      throw response.error;
    } else {
      return response.data.infos.reduce(
        (accumulator, current) => {
          accumulator[current.error ? 'error' : 'valid'].push(current);
          return accumulator;
        },
        { valid: [], error: [] }
      );
    }
  }

  private async checkDelayedLink({ BASE_URL, AGENT, API_KEY }: AlldebridConfig, delayId: number): Promise<Link> {
    let link;
    while (!link || !link.link) {
      const reqOptions: request.Options = {
        uri: `${BASE_URL}/link/delayed`,
        method: 'GET',
        qs: { agent: AGENT, apikey: API_KEY, id: delayId },
        json: true,
      };
      const response = await request(reqOptions);

      if (response.status !== 'success') throw response.error;
      else {
        if (!response.data?.link) await new Promise((resolve) => setTimeout(resolve, 5000));
        link = response.data;
      }
    }
    return link;
  }

  async debridLink(config: AlldebridConfig, link: string, password?: string): Promise<Link> {
    const { BASE_URL, AGENT, API_KEY } = config;
    const linkStatus = await this.checkLinks({ BASE_URL, AGENT, API_KEY }, [link], password);
    if (linkStatus.error?.length) {
      throw linkStatus.error[0];
    }
    const reqOptions: request.Options = {
      uri: `${BASE_URL}/link/unlock`,
      method: 'GET',
      qs: Object.assign({ agent: AGENT, apikey: API_KEY, link: linkStatus.valid[0].link }, password ? password : {}),
      json: true,
    };
    const response = await request(reqOptions);
    if (response.status !== 'success') throw response.error;
    else if (response.data.delayed) return await this.checkDelayedLink(config, response.data.delayed);
    else return response.data;
  }

  async debridLinks(config: AlldebridConfig, links: string[], password?: string): Promise<{ valid: Link[]; error: UnsupportedLinkStatus[] }> {
    const { BASE_URL, AGENT, API_KEY } = config;
    const linkStatus = await this.checkLinks({ BASE_URL, AGENT, API_KEY }, links, password);
    const unlockedLinks: Link[] = [];
    const delayedPool: Promise<Link>[] = [];
    const errors: any[] = [];

    for (const link of linkStatus.valid) {
      const reqOptions: request.Options = {
        uri: `${BASE_URL}/link/unlock`,
        method: 'GET',
        qs: Object.assign({ agent: AGENT, apikey: API_KEY, link: link.link }, password ? password : {}),
        json: true,
      };
      const response = await request(reqOptions);

      if (response.status !== 'success') errors.push(response.error);
      else if (response.data.delayed) delayedPool.push(this.checkDelayedLink(config, response.data.delayed));
      else unlockedLinks.push(response.data);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    if (delayedPool.length) {
      const poolResults = await Promise.all(delayedPool);
      return {
        valid: unlockedLinks.concat(poolResults),
        error: errors,
      };
    } else
      return {
        valid: unlockedLinks,
        error: errors,
      };
  }
}

export default new LinkService();
