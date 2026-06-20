import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `location-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function toSlug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

async function signUp(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Location Author");
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
        name: `location-photo-${index}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(`location-image-${index}`),
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
    city: string;
    country: string;
    photoIndex: number;
  },
) {
  await page.goto("/create");
  const photoUrl = await uploadPhotoAndGetUrl(page, options.photoIndex);

  await page.getByLabel("Title").fill(options.title);
  await page.getByLabel("Story").fill("Story 18 location pages coverage post.");
  await page.locator('input[name="locationCity"]').fill(options.city);
  await page.locator('input[name="locationCountry"]').fill(options.country);
  await page.locator('input[name="propertyName"]').fill("Location Story Home");
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

test.describe("Story 18 location pages", () => {
  test("country and city location pages are generated from posts with SEO metadata and 404 on missing locations", async ({ page }) => {
    await signUp(page);

    const suffix = uniqueSuffix();
    const country = `Storyland Republic ${suffix}`;
    const cityA = `North Bay ${suffix}`;
    const cityB = `South Port ${suffix}`;
    const otherCountry = `Elsewhere Nation ${suffix}`;

    const countryPostA = `Location Country A ${suffix}`;
    const countryPostB = `Location Country B ${suffix}`;
    const otherCountryPost = `Location Other Country ${suffix}`;

    await createPost(page, {
      title: countryPostA,
      city: cityA,
      country,
      photoIndex: 1,
    });

    await createPost(page, {
      title: countryPostB,
      city: cityB,
      country,
      photoIndex: 2,
    });

    await createPost(page, {
      title: otherCountryPost,
      city: `Other City ${suffix}`,
      country: otherCountry,
      photoIndex: 3,
    });

    await page.context().clearCookies();

    const countrySlug = toSlug(country);
    const cityASlug = toSlug(cityA);

    await page.goto(`/explore/${countrySlug}`);

    await expect(page.getByRole("heading", { name: `Experiences in ${country}` })).toBeVisible();
    await expect(page.getByRole("heading", { name: countryPostA })).toBeVisible();
    await expect(page.getByRole("heading", { name: countryPostB })).toBeVisible();
    await expect(page.getByRole("heading", { name: otherCountryPost })).toHaveCount(0);

    await expect(page).toHaveTitle(`Experiences in ${country}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      `Browse real travel stay experiences in ${country} on RealBnB.`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      `Experiences in ${country}`,
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      `Browse real travel stay experiences in ${country} on RealBnB.`,
    );

    await page.goto(`/explore/${countrySlug}/${cityASlug}`);

    await expect(page.getByRole("heading", { name: `Experiences in ${cityA}, ${country}` })).toBeVisible();
    await expect(page.getByRole("heading", { name: countryPostA })).toBeVisible();
    await expect(page.getByRole("heading", { name: countryPostB })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: otherCountryPost })).toHaveCount(0);

    await expect(page).toHaveTitle(`Experiences in ${cityA}, ${country}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      `Browse real travel stay experiences in ${cityA}, ${country} on RealBnB.`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      `Experiences in ${cityA}, ${country}`,
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      `Browse real travel stay experiences in ${cityA}, ${country} on RealBnB.`,
    );

    const missingCountry = await page.request.get(`/explore/no-such-country-${suffix}`);
    expect(missingCountry.status()).toBe(404);

    const missingCity = await page.request.get(`/explore/${countrySlug}/no-such-city-${suffix}`);
    expect(missingCity.status()).toBe(404);
  });
});
