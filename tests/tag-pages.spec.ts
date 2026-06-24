import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function signUp(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Tag Author");
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
        name: `tag-photo-${index}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(`tag-image-${index}`),
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

async function createPost(
  page: import("@playwright/test").Page,
  options: {
    title: string;
    tags: string[];
    photoIndex: number;
  },
) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await page.goto("/create");
  const photoUrl = await uploadPhotoAndGetUrl(page, options.photoIndex);

  await page.getByLabel("Title").fill(options.title);
  await page.getByLabel("Story").fill("Story 19 tag page coverage post.");
  await page.locator('input[name="locationCity"]').fill(`Tag City ${suffix}`);
  await page.locator('input[name="locationCountry"]').fill(`Tag Country ${suffix}`);
  await page.locator('input[name="propertyName"]').fill(`Tag Property ${suffix}`);
  await page.locator('select[name="tripType"]').selectOption("solo");
  await rateAllCategories(page);

  for (const tag of options.tags) {
    await page.getByLabel(tag).check();
  }

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

test.describe("Story 19 tag pages", () => {
  test("predefined tag pages are public, list matching posts in reverse chronology, and render SEO metadata", async ({ page }) => {
    await signUp(page);

    const suffix = uniqueSuffix();
    const beachOlder = `Tag Beach Older ${suffix}`;
    const beachNewer = `Tag Beach Newer ${suffix}`;
    const nonBeach = `Tag Non Beach ${suffix}`;

    await createPost(page, {
      title: beachOlder,
      tags: ["beach"],
      photoIndex: 1,
    });

    await createPost(page, {
      title: beachNewer,
      tags: ["beach", "city-break"],
      photoIndex: 2,
    });

    await createPost(page, {
      title: nonBeach,
      tags: ["budget"],
      photoIndex: 3,
    });

    await page.context().clearCookies();

    await page.goto("/explore/tags/beach");

    await expect(page.getByRole("heading", { name: "Beach Experiences" })).toBeVisible();
    await expect(page.getByRole("heading", { name: beachOlder })).toBeVisible();
    await expect(page.getByRole("heading", { name: beachNewer })).toBeVisible();
    await expect(page.getByRole("heading", { name: nonBeach })).toHaveCount(0);

    const cardTitles = await page.locator("article h3").allTextContents();
    const olderIndex = cardTitles.findIndex((title) => title.includes(beachOlder));
    const newerIndex = cardTitles.findIndex((title) => title.includes(beachNewer));
    expect(olderIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeLessThan(olderIndex);

    await expect(page).toHaveTitle("Beach Experiences â€” Trustora");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Browse beach travel stay experiences shared by the Trustora community.",
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Beach Experiences â€” Trustora",
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "Browse beach travel stay experiences shared by the Trustora community.",
    );
  });

  test("all predefined tags are accessible and invalid tags return 404", async ({ page }) => {
    const validTags = [
      "beach",
      "city-break",
      "countryside",
      "luxury",
      "budget",
      "pet-friendly",
      "unique-stay",
      "remote-work",
    ];

    for (const tag of validTags) {
      const response = await page.request.get(`/explore/tags/${tag}`);
      expect(response.status()).toBe(200);
    }

    await page.goto("/explore/tags/not-a-real-tag");
    await expect(page.getByRole("heading", { name: /404|not found/i }).first()).toBeVisible();
  });
});

