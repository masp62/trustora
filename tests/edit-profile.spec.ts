import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `edit-profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
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

  return { email, password };
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

async function getUsername(page: import("@playwright/test").Page) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  await page.goto("/create");

  await page.getByLabel("Title").fill("Username Extraction Post");
  await page.getByLabel("Story").fill("Post for extracting username.");
  await page.locator('input[name="locationCity"]').fill("Berlin");
  await page.locator('input[name="locationCountry"]').fill("Germany");
  await page.locator('input[name="propertyName"]').fill(`Edit Profile Property ${suffix}`);
  await page.locator('select[name="tripType"]').selectOption("solo");
  await page.getByLabel("city-break").check();
  await rateAllCategories(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: `edit-profile-${suffix}.png`,
    mimeType: "image/png",
    buffer: Buffer.from(`edit-profile-fake-image-${suffix}`),
  });
  await expect(page.getByText("Photos (1/10)")).toBeVisible();

  await page.getByRole("button", { name: "Publish experience" }).click();
  await expect(page).toHaveURL(/\/post\/[^/]+\/[^/]+/);

  const authorHref = await page.locator('a[href^="/u/"]').first().getAttribute("href");
  expect(authorHref).toBeTruthy();
  return authorHref!.replace("/u/", "");
}

test.describe("Story 14 edit profile & avatar upload", () => {
  test("owner can access edit page with pre-populated fields", async ({ page }) => {
    await signUp(page, "Edit Owner");
    const username = await getUsername(page);

    await page.goto(`/u/${username}`);
    await page.getByRole("link", { name: "Edit profile" }).click();
    await expect(page).toHaveURL(`/u/${username}/edit`);

    await expect(page.getByRole("heading", { name: "Update your profile" })).toBeVisible();

    // Fields pre-populated
    const displayNameInput = page.locator('input[name="displayName"]');
    await expect(displayNameInput).toHaveValue("Edit Owner");

    const usernameInput = page.locator('input[name="username"]');
    await expect(usernameInput).toHaveValue(username);
  });

  test("can edit display name and bio", async ({ page }) => {
    await signUp(page, "Bio Updater");
    const username = await getUsername(page);

    await page.goto(`/u/${username}/edit`);

    await page.locator('input[name="displayName"]').fill("Bio Updater Updated");
    await page.locator('textarea[name="bio"]').fill("I love traveling the world!");
    await page.getByRole("button", { name: "Save changes" }).click();

    // Should redirect to profile
    await expect(page).toHaveURL(`/u/${username}`);
    await expect(page.getByRole("heading", { name: "Bio Updater Updated" })).toBeVisible();
    await expect(page.getByText("I love traveling the world!")).toBeVisible();
  });

  test("username change redirects to new profile URL", async ({ page }) => {
    await signUp(page, "Username Changer");
    const username = await getUsername(page);

    const newUsername = `changed-${Date.now().toString(36)}`;

    await page.goto(`/u/${username}/edit`);
    await page.locator('input[name="username"]').fill(newUsername);
    await page.getByRole("button", { name: "Save changes" }).click();

    // Redirected to new username URL
    await expect(page).toHaveURL(`/u/${newUsername}`);
    await expect(page.getByText(`@${newUsername}`, { exact: true })).toBeVisible();
  });

  test("duplicate username shows inline error", async ({ page, context }) => {
    // Create first user
    await signUp(page, "First User DupTest");
    const firstUsername = await getUsername(page);

    // Create second user
    await context.clearCookies();
    await signUp(page, "Second User DupTest");
    const secondUsername = await getUsername(page);

    await page.goto(`/u/${secondUsername}/edit`);
    await page.locator('input[name="username"]').fill(firstUsername);
    await page.getByRole("button", { name: "Save changes" }).click();

    // Should show error, not navigate
    await expect(page.getByText("This username is already taken.")).toBeVisible();
  });

  test("avatar upload updates avatar on profile", async ({ page }) => {
    await signUp(page, "Avatar Tester");
    const username = await getUsername(page);

    await page.goto(`/u/${username}/edit`);

    // Upload avatar
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-avatar-data"),
    });

    // Wait for upload to complete
    await expect(page.getByText("Uploading…")).toBeHidden();

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(`/u/${username}`);

    // Avatar image should be visible on profile
    const avatarImg = page.locator('img[alt="Avatar Tester"]');
    await expect(avatarImg).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page, context }) => {
    await signUp(page, "Auth Redirect Tester");
    const username = await getUsername(page);

    await context.clearCookies();
    await page.goto(`/u/${username}/edit`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("non-owner gets 403 on edit page", async ({ page, context }) => {
    await signUp(page, "Profile Owner");
    const ownerUsername = await getUsername(page);

    await context.clearCookies();
    await signUp(page, "Non-Owner Visitor");

    await page.goto(`/u/${ownerUsername}/edit`);
    await expect(page.getByRole("heading", { name: "Access forbidden" })).toBeVisible();
  });
});
