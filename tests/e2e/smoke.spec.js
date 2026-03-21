const { test, expect } = require("@playwright/test");

test.describe("Play for Autism smoke checks", () => {
  test("home page loads and primary navigation is visible", async ({ page }) => {
    await page.goto("/index.html");
    const nav = page.locator(".site-nav");
    await expect(page.getByRole("heading", { name: /Swing for Autism/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Store", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Donate", exact: true })).toBeVisible();
  });

  test("core pages return expected headings", async ({ page }) => {
    const paths = [
      ["/about.html", /Our mission/i],
      ["/events.html", /Events/i],
      ["/contact.html", /Contact us/i]
    ];

    for (const [path, heading] of paths) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("store page renders products and checkout button", async ({ page }) => {
    await page.goto("/store.html");
    await expect(page.locator("#productGrid .product-card")).toHaveCount(4);
    await expect(page.getByRole("button", { name: /Checkout on Square/i })).toBeVisible();
  });

  test("donate page has amount choices and checkout action", async ({ page }) => {
    await page.goto("/donate.html");
    await expect(page.locator(".donation-option")).toHaveCount(4);
    await expect(page.getByRole("button", { name: /Donate on Square/i })).toBeVisible();
  });
});
