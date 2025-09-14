import { z } from "zod";
import { AlldebridHttpClient } from "../../core/http/client";
import { HostSchema } from "./types";

export const ListHostResponseSchema = z.object({
  hosts: z.record(z.string(), HostSchema),
  streams: z.record(z.string(), HostSchema),
  redirectors: z.record(z.string(), HostSchema),
});
export type ListHostResponse = z.infer<typeof ListHostResponseSchema>;

export const ListDomainsResponseSchema = z.object({
  hosts: z.array(z.string()),
  streams: z.array(z.string()),
  redirectors: z.array(z.string()),
});
export type ListDomainsResponse = z.infer<typeof ListDomainsResponseSchema>;

export class HostResource {
  constructor(private readonly client: AlldebridHttpClient) {}

  async list(): Promise<ListHostResponse> {
    const response = await this.client.getRequest(
      "v4/hosts",
      ListHostResponseSchema,
      { publicEndpoint: true },
    );
    return response.data;
  }

  async listDomains(): Promise<ListDomainsResponse> {
    const response = await this.client.getRequest(
      "v4/hosts/domains",
      ListDomainsResponseSchema,
      { publicEndpoint: true },
    );
    return response.data;
  }

  async listHostPriorities(): Promise<Record<string, number>> {
    const response = await this.client.getRequest(
      "v4/hosts/priority",
      z.object({ hosts: z.record(z.string(), z.int()) }),
      { publicEndpoint: true },
    );
    return response.data.hosts;
  }
}
