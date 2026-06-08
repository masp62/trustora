import { expect, test, type Page } from "@playwright/test";

function uniqueEmail() {
  return `upload-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUpAndAuthenticate(page: Page) {
  const email = uniqueEmail();
  const password = "Password123!";

  await page.goto("/signup");
  await page.getByLabel("Display name").fill("Upload Tester");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);

  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore(\?setup=1)?/);
}

test.describe("Story 5a image upload API", () => {
  test("returns 401 for unauthenticated upload", async ({ request }) => {
    const response = await request.post("/api/upload", {
      multipart: {
        file: {
          name: "photo.png",
          mimeType: "image/png",
          buffer: Buffer.from("fake-image-bytes"),
        },
      },
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required" });
  });

  test("uploads a valid image when authenticated", async ({ page }) => {
    await signUpAndAuthenticate(page);

    const response = await page.request.post("/api/upload", {
      multipart: {
        file: {
          name: "photo.png",
          mimeType: "image/png",
          buffer: Buffer.from("fake-image-bytes"),
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ url: expect.stringMatching(/^\/uploads\/[\w-]+\.png$/) });
  });

  test("rejects unsupported file type", async ({ page }) => {
    await signUpAndAuthenticate(page);

    const response = await page.request.post("/api/upload", {
      multipart: {
        file: {
          name: "photo.gif",
          mimeType: "image/gif",
          buffer: Buffer.from("gif-bytes"),
        },
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid file type");
  });

  test("rejects file larger than 5 MB", async ({ page }) => {
    await signUpAndAuthenticate(page);

    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
    const response = await page.request.post("/api/upload", {
      multipart: {
        file: {
          name: "too-large.png",
          mimeType: "image/png",
          buffer: oversizedBuffer,
        },
      },
    });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "File size exceeds 5 MB limit" });
  });
});
