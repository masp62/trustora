import { expect, test } from "@playwright/test";

test.describe("Story 23f accommodation aggregate cron", () => {
  test("recompute endpoint enforces token when configured and succeeds when authorized", async ({ page }) => {
    const configuredSecret = process.env.CRON_SECRET;

    const withoutToken = await page.request.post("/api/cron/accommodation-aggregates");

    if (configuredSecret) {
      expect(withoutToken.status()).toBe(401);
      const unauthorizedPayload = (await withoutToken.json()) as { error?: string };
      expect(unauthorizedPayload.error).toBe("UNAUTHORIZED");

      const withToken = await page.request.post("/api/cron/accommodation-aggregates", {
        headers: { "x-cron-token": configuredSecret },
      });
      expect(withToken.status()).toBe(200);
      const authorizedPayload = (await withToken.json()) as { ok: boolean; recomputed: number };
      expect(authorizedPayload.ok).toBe(true);
      expect(typeof authorizedPayload.recomputed).toBe("number");
      return;
    }

    expect(withoutToken.status()).toBe(200);
    const payload = (await withoutToken.json()) as { ok: boolean; recomputed: number };
    expect(payload.ok).toBe(true);
    expect(typeof payload.recomputed).toBe("number");
  });
});
