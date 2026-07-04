import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function openTestFixtures(page: Page) {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();
}

test("active option-list starts loading when optionSource is added after mount", async ({ page }) => {
    await page.addInitScript(() => {
        (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames = [];
        (window as Window & { __transitionEmptyNames?: string[] }).__transitionEmptyNames = [];
    });
    await openTestFixtures(page);

    await page.evaluate(() => {
        (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames = [];
        (window as Window & { __transitionEmptyNames?: string[] }).__transitionEmptyNames = [];
    });
    await page.getByRole("button", { name: "Enable source" }).first().click();

    const optionList = page.locator('[role="radiogroup"][aria-label="activeOptionSourceTransition"]');
    await expect(optionList.getByRole("radio", { name: "Alpha" })).toBeVisible();

    const pendingNames = await page.evaluate(
        () => (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames ?? [],
    );
    const emptyNames = await page.evaluate(() => (window as Window & { __transitionEmptyNames?: string[] }).__transitionEmptyNames ?? []);
    expect(pendingNames).toContain("activeOptionSourceTransition");
    expect(emptyNames).toEqual([]);
});

test("unsupported mode starts fallback loading when optionSource is added after mount", async ({ page }) => {
    await page.addInitScript(() => {
        (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames = [];
    });
    await openTestFixtures(page);

    await page.evaluate(() => {
        (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames = [];
    });
    await page.getByRole("button", { name: "Enable source" }).nth(1).click();

    const toggleButtons = page.locator('[role="radiogroup"][aria-label="unsupportedModeOptionSourceTransition"]');
    await expect(toggleButtons.getByRole("radio", { name: "Alpha" })).toBeVisible();

    const pendingNames = await page.evaluate(
        () => (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames ?? [],
    );
    expect(pendingNames).toContain("unsupportedModeOptionSourceTransition");
});

test("active option-list starts loading when optionSource is replaced", async ({ page }) => {
    await page.addInitScript(() => {
        (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames = [];
    });
    await openTestFixtures(page);

    const optionList = page.locator('[role="radiogroup"][aria-label="activeOptionSourceReplacement"]');
    await expect(optionList.getByRole("radio", { name: "Alpha" })).toBeVisible();

    await page.evaluate(() => {
        (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames = [];
    });
    await page.getByRole("button", { name: "Replace source" }).click();
    await expect(optionList.getByRole("radio", { name: "Charlie" })).toBeVisible();

    const pendingNames = await page.evaluate(
        () => (window as Window & { __transitionPendingNames?: string[] }).__transitionPendingNames ?? [],
    );
    expect(pendingNames).toContain("activeOptionSourceReplacement");
});

test("mode resolver does not receive stale options when optionSource is replaced", async ({ page }) => {
    await page.addInitScript(() => {
        (window as Window & { __modeResolverOptionLabels?: string[] }).__modeResolverOptionLabels = [];
    });
    await openTestFixtures(page);

    const nativeSelect = page.locator('select[name="modeResolverOptionSourceReplacement"]');
    await expect(nativeSelect.locator('option[value="alpha"]')).toHaveText("Alpha");

    await page.evaluate(() => {
        (window as Window & { __modeResolverOptionLabels?: string[] }).__modeResolverOptionLabels = [];
    });
    await page.getByRole("button", { name: "Replace resolver source" }).click();
    await expect(nativeSelect.locator('option[value="charlie"]')).toHaveText("Charlie");

    const resolverOptionLabels = await page.evaluate(
        () => (window as Window & { __modeResolverOptionLabels?: string[] }).__modeResolverOptionLabels ?? [],
    );
    expect(resolverOptionLabels).toContain("");
    expect(resolverOptionLabels).toContain("Charlie,Delta");
    expect(resolverOptionLabels).not.toContain("Alpha,Bravo");
});

test("removing optionSource clears pending label resolution", async ({ page }) => {
    await openTestFixtures(page);

    const trigger = page.getByRole("button", { name: "removePendingResolveSource" });
    await expect(trigger).toHaveAttribute("aria-busy", "true");

    await page.getByRole("button", { name: "Remove source" }).click();

    await expect(trigger).not.toHaveAttribute("aria-busy", "true");
});

test("replacing optionSource ignores an old pending pagination result", async ({ page }) => {
    await openTestFixtures(page);

    const optionList = page.locator('[role="radiogroup"][aria-label="replaceSourceDuringPagination"]');
    await expect(optionList.getByRole("radio", { name: "First Alpha" })).toBeVisible();

    await optionList.getByRole("button", { name: "+" }).click();
    await page.getByRole("button", { name: "Replace paginated source" }).click();
    await expect(optionList.getByRole("radio", { name: "Second Alpha" })).toBeVisible();

    await page.getByRole("button", { name: "Resolve old page" }).click();
    await expect(optionList.getByRole("radio", { name: "First Bravo" })).toHaveCount(0);
});
