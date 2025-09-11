import { z } from "zod";
import { AlldebridHttpClient } from "../../core/http/client";
import {
  LinkInfoSchema,
  type LinkInfo,
  DebridLinkResponseSchema,
  type DebridLinkResponse,
} from "./types";

export class LinkResource {
  constructor(private readonly client: AlldebridHttpClient) {}

  async getInfo(link: string, password?: string): Promise<LinkInfo>;
  async getInfo(links: string[], password?: string): Promise<LinkInfo[]>;
  async getInfo(
    linkOrLinks: string | string[],
    password?: string,
  ): Promise<LinkInfo | LinkInfo[]> {
    const isArray = Array.isArray(linkOrLinks);
    const linkArray = isArray ? linkOrLinks : [linkOrLinks];
    const response = await this.client.postRequest(
      "v4/link/infos",
      z.object({ infos: z.array(LinkInfoSchema) }),
      {
        requestType: "postFormData",
        method: "POST",
        formData: { ...{ link: linkArray }, ...(password ? { password } : {}) },
      },
    );
    if (!response.data.infos[0])
      throw new Error("Api returned a successful but empty response");
    return isArray ? response.data.infos : response.data.infos[0];
  }

  async debrid(link: string, password?: string): Promise<DebridLinkResponse> {
    const response = await this.client.postRequest(
      "v4/link/unlock",
      DebridLinkResponseSchema,
      {
        requestType: "postFormData",
        method: "POST",
        formData: { ...{ link }, ...(password ? { password } : {}) },
      },
    );
    return response.data;
  }
}
