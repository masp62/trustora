import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `post-detail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUp(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Post Viewer");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);
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

async function createPost(page: import("@playwright/test").Page, options?: { photoCount?: number }) {
  const photoCount = options?.photoCount ?? 1;

  await signUp(page);
  await page.goto("/create");

  const photoUrls: string[] = [];
  for (let i = 0; i < photoCount; i += 1) {
    photoUrls.push(await uploadPhotoAndGetUrl(page, i));
  }

  await page.getByLabel("Title").fill("Great beach cabin with sunrise");
  await page.getByLabel("Story").fill("We stayed for 4 nights and loved the ocean view and calm mornings.");
  await page.locator('input[name="locationCity"]').fill("Lisbon");
  await page.locator('input[name="locationCountry"]').fill("Portugal");
  await page.locator('input[name="propertyName"]').fill("Atlantic Breeze Cabin");
  await page.locator('select[name="tripType"]').selectOption("couple");
  await page.getByLabel("beach").check();
  await page.getByLabel("remote-work").check();

  await page.evaluate((urls) => {
    const form = document.querySelector("form");
    if (!form) {
      return;
    }

    for (const url of urls) {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "photoUrls";
      hidden.value = url;
      form.appendChild(hidden);
    }
  }, photoUrls);

  await page.getByRole("button", { name: "Publish experience" }).click();
  await expect(page).toHaveURL(/\/post\/[^/]+\/[^/]+/);

  const match = page.url().match(/\/post\/([^/]+)\/([^/?#]+)/);
  expect(match).not.toBeNull();

  const id = match![1];
  const slug = match![2];
  const canonicalPath = `/post/${id}/${slug}`;

  return { id, slug, canonicalPath };
}

test.describe("Story 7 post detail page", () => {
  test("allows public visitors to view canonical post detail with metadata", async ({ page }) => {
    const { canonicalPath } = await createPost(page);

    await page.context().clearCookies();
    await page.goto(canonicalPath);

    await expect(page.getByRole("heading", { name: "Great beach cabin with sunrise" })).toBeVisible();
    await expect(page).toHaveTitle(/Great beach cabin with sunrise/);
    await expect(page.locator('a[href^="/u/"]')).toBeVisible();
    await expect(page.getByText("Comments (0)")).toBeVisible();
  });

  test("redirects /post/[id] and /post/[id]/wrong-slug to canonical URL with 308", async ({ page }) => {
    const { id, canonicalPath } = await createPost(page);

    const byIdResponse = await page.request.get(`/post/${id}`, { maxRedirects: 0 });
    expect(byIdResponse.status()).toBe(308);
    expect(byIdResponse.headers().location).toBe(canonicalPath);

    const wrongSlugResponse = await page.request.get(`/post/${id}/wrong-slug`, { maxRedirects: 0 });
    expect(wrongSlugResponse.status()).toBe(308);
    expect(wrongSlugResponse.headers().location).toBe(canonicalPath);
  });

  test("photo gallery lets users browse all uploaded images", async ({ page }) => {
    await createPost(page, { photoCount: 2 });

    const gallery = page.getByRole("region", { name: "Photo gallery" });

    await expect(gallery.getByText("2 photos")).toBeVisible();
    await expect(gallery.getByRole("img", { name: /Great beach cabin with sunrise photo/ })).toHaveCount(2);
  });
});
