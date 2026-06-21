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

async function uploadPhotoAndGetUrl(page: import("@playwright/test").Page) {
  const response = await page.request.post("/api/upload", {
    multipart: {
      file: {
        name: "story16-photo.png",
        mimeType: "image/png",
        buffer: Buffer.from("story16-image"),
      },
    },
  });

  expect(response.status()).toBe(201);
  const payload = (await response.json()) as { url: string };
  expect(payload.url).toMatch(/^\/uploads\//);
  return payload.url;
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
};

async function createStoryForFilters(page: import("@playwright/test").Page): Promise<CreatedStory> {
  const suffix = uniqueSuffix();
  const title = `Story16 Filter Match ${suffix}`;
  const country = `Story16Country ${suffix}`;
  const city = `Story16City ${suffix}`;

  await signUp(page);
  await page.goto("/create");

  const photoUrl = await uploadPhotoAndGetUrl(page);

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Story").fill("Story 16 deterministic filter coverage post.");
  await page.locator('input[name="locationCity"]').fill(city);
  await page.locator('input[name="locationCountry"]').fill(country);
  await page.locator('input[name="propertyName"]').fill("Story16 Residence");
  await page.locator('select[name="tripType"]').selectOption("couple");

  await page.getByLabel("beach").check();
  await page.getByLabel("remote-work").check();
  await rateAllCategories(page);

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

  return { title, country, city };
}

test.describe("Story 16 explore feed filters", () => {
  test("public visitors can browse explore and apply combinable filters with shareable URL", async ({ page }) => {
    const story = await createStoryForFilters(page);

    await page.context().clearCookies();
    await page.goto("/explore");

    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.getByRole("heading", { name: "Discover real travel stay stories." })).toBeVisible();

    const navEntriesBefore = await page.evaluate(
      () => performance.getEntriesByType("navigation").length,
    );

    await page.getByPlaceholder("Country").fill(story.country);
    await page.getByPlaceholder("City").fill(story.city);
    await page.getByRole("button", { name: "Couple" }).click();
    await page.getByRole("button", { name: "Remote Work" }).click();

    await expect(page).toHaveURL(new RegExp(`/explore\\?.*country=${encodeURIComponent(story.country).replace(/%20/g, "\\+")}`));
    await expect(page).toHaveURL(new RegExp(`city=${encodeURIComponent(story.city).replace(/%20/g, "\\+")}`));
    await expect(page).toHaveURL(/tripType=couple/);
    await expect(page).toHaveURL(/tags=remote-work/);

    await expect(page.getByRole("heading", { name: story.title })).toBeVisible();

    const navEntriesAfter = await page.evaluate(
      () => performance.getEntriesByType("navigation").length,
    );
    expect(navEntriesAfter).toBe(navEntriesBefore);
  });

  test("shows filtered empty state when no posts match", async ({ page }) => {
    await page.goto("/explore");

    await page.getByPlaceholder("Country").fill(`NoMatchCountry-${uniqueSuffix()}`);

    await expect(page.getByRole("heading", { name: "No stories match your filters" })).toBeVisible();
  });

  test("loads additional posts with cursor-based infinite scroll and shows loading skeleton", async ({ page }) => {
    await page.route("**/api/explore?**", async (route) => {
      const requestUrl = route.request().url();
      if (requestUrl.includes("cursor=")) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      await route.continue();
    });

    await page.goto("/explore");

    const initialCards = await page.locator("article").count();
    expect(initialCards).toBeGreaterThanOrEqual(20);

    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
    });

    await expect(page.getByText("Loading more stories...")).toBeVisible();

    await expect
      .poll(async () => page.locator("article").count())
      .toBeGreaterThan(initialCards);
  });
});
