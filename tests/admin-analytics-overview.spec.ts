import { expect, test } from "@playwright/test";

const ADMIN_CREDENTIALS = {
  email: "anna@trustora.local",
  password: "12345678",
};

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signIn(page: import("@playwright/test").Page, credentials: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

async function signUp(page: import("@playwright/test").Page, displayName: string) {
  const email = uniqueEmail("analytics-non-admin");
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

test.describe("Story 23a admin analytics overview", () => {
  test("admin sees overview metrics and can switch to reports tab", async ({ page }) => {
    await signIn(page, ADMIN_CREDENTIALS);
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Admin dashboard" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

    await expect(page.getByText("Total users")).toBeVisible();
    await expect(page.getByText("Total posts")).toBeVisible();
    await expect(page.getByText("Total comments")).toBeVisible();
    await expect(page.getByText("Total likes")).toBeVisible();
    await expect(page.getByText("Active reports")).toBeVisible();
    await expect(page.getByText("Banned users")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Top liked posts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top commented posts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Most active authors" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Most active commenters" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top countries" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top cities" })).toBeVisible();

    await page.getByRole("tab", { name: /Reports \(/ }).click();
    await expect(page.getByRole("heading", { name: "Report queue" })).toBeVisible();
  });

  test("non-admin still receives forbidden on /admin", async ({ page }) => {
    await signUp(page, "Analytics Non Admin");
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Access forbidden" })).toBeVisible();
  });
});

