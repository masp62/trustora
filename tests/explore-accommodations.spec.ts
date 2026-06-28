import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `explore-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function signUp(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Explore Tester");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

async function rateAllCategories(page: import("@playwright/test").Page) {
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
}

type CreatedStory = {
  title: string;
  country: string;
  city: string;
  propertyName: string;
};

async function createStoryForAccommodation(
  page: import("@playwright/test").Page,
  input?: { propertyName?: string; city?: string; country?: string; title?: string; tripType?: "solo" | "couple" | "family" | "friends" | "business" },
): Promise<CreatedStory> {
  const suffix = uniqueSuffix();
  const title = input?.title ?? `Story16 Accommodation ${suffix}`;
  const country = input?.country ?? `Story16Country ${suffix}`;
  const city = input?.city ?? `Story16City ${suffix}`;
  const propertyName = input?.propertyName ?? `Story16 Residence ${suffix}`;

  await page.goto("/create");

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Story").fill("Story 16 deterministic accommodation coverage post.");
  await page.locator('input[name="locationCity"]').fill(city);
  await page.locator('input[name="locationCountry"]').fill(country);
  await page.locator('input[name="propertyName"]').fill(propertyName);
  await page.locator('select[name="tripType"]').selectOption(input?.tripType ?? "couple");

  await page.getByLabel("beach").check();
  await page.getByLabel("remote-work").check();
  await rateAllCategories(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: `story16-photo-${suffix}.png`,
    mimeType: "image/png",
    buffer: Buffer.from(`story16-image-${suffix}`),
  });
  await expect(page.getByText("Photos (1/10)")).toBeVisible();

  await page.getByRole("button", { name: "Publish experience" }).click();
  await expect(page).toHaveURL(/\/post\//);

  return { title, country, city, propertyName };
}

test.describe("Story 16 explore accommodations", () => {
  test("public visitors can browse explore and open accommodation detail", async ({ page }) => {
    await signUp(page);
    const story = await createStoryForAccommodation(page);

    await page.context().clearCookies();
    await page.goto("/explore");

    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.getByRole("heading", { name: "Discover verified accommodations." })).toBeVisible();
    await expect(page.getByRole("link", { name: story.propertyName }).first()).toBeVisible();
    await expect(page.getByText(`${story.city}, ${story.country}`)).toBeVisible();

    await page.getByRole("link", { name: story.propertyName }).first().click();
    await expect(page).toHaveURL(/\/accommodation\//);
    await expect(page.getByRole("heading", { name: story.propertyName })).toBeVisible();
    await expect(page.getByRole("heading", { name: story.title })).toBeVisible();
  });

  test("accommodation detail shows newest experiences first", async ({ page }) => {
    await signUp(page);
    const suffix = uniqueSuffix();
    const propertyName = `Story16 Chronology ${suffix}`;
    const city = `Story16City ${suffix}`;
    const country = `Story16Country ${suffix}`;

    const first = await createStoryForAccommodation(page, {
      propertyName,
      city,
      country,
      title: `Story16 Old ${suffix}`,
    });

    const second = await createStoryForAccommodation(page, {
      propertyName,
      city,
      country,
      title: `Story16 New ${suffix}`,
    });

    expect(first.propertyName).toBe(second.propertyName);

    await page.context().clearCookies();
    await page.goto("/explore");

    await page.getByRole("link", { name: propertyName }).first().click();
    await expect(page).toHaveURL(/\/accommodation\//);

    const experienceCards = page.locator('section:has(h2:has-text("Experiences")) h3');
    await expect(experienceCards.first()).toHaveText(second.title);
    await expect(experienceCards.nth(1)).toHaveText(first.title);
  });

  test("trip type filter only shows matching accommodations", async ({ page }) => {
    await signUp(page);
    const suffix = uniqueSuffix();

    const soloPropertyName = `Story16 Solo Property ${suffix}`;
    const couplePropertyName = `Story16 Couple Property ${suffix}`;
    const city = `Story16City ${suffix}`;
    const country = `Story16Country ${suffix}`;

    await createStoryForAccommodation(page, {
      propertyName: soloPropertyName,
      city,
      country,
      title: `Story16 Solo ${suffix}`,
      tripType: "solo",
    });

    await createStoryForAccommodation(page, {
      propertyName: couplePropertyName,
      city,
      country,
      title: `Story16 Couple ${suffix}`,
      tripType: "couple",
    });

    await page.context().clearCookies();
    await page.goto("/explore?tripType=solo");

    await expect(page.getByRole("link", { name: soloPropertyName }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: couplePropertyName })).toHaveCount(0);
  });
});
