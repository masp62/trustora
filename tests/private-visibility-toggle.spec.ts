import { expect, test } from "@playwright/test";

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function toSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

async function signUp(page: import("@playwright/test").Page, displayName: string, prefix: string) {
  const email = `${prefix}-${uniqueSuffix()}@example.com`;
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/(explore|profile\/setup)/);

  if (page.url().includes("/profile/setup")) {
    await page.goto("/explore");
  }

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

async function createPublishedPost(
  page: import("@playwright/test").Page,
  title: string,
  country: string,
  city: string,
) {
  const propertyName = `Visibility Test Property ${uniqueSuffix()}`;
  await page.goto("/create");

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Story").fill("Visibility toggle regression coverage post body.");
  await page.locator('input[name="locationCity"]').fill(city);
  await page.locator('input[name="locationCountry"]').fill(country);
  await page.locator('input[name="propertyName"]').fill(propertyName);
  await page.locator('select[name="tripType"]').selectOption("solo");
  await page.getByLabel("beach", { exact: true }).check();

  await page.locator('input[type="file"]').setInputFiles({
    name: "visibility-photo.png",
    mimeType: "image/png",
    buffer: Buffer.from("visibility-image"),
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

  await page.getByRole("button", { name: "Publish experience" }).click();
  await expect(page).toHaveURL(/\/post\/[^/]+\/[^/]+/);

  const match = page.url().match(/\/post\/([^/]+)\/([^/?#]+)/);
  expect(match).not.toBeNull();

  const id = match![1];
  const slug = match![2];
  const canonicalPath = `/post/${id}/${slug}`;

  const authorHref = await page.locator('a[href^="/u/"]').first().getAttribute("href");
  expect(authorHref).toBeTruthy();

  return {
    id,
    slug,
    canonicalPath,
    authorPath: authorHref!,
    propertyName,
  };
}

test.describe("Story 23e private visibility toggle", () => {
  test("author can toggle published post private/public and access/discovery rules are enforced", async ({ page, context }) => {
    const suffix = uniqueSuffix();
    const title = `Visibility Story ${suffix}`;
    const country = `Visibilityland ${suffix}`;
    const city = `Hidden Bay ${suffix}`;

    const author = await signUp(page, "Visibility Author", "visibility-author");
    const { id, canonicalPath, authorPath, propertyName } = await createPublishedPost(page, title, country, city);

    const reader = await signUp(page, "Visibility Reader", "visibility-reader");
    await page.goto(canonicalPath);

    await page.getByRole("button", { name: "Like this post" }).click();
    await expect(page.getByRole("button", { name: "Unlike this post" })).toBeVisible();

    await page.getByLabel("Write a comment").fill("Keeping this comment to verify persistence after visibility toggles.");
    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(page.getByRole("heading", { name: "Comments (1)" })).toBeVisible();

    await context.clearCookies();
    await login(page, author.email, author.password);

    await page.goto(canonicalPath);
    await page.getByRole("button", { name: "Make private" }).click();
    await expect(page.getByText("Private", { exact: true })).toBeVisible();

    await page.goto(`/post/${id}/edit`);
    await expect(page.getByText("Status: published · private")).toBeVisible();

    await page.goto(authorPath);
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText("Private", { exact: true })).toBeVisible();

    await context.clearCookies();
    await login(page, reader.email, reader.password);

    await page.goto(canonicalPath);
    await expect(page.getByRole("heading", { name: /404|not found/i }).first()).toBeVisible();

    await page.goto("/explore");
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await page.goto(`/search?q=${encodeURIComponent(title)}`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await page.goto(`/explore/${toSlug(country)}/${toSlug(city)}`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await page.goto("/explore/tags/beach");
    await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);

    await page.goto(authorPath);
    await expect(page.getByText(title)).toHaveCount(0);

    await context.clearCookies();
    await login(page, author.email, author.password);

    await page.goto(canonicalPath);
    await page.getByRole("button", { name: "Make public" }).click();
    await expect(page.getByText("Private", { exact: true })).toHaveCount(0);

    await context.clearCookies();
    await login(page, reader.email, reader.password);

    await page.goto(canonicalPath);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unlike this post" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Comments (1)" })).toBeVisible();
    await expect(page.getByText("Keeping this comment to verify persistence after visibility toggles.")).toBeVisible();

    await page.goto("/explore");
    await expect(page.getByRole("link", { name: propertyName }).first()).toBeVisible();
    await page.getByRole("link", { name: propertyName }).first().click();
    await expect(page).toHaveURL(/\/accommodation\//);
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();

    await page.goto(`/search?q=${encodeURIComponent(title)}`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();

    await page.goto(`/explore/${toSlug(country)}/${toSlug(city)}`);
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();

    await page.goto("/explore/tags/beach");
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();

    await page.goto(authorPath);
    await expect(page.getByText(title)).toBeVisible();
  });
});
