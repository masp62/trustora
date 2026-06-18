import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
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
        name: "profile-photo.png",
        mimeType: "image/png",
        buffer: Buffer.from("profile-test-image"),
      },
    },
  });

  expect(response.status()).toBe(201);
  const payload = (await response.json()) as { url: string };
  expect(payload.url).toMatch(/^\/uploads\//);
  return payload.url;
}

async function createPostAndGetUsername(page: import("@playwright/test").Page, title: string) {
  await page.goto("/create");

  const photoUrl = await uploadPhotoAndGetUrl(page);

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Story").fill("A wonderful travel experience for profile testing.");
  await page.locator('input[name="locationCity"]').fill("Barcelona");
  await page.locator('input[name="locationCountry"]').fill("Spain");
  await page.locator('input[name="propertyName"]').fill("Profile Test Place");
  await page.locator('select[name="tripType"]').selectOption("solo");
  await page.getByLabel("city-break").check();

  await page.evaluate((url) => {
    const form = document.querySelector("form");
    if (!form) return;
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "photoUrls";
    hidden.value = url;
    form.appendChild(hidden);
  }, photoUrl);

  await page.getByRole("button", { name: "Publish experience" }).click();
  await expect(page).toHaveURL(/\/post\/[^/]+\/[^/]+/);

  // Extract username from the author link on the post detail page
  const authorHref = await page.locator('a[href^="/u/"]').first().getAttribute("href");
  expect(authorHref).toBeTruthy();
  return authorHref!.replace("/u/", "");
}

test.describe("Story 13 user profile page", () => {
  test("displays profile info and post grid for authenticated author", async ({ page }) => {
    await signUp(page, "Profile Author");
    const username = await createPostAndGetUsername(page, "Profile Test Post One");

    await page.goto(`/u/${username}`);

    // Display name, username, stats
    await expect(page.getByRole("heading", { name: "Profile Author" })).toBeVisible();
    await expect(page.getByText(`@${username}`)).toBeVisible();
    await expect(page.getByText("1 posts")).toBeVisible();
    await expect(page.getByText("0 followers")).toBeVisible();
    await expect(page.getByText("0 following")).toBeVisible();

    // Post card is shown
    await expect(page.getByText("Profile Test Post One")).toBeVisible();
    await expect(page.getByText("Barcelona, Spain")).toBeVisible();
  });

  test("clicking a post card navigates to post detail", async ({ page }) => {
    await signUp(page, "Card Click Author");
    const username = await createPostAndGetUsername(page, "Clickable Profile Post");

    await page.goto(`/u/${username}`);
    await page.getByText("Clickable Profile Post").click();

    await expect(page).toHaveURL(/\/post\/[^/]+\/[^/]+/);
    await expect(page.getByRole("heading", { name: "Clickable Profile Post" })).toBeVisible();
  });

  test("guest can view profile without being logged in", async ({ page, context }) => {
    await signUp(page, "Public Profile Author");
    const username = await createPostAndGetUsername(page, "Public Visibility Post");

    // Log out
    await context.clearCookies();

    await page.goto(`/u/${username}`);

    await expect(page.getByRole("heading", { name: "Public Profile Author" })).toBeVisible();
    await expect(page.getByText(`@${username}`)).toBeVisible();
    await expect(page.getByText("Public Visibility Post")).toBeVisible();
  });

  test("non-existent username returns 404", async ({ page }) => {
    const response = await page.goto("/u/this-user-does-not-exist-xyz-999");
    expect(response?.status()).toBe(404);
  });

  test("meta title and description are populated from user data", async ({ page }) => {
    await signUp(page, "SEO Meta Author");
    const username = await createPostAndGetUsername(page, "SEO Test Post");

    await page.goto(`/u/${username}`);

    const title = await page.title();
    expect(title).toContain("SEO Meta Author");
    expect(title).toContain(`@${username}`);

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    expect(description).toContain("SEO Meta Author");
  });
});
