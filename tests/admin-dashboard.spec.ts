import { expect, test } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function uniqueMarker(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

type Credentials = {
  email: string;
  password: string;
  displayName: string;
};

const ADMIN_CREDENTIALS = {
  email: "anna@realbnb.local",
  password: "12345678",
};

async function signUp(page: import("@playwright/test").Page, credentials: Credentials) {
  await page.goto("/signup");
  await page.getByLabel("Display name").fill(credentials.displayName);
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.locator('input[name="confirmPassword"]').fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

async function signIn(page: import("@playwright/test").Page, credentials: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

async function uploadPhotoAndGetUrl(page: import("@playwright/test").Page, suffix: string) {
  const response = await page.request.post("/api/upload", {
    multipart: {
      file: {
        name: `admin-${suffix}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(`admin-image-${suffix}`),
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

async function createPost(page: import("@playwright/test").Page, title: string, suffix: string) {
  await page.goto("/create");
  const photoUrl = await uploadPhotoAndGetUrl(page, suffix);

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Story").fill("Story 23 admin moderation test post body.");
  await page.locator('input[name="locationCity"]').fill("AdminCity");
  await page.locator('input[name="locationCountry"]').fill("AdminCountry");
  await page.locator('input[name="propertyName"]').fill("Admin Moderation Place");
  await page.locator('select[name="tripType"]').selectOption("solo");
  await page.getByLabel("city-break", { exact: true }).check();
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

  return new URL(page.url()).pathname;
}

async function reportPost(page: import("@playwright/test").Page, reason: string) {
  const postStats = page.getByRole("region", { name: "Post stats" });
  await postStats.getByRole("button", { name: "Report" }).click();
  await postStats.getByLabel("Reason (optional)").fill(reason);
  await postStats.getByRole("button", { name: "Submit report" }).click();
  await expect(postStats.getByText("Thanks. Your report has been submitted.")).toBeVisible();
}

async function reportFirstComment(page: import("@playwright/test").Page, reason: string) {
  const firstComment = page.getByRole("list", { name: "Comment list" }).locator("li").first();
  await firstComment.getByRole("button", { name: "Report" }).click();
  await firstComment.getByLabel("Reason (optional)").fill(reason);
  await firstComment.getByRole("button", { name: "Submit report" }).click();
  await expect(firstComment.getByText("Thanks. Your report has been submitted.")).toBeVisible();
}

test.describe("Story 23 admin dashboard", () => {
  test("non-admin user gets forbidden access to /admin", async ({ page }) => {
    const user: Credentials = {
      email: uniqueEmail("non-admin"),
      password: "Password123!",
      displayName: "Non Admin User",
    };

    await signUp(page, user);
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Access forbidden" })).toBeVisible();
  });

  test("admin can dismiss, ban, remove and banned user gets clear create/comment rejection", async ({ browser }) => {
    const userCredentials: Credentials = {
      email: uniqueEmail("moderated-user"),
      password: "Password123!",
      displayName: "Moderated User",
    };

    const REASON_REMOVE_POST = uniqueMarker("story23-remove-post");
    const REASON_BAN_USER = uniqueMarker("story23-ban-user");
    const REASON_DISMISS = uniqueMarker("story23-dismiss");

    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();

    await signUp(userPage, userCredentials);

    const primaryPostPath = await createPost(userPage, "Story 23 Primary Post", "primary");

    await userPage.goto(primaryPostPath);
    await userPage.getByLabel("Write a comment").fill("Comment that will trigger moderation.");
    await userPage.getByRole("button", { name: "Post comment" }).click();
    await expect(userPage.getByRole("list", { name: "Comment list" }).locator("li")).toHaveCount(1);

    await reportPost(userPage, REASON_REMOVE_POST);
    await reportFirstComment(userPage, REASON_BAN_USER);

    const secondaryPostPath = await createPost(userPage, "Story 23 Secondary Post", "secondary");
    await userPage.goto(secondaryPostPath);
    await reportPost(userPage, REASON_DISMISS);

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await signIn(adminPage, ADMIN_CREDENTIALS);
    await adminPage.goto("/admin");

    await expect(adminPage.getByRole("heading", { name: "Admin dashboard" })).toBeVisible();
    await adminPage.getByRole("tab", { name: /Reports \(/ }).click();
    await expect(adminPage.getByRole("heading", { name: "Report queue" })).toBeVisible();

    const dismissItem = adminPage.locator("tr, li").filter({ hasText: REASON_DISMISS }).first();
    await dismissItem.getByRole("button", { name: "Dismiss" }).click();
    await expect(adminPage.getByText(REASON_DISMISS)).toHaveCount(0);

    const banItem = adminPage.locator("tr, li").filter({ hasText: REASON_BAN_USER }).first();
    await banItem.getByRole("button", { name: "Ban user" }).click();
    await banItem.getByPlaceholder("Type BAN").fill("BAN");
    await banItem.getByRole("button", { name: "Confirm" }).click();
    await expect(adminPage.getByText(REASON_BAN_USER)).toHaveCount(0);

    const removeItem = adminPage.locator("tr, li").filter({ hasText: REASON_REMOVE_POST }).first();
    await removeItem.getByRole("button", { name: "Remove post" }).click();
    await removeItem.getByPlaceholder("Type REMOVE").fill("REMOVE");
    await removeItem.getByRole("button", { name: "Confirm" }).click();
    await expect(adminPage.getByText(REASON_REMOVE_POST)).toHaveCount(0);

    await userPage.goto("/create");
    const bannedAttemptPhotoUrl = await uploadPhotoAndGetUrl(userPage, "banned-attempt");
    await userPage.getByLabel("Title").fill("Banned create attempt");
    await userPage.getByLabel("Story").fill("This should be rejected after admin ban.");
    await userPage.locator('input[name="locationCity"]').fill("BlockedCity");
    await userPage.locator('input[name="locationCountry"]').fill("BlockedCountry");
    await userPage.locator('select[name="tripType"]').selectOption("solo");
    await userPage.getByLabel("city-break", { exact: true }).check();
    await rateAllCategories(userPage);
    await userPage.evaluate((url) => {
      const form = document.querySelector("form");
      if (!form) {
        return;
      }

      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "photoUrls";
      hidden.value = url;
      form.appendChild(hidden);
    }, bannedAttemptPhotoUrl);
    await userPage.getByRole("button", { name: "Publish experience" }).click();
    await expect(userPage.getByText("Your account is banned. You cannot create posts or comments.")).toBeVisible();

    await userPage.goto(secondaryPostPath);
    await userPage.getByLabel("Write a comment").fill("Trying to comment after ban");
    await userPage.getByRole("button", { name: "Post comment" }).click();
    await expect(userPage.getByText("Your account is banned. You cannot create posts or comments.")).toBeVisible();

    await adminContext.close();
    await userContext.close();
  });
});
