import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `accommodation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function signUp(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Accommodation Tester");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

async function rateAllCategories(page: import("@playwright/test").Page, stars: 1 | 2 | 3 | 4 | 5) {
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
    await page.getByRole("radiogroup", { name: label }).getByRole("radio").nth(stars - 1).click();
  }
}

async function createExperience(
  page: import("@playwright/test").Page,
  input: {
    title: string;
    propertyName: string;
    city: string;
    country: string;
    stars: 1 | 2 | 3 | 4 | 5;
    photoNameSuffix: string;
  },
) {
  await page.goto("/create");

  await page.getByLabel("Title").fill(input.title);
  await page.getByLabel("Story").fill("Accommodation aggregation acceptance coverage.");
  await page.locator('input[name="locationCity"]').fill(input.city);
  await page.locator('input[name="locationCountry"]').fill(input.country);
  await page.locator('input[name="propertyName"]').fill(input.propertyName);
  await page.locator('select[name="tripType"]').selectOption("couple");
  await page.getByLabel("beach").check();
  await rateAllCategories(page, input.stars);

  await page.locator('input[type="file"]').setInputFiles({
    name: `accommodation-${input.photoNameSuffix}.png`,
    mimeType: "image/png",
    buffer: Buffer.from(`accommodation-image-${input.photoNameSuffix}`),
  });
  await expect(page.getByText("Photos (1/10)")).toBeVisible();

  await page.getByRole("button", { name: "Publish experience" }).click();
  await expect(page).toHaveURL(/\/post\//);
}

test.describe("Story 23f accommodation aggregates", () => {
  test("aggregates ratings per accommodation and shows newest experiences first", async ({ page }) => {
    const suffix = uniqueSuffix();
    const propertyName = `23F Residence ${suffix}`;
    const city = `23FCity ${suffix}`;
    const country = `23FCountry ${suffix}`;
    const firstTitle = `23F Older Story ${suffix}`;
    const secondTitle = `23F Newer Story ${suffix}`;

    await signUp(page);

    await createExperience(page, {
      title: firstTitle,
      propertyName,
      city,
      country,
      stars: 5,
      photoNameSuffix: `${suffix}-1`,
    });

    await createExperience(page, {
      title: secondTitle,
      propertyName,
      city,
      country,
      stars: 3,
      photoNameSuffix: `${suffix}-2`,
    });

    await page.goto("/explore");

    const card = page.locator("article", {
      has: page.getByRole("link", { name: propertyName }),
    }).first();

    await expect(card).toBeVisible();
    await expect(card.getByText("2 experiences")).toBeVisible();

    await card.getByRole("link", { name: propertyName }).first().click();

    await expect(page).toHaveURL(/\/accommodation\//);
    await expect(page.getByRole("heading", { name: propertyName })).toBeVisible();
    const weightedScoreValue = page.locator('xpath=//p[normalize-space()="Weighted score"]/following-sibling::p[1]');
    const contributingRatingsValue = page.locator('xpath=//p[normalize-space()="Contributing ratings"]/following-sibling::p[1]');
    await expect(weightedScoreValue).toHaveText("4.0");
    await expect(contributingRatingsValue).toHaveText("2");

    const experienceTitles = page.locator('section:has(h2:has-text("Experiences")) h3');
    await expect(experienceTitles.first()).toHaveText(secondTitle);
    await expect(experienceTitles.nth(1)).toHaveText(firstTitle);
  });
});
