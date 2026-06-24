import { expect, test } from "@playwright/test";

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function toSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

async function signUp(page: import("@playwright/test").Page, displayName: string) {
  const email = `draft-${uniqueSuffix()}@example.com`;
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);

  return { email, password };
}

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/(explore|profile\/setup)/);

  if (page.url().includes("/profile/setup")) {
    await page.goto("/explore");
  }
}

test.describe("Story 23d draft experience and later publish", () => {
  test("draft stays private until explicit publish and then becomes visible everywhere", async ({ page }) => {
    const suffix = uniqueSuffix();
    const title = `Draft Story ${suffix}`;
    const country = `Draftland ${suffix}`;
    const city = `Harbor ${suffix}`;
    const propertyName = `Draft Property ${suffix}`;

    const credentials = await signUp(page, "Draft Author");
    await page.goto("/create");

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Story").fill("Draft story body for story 23d coverage.");
    await page.locator('input[name="locationCity"]').fill(city);
    await page.locator('input[name="locationCountry"]').fill(country);
    await page.locator('input[name="propertyName"]').fill(propertyName);
    await page.locator('select[name="tripType"]').selectOption("solo");

    await page.getByLabel("beach", { exact: true }).check();

    await page.locator('input[type="file"]').setInputFiles({
      name: "draft-photo.png",
      mimeType: "image/png",
      buffer: Buffer.from("draft-image"),
    });
    await expect(page.getByText("Photos (1/10)")).toBeVisible();

    const ratingLabels = [
      "Cleanliness",
      "Accuracy of listing",
      "Check-in",
      "Communication",
      "Location",
      "Value for money",
      "Comfort",
      "Facilities & amenities",
    ];

    for (const label of ratingLabels) {
      await page.getByRole("radiogroup", { name: label }).getByRole("radio").nth(4).click();
    }

    await page.getByRole("button", { name: "Save as draft" }).click();
    await expect(page).toHaveURL(/\/post\/[^/]+\/[^/]+/);
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish now" })).toBeVisible();

    const draftUrl = page.url();
    const draftPath = new URL(draftUrl).pathname;
    const authorHref = await page.locator('a[href^="/u/"]').first().getAttribute("href");
    expect(authorHref).toBeTruthy();
    const authorPath = authorHref!;

    await page.goto(authorPath);
    await expect(page.getByRole("heading", { name: "Posts & drafts" })).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await page.context().clearCookies();

    await page.goto(draftUrl);
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await signUp(page, "Different User");
    await page.goto(draftUrl);
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await page.goto("/explore");
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await page.goto(`/search?q=${encodeURIComponent(title)}`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await page.goto(`/explore/tags/beach`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await page.goto(authorPath);
    await expect(page.getByText(title)).toHaveCount(0);

    await login(page, credentials.email, credentials.password);
    const publishedResponse = await page.request.get(draftPath);
    expect(publishedResponse.status()).toBe(200);

    await page.goto(draftUrl);
    await page.getByRole("button", { name: "Publish now" }).click();

    await expect(page).toHaveURL(draftUrl);
    await expect(page.getByText("Draft not published yet.")).toHaveCount(0);

    await page.context().clearCookies();

    await page.goto(draftUrl);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    await page.goto("/explore");
    await expect(page.getByRole("link", { name: propertyName }).first()).toBeVisible();
    await page.getByRole("link", { name: propertyName }).first().click();
    await expect(page).toHaveURL(/\/accommodation\//);
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();

    await page.goto(`/search?q=${encodeURIComponent(title)}`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();

    await page.goto(`/explore/${toSlug(country)}/${toSlug(city)}`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();

    await page.goto(`/explore/tags/beach`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();

    await page.goto(authorPath);
    await expect(page.getByText(title)).toBeVisible();
  });
});
