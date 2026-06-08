import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `post-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUp(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Post Creator");
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
        name: "photo.png",
        mimeType: "image/png",
        buffer: Buffer.from("fake-image"),
      },
    },
  });

  expect(response.status()).toBe(201);
  const payload = (await response.json()) as { url: string };
  expect(payload.url).toMatch(/^\/uploads\//);
  return payload.url;
}

test.describe("Story 6 post creation", () => {
  test("redirects unauthenticated user from /create to /login", async ({ page }) => {
    await page.goto("/create");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows inline required validations", async ({ page }) => {
    await signUp(page);
    await page.goto("/create");

    await page.getByRole("button", { name: "Publish experience" }).click();

    await expect(page.getByText("Title is required.")).toBeVisible();
    await expect(page.getByText("Body is required.")).toBeVisible();
    await expect(page.getByText("City and country are required.")).toBeVisible();
    await expect(page.getByText("Upload at least one photo.")).toBeVisible();
  });

  test("creates a post and redirects to post detail page", async ({ page }) => {
    await signUp(page);
    await page.goto("/create");
    const photoUrl = await uploadPhotoAndGetUrl(page);

    await page.getByLabel("Title").fill("Great beach cabin with sunrise");
    await page.getByLabel("Story").fill("We stayed for 4 nights and loved the ocean view and calm mornings.");
    await page.locator('input[name="locationCity"]').fill("Lisbon");
    await page.locator('input[name="locationCountry"]').fill("Portugal");
    await page.locator('input[name="propertyName"]').fill("Atlantic Breeze Cabin");
    await page.locator('select[name="tripType"]').selectOption("couple");

    await page.getByLabel("beach").check();
    await page.getByLabel("remote-work").check();

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

    await expect(page).toHaveURL(/\/post\//);
    await expect(page.getByRole("heading", { name: "Great beach cabin with sunrise" })).toBeVisible();
  });

  test("server-side rejects more than 5 tags", async ({ page }) => {
    await signUp(page);
    await page.goto("/create");
    const photoUrl = await uploadPhotoAndGetUrl(page);

    await page.getByLabel("Title").fill("Tag stress test");
    await page.getByLabel("Story").fill("Body content for tag validation test.");
    await page.locator('input[name="locationCity"]').fill("Madrid");
    await page.locator('input[name="locationCountry"]').fill("Spain");
    await page.locator('select[name="tripType"]').selectOption("solo");

    await page.evaluate((url) => {
      const form = document.querySelector("form");
      if (!form) return;
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "photoUrls";
      hidden.value = url;
      form.appendChild(hidden);
    }, photoUrl);

    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (!form) return;
      const tags = ["beach", "city-break", "countryside", "luxury", "budget", "pet-friendly"];
      for (const tag of tags) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = "tags";
        hidden.value = tag;
        form.appendChild(hidden);
      }
    });

    await page.getByRole("button", { name: "Publish experience" }).click();
    await expect(page.getByText("Select up to 5 tags.")).toBeVisible();
  });

  test("server-side rejects more than 10 photos", async ({ page }) => {
    await signUp(page);
    await page.goto("/create");

    await page.getByLabel("Title").fill("Photo stress test");
    await page.getByLabel("Story").fill("Body content for photo validation test.");
    await page.locator('input[name="locationCity"]').fill("Rome");
    await page.locator('input[name="locationCountry"]').fill("Italy");
    await page.locator('select[name="tripType"]').selectOption("friends");

    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (!form) return;
      for (let i = 0; i < 11; i += 1) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = "photoUrls";
        hidden.value = `/uploads/fake-${i}.png`;
        form.appendChild(hidden);
      }
    });

    await page.getByRole("button", { name: "Publish experience" }).click();
    await expect(page.getByText("Upload up to 10 photos.")).toBeVisible();
  });

  test("rate limits post creation after 5 posts in 24 hours", async ({ page }) => {
    await signUp(page);

    for (let i = 0; i < 5; i += 1) {
      await page.goto("/create");
      const photoUrl = await uploadPhotoAndGetUrl(page);

      await page.getByLabel("Title").fill(`Rate limit post ${i + 1}`);
      await page.getByLabel("Story").fill("A valid story body for rate-limit testing.");
      await page.locator('input[name="locationCity"]').fill("Berlin");
      await page.locator('input[name="locationCountry"]').fill("Germany");
      await page.locator('select[name="tripType"]').selectOption("solo");

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
      await expect(page).toHaveURL(/\/post\//);
    }

    await page.goto("/create");
    const photoUrl = await uploadPhotoAndGetUrl(page);

    await page.getByLabel("Title").fill("Rate limit post 6");
    await page.getByLabel("Story").fill("A valid story body for rate-limit testing.");
    await page.locator('input[name="locationCity"]').fill("Berlin");
    await page.locator('input[name="locationCountry"]').fill("Germany");
    await page.locator('select[name="tripType"]').selectOption("solo");

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
    await expect(page.getByText("Rate limit reached: you can create up to 5 posts in 24 hours.")).toBeVisible();
  });
});
