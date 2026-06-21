import { expect, test } from "@playwright/test";

const ONBOARDING_PROMPT_DISMISSED_KEY = "trustora.onboardingPrompt.dismissed";

test.describe("Story 4 auth and onboarding UI", () => {
  test("signup page keeps provider hierarchy and login link", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

    await expect(page.getByText("Continue with Google or sign up with email and password.")).toBeVisible();
    await expect(page.getByText("or continue with email")).toBeVisible();

    const loginLink = page.getByRole("link", { name: "Sign in" });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("onboarding prompt can be dismissed", async ({ page }) => {
    await page.goto("/explore");
    await page.evaluate((storageKey) => window.localStorage.removeItem(storageKey), ONBOARDING_PROMPT_DISMISSED_KEY);

    await page.goto("/explore?onboarding=1");

    await expect(page.getByText("Welcome to Trustora.")).toBeVisible();

    await page.getByRole("link", { name: "Dismiss" }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.getByText("Welcome to Trustora.")).toHaveCount(0);
  });
});

