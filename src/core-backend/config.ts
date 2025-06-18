// src/core-backend/config.ts

export interface AppConfigArgs {
  apiKeys: string[];
  geminiApiBaseUrl: string;
  accessToken?: string;
}

export interface EnvironmentProvider {
  get: (key: string) => string | undefined;
}

export class AppConfig {
  public readonly apiKeys: string[];
  public readonly geminiApiBaseUrl: string;
  public readonly accessToken?: string;

  constructor(args: AppConfigArgs) {
    if (!args.apiKeys || args.apiKeys.length === 0) {
      throw new Error("No API_KEYS supplied.");
    }
    this.apiKeys = args.apiKeys;
    this.geminiApiBaseUrl = args.geminiApiBaseUrl;
    this.accessToken = args.accessToken;
  }

  static fromEnvironment(env: EnvironmentProvider): AppConfig {
    const rawApiKeys = env.get("API_KEYS") || "";
    const apiKeys: string[] = rawApiKeys.startsWith("[")
      ? JSON.parse(rawApiKeys)
      : rawApiKeys.split(",").map(k => k.trim()).filter(k => k);

    const geminiApiBaseUrl = env.get("GEMINI_API_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta2";
    const accessToken = env.get("ACCESS_TOKEN");

    return new AppConfig({
      apiKeys,
      geminiApiBaseUrl,
      accessToken,
    });
  }
}
