import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signUp(page: import("@playwright/test").Page, name = "Report Tester") {
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
        name: "report-photo.png",
        mimeType: "image/png",
        buffer: Buffer.from("report-image"),
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
  await page.goto("/create");

  const photoUrl = await uploadPhotoAndGetUrl(page);

  await page.getByLabel("Title").fill("Story 21 report target post");
  await page.getByLabel("Story").fill("Post used to verify report controls for posts and comments.");
  await page.locator('input[name="locationCity"]').fill("Hamburg");
  await page.locator('input[name="locationCountry"]').fill("Germany");
  await page.locator('input[name="propertyName"]').fill("Report Test Loft");
  await page.locator('select[name="tripType"]').selectOption("friends");
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

  const match = page.url().match(/\/post\/([^/]+)\/([^/?#]+)/);
  expect(match).not.toBeNull();

  return {
    canonicalPath: `/post/${match![1]}/${match![2]}`,
  };
}

test.describe("Story 21 report post and comment", () => {
  test("logged-in user can report post and comment once", async ({ page }) => {
    await signUp(page, "Report Logged In User");
    const post = await createPost(page);

    await page.goto(post.canonicalPath);

    await page.getByLabel("Write a comment").fill("Comment that will be reported.");
    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(page.getByRole("list", { name: "Comment list" }).locator("li")).toHaveCount(1);

    const postStats = page.getByRole("region", { name: "Post stats" });
    await postStats.getByRole("button", { name: "Report" }).click();
    await page.getByLabel("Reason (optional)").fill("Spam content in post");
    await page.getByRole("button", { name: "Submit report" }).click();
    await expect(postStats.getByText("Thanks. Your report has been submitted.")).toBeVisible();

    await postStats.getByRole("button", { name: "Report" }).click();
    await page.getByLabel("Reason (optional)").fill("Duplicate report should be ignored");
    await page.getByRole("button", { name: "Submit report" }).click();
    await expect(postStats.getByText("You already reported this.")).toBeVisible();

    const firstComment = page.getByRole("list", { name: "Comment list" }).locator("li").first();
    await firstComment.getByRole("button", { name: "Report" }).click();
    await firstComment.getByLabel("Reason (optional)").fill("Offensive language");
    await firstComment.getByRole("button", { name: "Submit report" }).click();
    await expect(firstComment.getByText("Thanks. Your report has been submitted.")).toBeVisible();

    await firstComment.getByRole("button", { name: "Report" }).click();
    await firstComment.getByRole("button", { name: "Submit report" }).click();
    await expect(firstComment.getByText("You already reported this.")).toBeVisible();
  });

  test("guests do not see report controls", async ({ page, context }) => {
    await signUp(page, "Report Guest Visibility Author");
    const post = await createPost(page);

    await page.goto(post.canonicalPath);
    await page.getByLabel("Write a comment").fill("Comment visible to guests");
    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(page.getByRole("list", { name: "Comment list" }).locator("li")).toHaveCount(1);

    await context.clearCookies();
    await page.goto(post.canonicalPath);

    await expect(page.getByRole("region", { name: "Post stats" }).getByRole("button", { name: "Report" })).toHaveCount(0);
    await expect(
      page.getByRole("list", { name: "Comment list" }).locator("li").first().getByRole("button", { name: "Report" }),
    ).toHaveCount(0);
  });
});