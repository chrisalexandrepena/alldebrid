import { AlldebridHttpClient } from "../../core/http/client";
import { z } from "zod";
import {
  UserSchema,
  type User,
  VerificationEmailStatusSchema,
  type VarificationEmailStatus,
  type UserHost,
  UserHostSchema,
  type SavedLink,
  SavedLinkSchema,
} from "./types";

export class UserResource {
  constructor(private readonly client: AlldebridHttpClient) {}

  async get(): Promise<User> {
    const response = await this.client.getRequest(
      "v4/user",
      z.object({ user: UserSchema }),
    );
    return response.data.user;
  }

  async getHosts(): Promise<Record<string, UserHost>> {
    const response = await this.client.getRequest(
      "v4.1/user/hosts",
      z.object({ hosts: z.record(z.string(), UserHostSchema) }),
    );
    return response.data.hosts;
  }

  async checkVerificationToken(
    token: string,
  ): Promise<VarificationEmailStatus> {
    const response = await this.client.postRequest(
      "v4/user/verif",
      VerificationEmailStatusSchema,
      { requestType: "postFormData", method: "POST", formData: { token } },
    );
    return response.data;
  }

  async resendVerification(token: string): Promise<{ sent: boolean }> {
    const response = await this.client.postRequest(
      "v4/user/verif/resend",
      z.object({ sent: z.boolean() }),
      { requestType: "postFormData", method: "POST", formData: { token } },
    );
    return response.data;
  }

  async clearNotifications(
    code: string,
  ): Promise<{ code: string; cleared: boolean }> {
    const response = await this.client.postRequest(
      "v4/user/notification/clear",
      z.object({ message: z.literal("Notification was cleared") }),
      { requestType: "postFormData", method: "POST", formData: { code } },
    );
    return {
      code,
      cleared: response.data.message === "Notification was cleared",
    };
  }

  async listSavedLinks(): Promise<SavedLink[]> {
    const response = await this.client.getRequest(
      "v4/user/links",
      z.object({ links: z.array(SavedLinkSchema) }),
    );
    return response.data.links;
  }

  async saveLinks(links: string[]): Promise<{ saved: boolean }> {
    const response = await this.client.postRequest(
      "v4/user/links/save",
      z.object({ message: z.string() }),
      {
        requestType: "postFormData",
        method: "POST",
        formData: { links },
      },
    );
    return { saved: /succ?essfully saved$/gi.test(response.data.message) };
  }

  async deleteLinks(links: string[]): Promise<{ deleted: boolean }> {
    const response = await this.client.postRequest(
      "v4/user/links/delete",
      z.object({ message: z.string() }),
      {
        requestType: "postFormData",
        method: "POST",
        formData: { links },
      },
    );
    return { deleted: /succ?essfully deleted$/gi.test(response.data.message) };
  }

  async listRecentLinks(): Promise<SavedLink[]> {
    const response = await this.client.getRequest(
      "v4/user/history",
      z.object({ links: z.array(SavedLinkSchema) }),
    );
    return response.data.links;
  }

  async purgeRecentLinks(): Promise<{ deleted: boolean }> {
    const response = await this.client.postRequest(
      "v4/user/history/delete",
      z.object({ message: z.string() }),
      { requestType: "simplePost", method: "POST" },
    );
    return { deleted: /successfully purged$/gi.test(response.data.message) };
  }
}
