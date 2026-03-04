import { request as playwrightRequest, type FullConfig } from "@playwright/test";
import { cleanupTestArtifacts } from "./cleanup-test-artifacts";

async function globalTeardown(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL?.toString() ||
    process.env.PLAYWRIGHT_BASE_URL ||
    "http://127.0.0.1:3000";

  const api = await playwrightRequest.newContext({ baseURL });
  try {
    await cleanupTestArtifacts(api);
  } finally {
    await api.dispose();
  }
}

export default globalTeardown;
