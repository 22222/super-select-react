import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function openTestFixtures(page: Page) {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();
}

function optionListRootByName(page: Page, name: string) {
    return page.locator(`.super-select[aria-label="${name}"]`).first();
}

async function readFetchCount(page: Page) {
    return page.evaluate(() => (window as Window & { __useOptionSourceFetchCount?: number }).__useOptionSourceFetchCount ?? 0);
}

test("useOptionSource keeps one source across rerenders", async ({ page }) => {
    await openTestFixtures(page);

    const root = optionListRootByName(page, "useOptionSourceInlineFetch");
    await expect(root.getByRole("radio", { name: "Alpha" })).toBeVisible();
    const initialFetchCount = await readFetchCount(page);

    const rerenderButton = page.getByRole("button", { name: "Rerender inline fetch" });
    await rerenderButton.click();
    await rerenderButton.click();
    await expect(page.getByTestId("use-option-source-render-count")).toHaveText("3");

    // The source identity is stable, so the rerenders keep the cached first page.
    await expect(root.getByRole("radio", { name: "Alpha" })).toBeVisible();

    // A search bypasses the cache and fetches from the same source.
    await root.locator(".super-select__form-control").fill("alpha");
    await expect(root.getByRole("radio", { name: "Bravo" })).toHaveCount(0);
    await expect(root.getByRole("radio", { name: "Alpha" })).toBeVisible();

    // Only the search fetched; the rerenders did not repeat the first-page request.
    expect(await readFetchCount(page)).toBe(initialFetchCount + 1);
});

test("useOptionSource creates a new source when deps change", async ({ page }) => {
    await openTestFixtures(page);

    const root = optionListRootByName(page, "useOptionSourceDepsReset");
    await expect(root.getByRole("radio", { name: "First Alpha" })).toBeVisible();

    await page.getByRole("button", { name: "Switch source deps" }).click();

    await expect(root.getByRole("radio", { name: "Second Charlie" })).toBeVisible();
    await expect(root.getByRole("radio", { name: "First Alpha" })).toHaveCount(0);
});
