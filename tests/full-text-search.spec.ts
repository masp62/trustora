import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `search-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function signUp(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Search Author");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

async function uploadPhotoAndGetUrl(page: import("@playwright/test").Page, index: number) {
  const response = await page.request.post("/api/upload", {
    multipart: {
      file: {
        name: `search-photo-${index}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(`search-image-${index}`),
      },
    },
  });

  expect(response.status()).toBe(201);
  const payload = (await response.json()) as { url: string };
  expect(payload.url).toMatch(/^\/uploads\//);
  return payload.url;
}

async function createPost(
  page: import("@playwright/test").Page,
  options: {
    title: string;
    body: string;
    city: string;
    country: string;
    photoIndex: number;
  },
) {
  await page.goto("/create");
  const photoUrl = await uploadPhotoAndGetUrl(page, options.photoIndex);

  await page.getByLabel("Title").fill(options.title);
  await page.getByLabel("Story").fill(options.body);
  await page.locator('input[name="locationCity"]').fill(options.city);
  await page.locator('input[name="locationCountry"]').fill(options.country);
  await page.locator('select[name="tripType"]').selectOption("solo");
  await page.getByLabel("city-break").check();

  await page.evaluate((url) => {
    const form = document.querySelector("form");
    if (!form) {
      return;
    }

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "photoUrls";
    hidden.value = url;
    form.appendChild(hidden);
  }, photoUrl);

  await page.getByRole("button", { name: "Publish experience" }).click();
  await expect(page).toHaveURL(/\/post\//);
}

test.describe("Story 20 full-text search", () => {
  test("search matches title/body/location and keeps query in URL", async ({ page }) => {
    await signUp(page);

    const suffix = uniqueSuffix();
    const titleToken = `title-token-${suffix}`;
    const bodyToken = `body-token-${suffix}`;
    const cityToken = `city-token-${suffix}`;
    const countryToken = `country-token-${suffix}`;

    await createPost(page, {
      title: `Search by title ${titleToken}`,
      body: "Random body text",
      city: "Oslo",
      country: "Norway",
      photoIndex: 1,
    });

    await createPost(page, {
      title: "Body only match",
      body: `This story contains ${bodyToken} in the body.`,
      city: "Rome",
      country: "Italy",
      photoIndex: 2,
    });

    await createPost(page, {
      title: "City match",
      body: "No body token",
      city: cityToken,
      country: "France",
      photoIndex: 3,
    });

    await createPost(page, {
      title: "Country match",
      body: "No body token",
      city: "Berlin",
      country: countryToken,
      photoIndex: 4,
    });

    await page.context().clearCookies();

    await page.goto(`/search?q=${encodeURIComponent(titleToken)}`);
    await expect(page).toHaveURL(new RegExp(`/search\\?q=${titleToken}`));
    await expect(page.getByRole("heading", { level: 3, name: `Search by title ${titleToken}` })).toBeVisible();

    await page.goto(`/search?q=${encodeURIComponent(bodyToken)}`);
    await expect(page.getByRole("heading", { name: "Body only match" })).toBeVisible();

    await page.goto(`/search?q=${encodeURIComponent(cityToken)}`);
    await expect(page.getByRole("heading", { name: "City match" })).toBeVisible();

    await page.goto(`/search?q=${encodeURIComponent(countryToken)}`);
    await expect(page.getByRole("heading", { name: "Country match" })).toBeVisible();
  });

  test("sorts by relevance with reverse-chronological fallback and shows empty state", async ({ page }) => {
    await signUp(page);

    const suffix = uniqueSuffix();
    const tieToken = `tie-token-${suffix}`;
    const olderTitle = `Search Tie Older ${suffix}`;
    const newerTitle = `Search Tie Newer ${suffix}`;

    await createPost(page, {
      title: `${olderTitle} ${tieToken}`,
      body: "Older post",
      city: "Lisbon",
      country: "Portugal",
      photoIndex: 5,
    });

    await createPost(page, {
      title: `${newerTitle} ${tieToken}`,
      body: "Newer post",
      city: "Lisbon",
      country: "Portugal",
      photoIndex: 6,
    });

    await page.context().clearCookies();

    await page.goto(`/search?q=${encodeURIComponent(tieToken)}`);

    const cardTitles = await page.locator("article h3").allTextContents();
    const olderIndex = cardTitles.findIndex((title) => title.includes(olderTitle));
    const newerIndex = cardTitles.findIndex((title) => title.includes(newerTitle));

    expect(olderIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeLessThan(olderIndex);

    const emptyToken = `no-match-${uniqueSuffix()}`;
    await page.goto(`/search?q=${encodeURIComponent(emptyToken)}`);
    await expect(page.getByRole("heading", { name: "No results found" })).toBeVisible();
  });

  test("header search input submits to /search?q and page is server-rendered", async ({ page }) => {
    const suffix = uniqueSuffix();
    const navToken = `nav-token-${suffix}`;

    await page.goto("/explore");
    await page.getByLabel("Search stories").fill(navToken);
    await page.getByLabel("Search stories").press("Enter");

    await expect(page).toHaveURL(new RegExp(`/search\\?q=${navToken}`));

    const response = await page.request.get(`/search?q=${encodeURIComponent(navToken)}`);
    expect(response.status()).toBe(200);

    const html = await response.text();
    expect(html).toContain(`Search results for &quot;${navToken}&quot;`);
  });
});
