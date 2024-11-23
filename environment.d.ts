declare global {
  namespace NodeJS {
    interface ProcessEnv {
      botToken: string;
      MongoDB: string;
      environment: "dev" | "prod" | "debug";
    }
  }
}

export {};
