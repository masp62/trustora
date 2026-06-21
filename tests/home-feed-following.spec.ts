import { expect, test } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

type Credentials = {
  email: string;
  password: string;
  displayName: string;
};

function makeCredentials(prefix: string, displayName: string): Credentials {
  return {
    email: uniqueEmail(prefix),
    password: "Password123!",
    displayName,
  };
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function signUp(page: import("@playwright/test").Page, credentials: Credentials) {
  await page.goto("/signup");
  await page.getByLabel("Display name").fill(credentials.displayName);
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.locator('input[name="confirmPassword"]').fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

async function signIn(page: import("@playwright/test").Page, credentials: Credentials) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/explore/);
}

async function uploadPhotoAndGetUrl(page: import("@playwright/test").Page) {
  const response = await page.request.post("/api/upload", {
    multipart: {
      file: {
        name: "home-feed-photo.png",
        mimeType: "image/png",
        buffer: Buffer.from("home-feed-image"),
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

async function createPost(page: import("@playwright/test").Page, title: string) {
  await page.goto("/create");
  const photoUrl = await uploadPhotoAndGetUrl(page);

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Story").fill("Story 17 home feed coverage post body.");
  await page.locator('input[name="locationCity"]').fill("HomeCity");
  await page.locator('input[name="locationCountry"]').fill("HomeCountry");
  await page.locator('input[name="propertyName"]').fill("Home Feed Place");
  await page.locator('select[name="tripType"]').selectOption("solo");
  await page.getByLabel("city-break").check();
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

  const postPath = new URL(page.url()).pathname;
  const profileHref = await page.locator('a[href^="/u/"]').first().getAttribute("href");
  expect(profileHref).toBeTruthy();

  return {
    title,
    postPath,
    authorUsername: profileHref!.replace("/u/", ""),
  };
}

async function followUserFromProfile(page: import("@playwright/test").Page, username: string) {
  await page.goto(`/u/${username}`);
  const followButton = page.getByRole("button", { name: `Follow @${username}` });

  if (await followButton.count()) {
    await followButton.click();
    await expect(page.getByRole("button", { name: `Unfollow @${username}` })).toBeVisible();
  }
}

test.describe("Story 17 home feed", () => {
  test("redirects unauthenticated visitors from / to /explore", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/explore/);
  });

  test("shows empty-state prompt when user follows nobody", async ({ page }) => {
    const viewer = makeCredentials("home-empty", "Home Empty Viewer");
    await signUp(page, viewer);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Your feed is empty" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse /explore" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Discover travelers" })).toBeVisible();
  });

  test("shows followed users posts in reverse chronology, supports infinite scroll, and updates on navigation", async ({ page }) => {
    const author = makeCredentials("home-author", "Home Feed Author");
    const viewer = makeCredentials("home-viewer", "Home Feed Viewer");

    await signUp(page, author);
    const older = await createPost(page, `Story17 Older ${uniqueSuffix()}`);
    const newer = await createPost(page, `Story17 Newer ${uniqueSuffix()}`);

    await page.context().clearCookies();
    await signUp(page, viewer);

    await page.goto(newer.postPath);
    await page.getByRole("button", { name: `Follow @${newer.authorUsername}` }).click();
    await expect(page.getByRole("button", { name: `Unfollow @${newer.authorUsername}` })).toBeVisible();

    await page.route("**/api/home?**", async (route) => {
      const requestUrl = route.request().url();
      if (requestUrl.includes("cursor=")) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      await route.continue();
    });

    await page.goto("/explore");
    const profileLinks = await page.locator('a[href^="/u/"]').evaluateAll((nodes) =>
      Array.from(new Set(nodes
        .map((node) => node.getAttribute("href"))
        .filter((value): value is string => Boolean(value))
        .map((value) => value.replace("/u/", "")))),
    );

    for (const username of profileLinks.slice(0, 7)) {
      if (username !== newer.authorUsername) {
        await followUserFromProfile(page, username);
      }
    }

    await page.goto("/");

    const olderHeading = page.getByRole("heading", { name: older.title }).first();
    const newerHeading = page.getByRole("heading", { name: newer.title }).first();
    await expect(newerHeading).toBeVisible();
    await expect(olderHeading).toBeVisible();

    const cardTitles = await page.locator("article h3").allTextContents();
    const olderIndex = cardTitles.findIndex((title) => title.includes(older.title));
    const newerIndex = cardTitles.findIndex((title) => title.includes(newer.title));
    expect(olderIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeLessThan(olderIndex);

    const initialCardCount = await page.locator("article").count();
    expect(initialCardCount).toBeGreaterThanOrEqual(2);

    if (initialCardCount >= 20) {
      await page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
      });
      await expect(page.getByText("Loading more stories...")).toBeVisible();
      await expect
        .poll(async () => page.locator("article").count())
        .toBeGreaterThan(initialCardCount);
    }

    await page.context().clearCookies();
    await signIn(page, author);
    await createPost(page, `Story17 Latest ${uniqueSuffix()}`);

    await page.context().clearCookies();
    await signIn(page, viewer);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Story17 Latest/ })).toBeVisible();
  });
});
