import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `likes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUp(page: import("@playwright/test").Page, name = "Likes Tester") {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);

  return { email, password };
}

async function uploadPhotoAndGetUrl(page: import("@playwright/test").Page) {
  const response = await page.request.post("/api/upload", {
    multipart: {
      file: {
        name: "likes-photo.png",
        mimeType: "image/png",
        buffer: Buffer.from("fake-image-likes"),
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

async function createPost(page: import("@playwright/test").Page, title = "Story 10 likes cabin") {
  await page.goto("/create");

  const photoUrl = await uploadPhotoAndGetUrl(page);

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Story").fill("Great view, clean place, and very friendly host.");
  await page.locator('input[name="locationCity"]').fill("Lisbon");
  await page.locator('input[name="locationCountry"]').fill("Portugal");
  await page.locator('input[name="propertyName"]').fill("Like Button Cottage");
  await page.locator('select[name="tripType"]').selectOption("couple");
  await page.getByLabel("beach").check();
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
  await expect(page).toHaveURL(/\/post\/[^/]+\/[^/]+/);

  const match = page.url().match(/\/post\/([^/]+)\/([^/?#]+)/);
  expect(match).not.toBeNull();

  return {
    id: match![1],
    slug: match![2],
    canonicalPath: `/post/${match![1]}/${match![2]}`,
    title,
  };
}

test.describe("Story 10 likes", () => {
  test("shows like count for visitors on post cards and detail page", async ({ page, context }) => {
    const created = await (async () => {
      await signUp(page, "Likes Author");
      return createPost(page, "Visible likes test post");
    })();

    await context.clearCookies();

    await page.goto("/explore");
    const card = page.getByRole("heading", { name: created.title }).locator("xpath=ancestor::article[1]");
    await expect(card.getByRole("button", { name: "Like this post" })).toContainText("0");

    await page.goto(created.canonicalPath);
    await expect(page.getByRole("button", { name: "Like this post" })).toContainText("0");
  });

  test("authenticated user can like and unlike with immediate count changes", async ({ page }) => {
    await signUp(page, "Like Toggle User");
    const created = await createPost(page, "Like toggle test post");

    await page.goto(created.canonicalPath);

    const likeButton = page.getByRole("button", { name: "Like this post" });
    await expect(likeButton).toContainText("0");

    await likeButton.click();
    const unlikeButton = page.getByRole("button", { name: "Unlike this post" });
    await expect(unlikeButton).toContainText("1");

    await page.reload();
    await expect(page.getByRole("button", { name: "Unlike this post" })).toContainText("1");

    await page.getByRole("button", { name: "Unlike this post" }).click();
    await expect(page.getByRole("button", { name: "Like this post" })).toContainText("0");
  });

  test("guest clicking like sees login prompt", async ({ page, context }) => {
    const created = await (async () => {
      await signUp(page, "Guest Prompt Author");
      return createPost(page, "Guest prompt likes post");
    })();

    await context.clearCookies();

    await page.goto(created.canonicalPath);
    await page.getByRole("button", { name: "Like this post" }).click();

    await expect(page.getByRole("heading", { name: "Sign in to RealBnB" })).toBeVisible();
  });
});
