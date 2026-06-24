import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `comments-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUp(page: import("@playwright/test").Page, name = "Comment Tester") {
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

async function uploadPhotoAndGetUrl(page: import("@playwright/test").Page, index: number) {
  const response = await page.request.post("/api/upload", {
    multipart: {
      file: {
        name: `comments-photo-${index}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(`comments-image-${index}`),
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

async function createPost(page: import("@playwright/test").Page) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await page.goto("/create");

  const photoUrl = await uploadPhotoAndGetUrl(page, 0);

  await page.getByLabel("Title").fill(`Story 11 comments post ${suffix}`);
  await page.getByLabel("Story").fill("Testing comments on post detail page.");
  await page.locator('input[name="locationCity"]').fill(`Porto ${suffix}`);
  await page.locator('input[name="locationCountry"]').fill(`Portugal ${suffix}`);
  await page.locator('input[name="propertyName"]').fill(`Comment House ${suffix}`);
  await page.locator('select[name="tripType"]').selectOption("friends");
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
  };
}

test.describe("Story 11 comments", () => {
  test("shows comments chronologically to visitors", async ({ page, context }) => {
    await signUp(page, "Comment Author");
    const post = await createPost(page);

    const commentItems = page.getByRole("list", { name: "Comment list" }).locator("li");

    await page.getByLabel("Write a comment").fill("First comment from author");
    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(commentItems).toHaveCount(1);
    await expect(commentItems.nth(0)).toContainText("First comment from author");
    await expect(page.getByLabel("Write a comment")).toHaveValue("");

    await context.clearCookies();
    await signUp(page, "Second Commenter");
    await page.goto(post.canonicalPath);

    await page.getByLabel("Write a comment").fill("Second comment from another user");
    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(commentItems).toHaveCount(2);
    await expect(commentItems.nth(0)).toContainText("Second comment from another user");
    await expect(commentItems.nth(1)).toContainText("First comment from author");
    await expect(page.getByLabel("Write a comment")).toHaveValue("");

    await context.clearCookies();
    await page.goto(post.canonicalPath);

    await expect(commentItems).toHaveCount(2);
    await expect(commentItems.nth(0)).toContainText("Second comment from another user");
    await expect(commentItems.nth(1)).toContainText("First comment from author");
  });

  test("adds and deletes own comment without page reload", async ({ page }) => {
    await signUp(page, "Comment CRUD User");
    const post = await createPost(page);

    const commentItems = page.getByRole("list", { name: "Comment list" }).locator("li");

    await page.goto(post.canonicalPath);

    await page.getByLabel("Write a comment").fill("Comment to create and delete");
    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(page).toHaveURL(post.canonicalPath);
    await expect(commentItems).toHaveCount(1);
    await expect(commentItems.nth(0)).toContainText("Comment to create and delete");
    await expect(page.getByLabel("Write a comment")).toHaveValue("");

    await commentItems.nth(0).getByRole("button", { name: "Delete comment" }).click();
    await expect(commentItems).toHaveCount(0);
  });

  test("guest interaction with comment input opens login prompt", async ({ page, context }) => {
    await signUp(page, "Guest Prompt Author");
    const post = await createPost(page);

    await context.clearCookies();
    await page.goto(post.canonicalPath);

    await page.getByLabel("Write a comment").click();
    await expect(page.getByRole("heading", { name: "Sign in to Trustora" })).toBeVisible();
  });

  test("rejects empty comment submission with validation message", async ({ page }) => {
    await signUp(page, "Comment Validation User");
    const post = await createPost(page);

    await page.goto(post.canonicalPath);
    await page.getByLabel("Write a comment").fill("   ");
    await page.getByRole("button", { name: "Post comment" }).click();

    await expect(page.getByText("Comment cannot be empty.")).toBeVisible();
  });
});
