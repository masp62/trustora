import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `follow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUp(page: import("@playwright/test").Page, name: string) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill(name);
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
        name: "follow-photo.png",
        mimeType: "image/png",
        buffer: Buffer.from("follow-image"),
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

async function createPost(page: import("@playwright/test").Page, title: string) {
  await page.goto("/create");

  const photoUrl = await uploadPhotoAndGetUrl(page);

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Story").fill("Testing follow and unfollow flows from post detail.");
  await page.locator('input[name="locationCity"]').fill("Madrid");
  await page.locator('input[name="locationCountry"]').fill("Spain");
  await page.locator('input[name="propertyName"]').fill("Follow Place");
  await page.locator('select[name="tripType"]').selectOption("couple");
  await page.getByLabel("city-break").check();
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

  const pathMatch = page.url().match(/\/post\/([^/]+)\/([^/?#]+)/);
  expect(pathMatch).not.toBeNull();

  const authorHref = await page.locator('a[href^="/u/"]').first().getAttribute("href");
  expect(authorHref).toBeTruthy();

  const username = authorHref!.replace("/u/", "");

  return {
    canonicalPath: `/post/${pathMatch![1]}/${pathMatch![2]}`,
    authorUsername: username,
  };
}

test.describe("Story 12 follow/unfollow", () => {
  test("authenticated user can follow from post detail and unfollow from profile", async ({ page, context }) => {
    await signUp(page, "Follow Author");
    const post = await createPost(page, "Story 12 follow from post detail");

    await context.clearCookies();
    await signUp(page, "Follow Viewer");

    await page.goto(post.canonicalPath);

    const followButton = page.getByRole("button", { name: `Follow @${post.authorUsername}` });
    await expect(followButton).toBeVisible();

    await followButton.click();
    await expect(page.getByRole("button", { name: `Unfollow @${post.authorUsername}` })).toBeVisible();

    await page.goto(`/u/${post.authorUsername}`);
    await expect(page.getByRole("link", { name: /followers/i })).toBeVisible();

    await page.getByRole("link", { name: /followers/i }).click();
    await expect(page).toHaveURL(`/u/${post.authorUsername}/followers`);
    await expect(page.getByRole("list", { name: "Followers list" })).toContainText("Follow Viewer");

    await page.goto(`/u/${post.authorUsername}`);
    await page.getByRole("link", { name: /following/i }).click();
    await expect(page).toHaveURL(`/u/${post.authorUsername}/following`);

    await page.goto("/explore");
    await page.goto(`/u/${post.authorUsername}`);
    await page.getByRole("button", { name: `Unfollow @${post.authorUsername}` }).click();
    await expect(page.getByRole("button", { name: `Follow @${post.authorUsername}` })).toBeVisible();
  });

  test("guest clicking follow sees login prompt", async ({ page, context }) => {
    await signUp(page, "Guest Prompt Follow Author");
    const post = await createPost(page, "Story 12 guest follow prompt");

    await context.clearCookies();

    await page.goto(`/u/${post.authorUsername}`);
    await page.getByRole("button", { name: `Follow @${post.authorUsername}` }).click();

    await expect(page.getByRole("heading", { name: "Sign in to Trustora" })).toBeVisible();
  });
});

