import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `post-edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUp(page: import("@playwright/test").Page, name = "Edit Tester") {
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
        name: `photo-${index}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(`fake-image-${index}`),
      },
    },
  });

  expect(response.status()).toBe(201);
  const payload = (await response.json()) as { url: string };
  expect(payload.url).toMatch(/^\/uploads\//);
  return payload.url;
}

async function createPost(page: import("@playwright/test").Page) {
  await page.goto("/create");

  const photoUrl = await uploadPhotoAndGetUrl(page, 0);

  await page.getByLabel("Title").fill("Original beach cabin title");
  await page.getByLabel("Story").fill("We stayed for 4 nights and loved the ocean view.");
  await page.locator('input[name="locationCity"]').fill("Lisbon");
  await page.locator('input[name="locationCountry"]').fill("Portugal");
  await page.locator('input[name="propertyName"]').fill("Atlantic Breeze Cabin");
  await page.locator('select[name="tripType"]').selectOption("couple");
  await page.getByLabel("beach").check();

  await page.evaluate((urls) => {
    const form = document.querySelector("form");
    if (!form) return;
    for (const url of urls) {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "photoUrls";
      hidden.value = url;
      form.appendChild(hidden);
    }
  }, [photoUrl]);

  await page.getByRole("button", { name: "Publish experience" }).click();
  await expect(page).toHaveURL(/\/post\/[^/]+\/[^/]+/);

  const match = page.url().match(/\/post\/([^/]+)\/([^/?#]+)/);
  expect(match).not.toBeNull();

  return { id: match![1], slug: match![2] };
}

test.describe("Story 9 post edit & delete", () => {
  test("author sees edit and delete controls on their post", async ({ page }) => {
    await signUp(page);
    const { id, slug } = await createPost(page);

    await page.goto(`/post/${id}/${slug}`);
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  });

  test("non-author does not see edit/delete controls", async ({ page, context }) => {
    await signUp(page, "Author One");
    const { id, slug } = await createPost(page);

    // Sign out and sign up as a different user
    await context.clearCookies();
    await signUp(page, "Other User");

    await page.goto(`/post/${id}/${slug}`);
    await expect(page.getByRole("link", { name: "Edit", exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Delete", exact: true })).not.toBeVisible();
  });

  test("guest does not see edit/delete controls", async ({ page, context }) => {
    await signUp(page);
    const { id, slug } = await createPost(page);

    await context.clearCookies();
    await page.goto(`/post/${id}/${slug}`);
    await expect(page.getByRole("link", { name: "Edit", exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Delete", exact: true })).not.toBeVisible();
  });

  test("edit form pre-populates existing fields and saves changes", async ({ page }) => {
    await signUp(page);
    const { id } = await createPost(page);

    await page.goto(`/post/${id}/edit`);

    // Verify pre-populated fields
    await expect(page.getByLabel("Title")).toHaveValue("Original beach cabin title");
    await expect(page.getByLabel("Story")).toHaveValue("We stayed for 4 nights and loved the ocean view.");
    await expect(page.locator('input[name="locationCity"]')).toHaveValue("Lisbon");
    await expect(page.locator('input[name="locationCountry"]')).toHaveValue("Portugal");
    await expect(page.locator('input[name="propertyName"]')).toHaveValue("Atlantic Breeze Cabin");
    await expect(page.locator('select[name="tripType"]')).toHaveValue("couple");

    // Edit the title
    await page.getByLabel("Title").clear();
    await page.getByLabel("Title").fill("Updated beach cabin title");

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/post\/[^/]+\/updated-beach-cabin-title/);
    await expect(page.getByRole("heading", { name: "Updated beach cabin title" })).toBeVisible();
  });

  test("unauthenticated user is redirected from edit page to login", async ({ page, context }) => {
    await signUp(page);
    const { id } = await createPost(page);

    await context.clearCookies();
    await page.goto(`/post/${id}/edit`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("non-author gets 403 on edit page", async ({ page, context }) => {
    await signUp(page, "Author One");
    const { id } = await createPost(page);

    await context.clearCookies();
    await signUp(page, "Other User");

    const response = await page.goto(`/post/${id}/edit`);
    expect(response?.status()).toBe(403);
  });

  test("delete shows confirmation dialog and redirects after deletion", async ({ page }) => {
    await signUp(page);
    const { id, slug } = await createPost(page);

    await page.goto(`/post/${id}/${slug}`);
    const deleteButton = page.getByRole("button", { name: "Delete", exact: true });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Confirmation dialog
    const deleteHeading = page.getByRole("heading", { name: "Delete this post?" });
    await expect(deleteHeading).toBeVisible();
    await expect(page.getByText("This action cannot be undone")).toBeVisible();

    // Cancel first
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Delete this post?" })).not.toBeVisible();

    // Actually delete
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await expect(page).toHaveURL(/\/u\//);

    // Post no longer accessible
    const response = await page.goto(`/post/${id}/${slug}`);
    expect(response?.status()).toBe(404);
  });
});
