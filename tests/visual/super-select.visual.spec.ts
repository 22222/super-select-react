/// <reference types="node" />

import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

test.skip(!!process.env.CI, "Visual comparisons are local-only.");

async function waitForStory(page: Page) {
    await page.getByTestId("story-ready").first().waitFor();
}

async function waitForVisualStability(page: Page) {
    await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
    });
}

function story(page: Page, index = 0) {
    return page.getByTestId("story-ready").nth(index);
}

async function expectStableScreenshot(page: Page, locator: Locator, name: string) {
    await waitForVisualStability(page);
    await locator.evaluate(async (element) => {
        let previousBounds = "";
        for (let frame = 0; frame < 10; frame += 1) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const bounds = element.getBoundingClientRect();
            const currentBounds = `${bounds.x},${bounds.y},${bounds.width},${bounds.height}`;
            if (currentBounds === previousBounds) {
                return;
            }
            previousBounds = currentBounds;
        }
    });
    await expect(locator).toHaveScreenshot(name);
}

async function setMode(page: Page, mode: "modal" | "native" | "option-list" | "toggle-button") {
    const targets = page.getByTestId("story-mode-selector").locator(`input[value="${mode}"]`);
    await expect(targets.first()).toBeVisible();

    for (let index = 0; index < (await targets.count()); index += 1) {
        const target = targets.nth(index);
        if (!(await target.isChecked())) {
            await target.click();
        }
    }
}

async function openFirstModal(page: Page) {
    await page.locator('button[aria-haspopup="dialog"]').first().click();
    const dialog = page.locator("dialog[open]").first();
    await expect(dialog).toBeVisible();
    return dialog;
}

test("home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('button[aria-haspopup="dialog"]')).toBeVisible();
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot("home-page.png", { fullPage: true });
});

test("modal mode with closed selects", async ({ page }) => {
    await page.goto("/getting-started");
    await waitForStory(page);
    await setMode(page, "modal");
    await expect(page.locator('button[aria-haspopup="dialog"]').first()).toBeVisible();
    await expectStableScreenshot(page, story(page), "modal-mode-closed.png");
});

test("modal mode with open dialog", async ({ page }) => {
    await page.goto("/getting-started");
    await waitForStory(page);
    await setMode(page, "modal");
    const dialog = await openFirstModal(page);
    await expectStableScreenshot(page, dialog, "modal-mode-open.png");
});

test("option-list mode", async ({ page }) => {
    await page.goto("/getting-started");
    await waitForStory(page);
    await setMode(page, "option-list");
    await expect(page.locator('[role="radiogroup"][aria-label="person"]').getByRole("radio").first()).toBeVisible();
    await expectStableScreenshot(page, story(page), "option-list-mode.png");
});

test("toggle-button mode", async ({ page }) => {
    await page.goto("/getting-started");
    await waitForStory(page);
    await setMode(page, "toggle-button");
    await expect(page.locator('[role="radiogroup"][aria-label="person"]').getByRole("radio").first()).toBeVisible();
    await expectStableScreenshot(page, story(page), "toggle-button-mode.png");
});

test("native mode", async ({ page }) => {
    await page.goto("/getting-started");
    await waitForStory(page);
    await setMode(page, "native");
    await expect(page.locator('select[name="person"]')).toBeVisible();
    await expectStableScreenshot(page, story(page), "native-mode.png");
});

test("grouped option-list mode", async ({ page }) => {
    await page.goto("/getting-started");
    await waitForStory(page);
    await setMode(page, "option-list");
    const groupedExample = story(page)
        .locator("section")
        .filter({ has: page.getByRole("heading", { name: "Grouped Options" }) });
    await expect(groupedExample.getByText("Operations")).toBeVisible();
    await expectStableScreenshot(page, groupedExample, "grouped-option-list.png");
});

test("grouped modal dialog", async ({ page }) => {
    await page.goto("/getting-started");
    await waitForStory(page);
    await setMode(page, "modal");
    await page.locator('select[name="groupedPeople"]').locator('xpath=preceding::button[@aria-haspopup="dialog"][1]').click();
    const dialog = page.locator("dialog[open]").first();
    await expect(dialog.getByText("Operations")).toBeVisible();
    await expectStableScreenshot(page, dialog, "grouped-modal-open.png");
});

test("option source pending state", async ({ page }) => {
    await page.goto("/option-sources");
    await waitForStory(page);
    await setMode(page, "option-list");
    const pendingExample = story(page)
        .locator("section")
        .filter({ has: page.getByRole("heading", { name: "Never Resolves" }) });
    await expect(pendingExample.locator(".super-select__spinner-border.super-select__show").first()).toBeVisible();
    await expectStableScreenshot(page, pendingExample, "option-source-pending.png");
});

test("option source more button", async ({ page }) => {
    await page.goto("/option-sources");
    await waitForStory(page);
    await setMode(page, "option-list");
    const singleSelectExample = story(page)
        .locator("section")
        .filter({ has: page.getByRole("heading", { name: "Single Select" }) });
    await expect(singleSelectExample.getByRole("radio", { name: "Austin" })).toBeVisible();
    await expect(singleSelectExample.getByRole("button", { name: "+" })).toBeVisible();
    await expectStableScreenshot(page, singleSelectExample, "option-source-more-button.png");
});

test("option source overflow-only more indicator", async ({ page }) => {
    await page.goto("/option-sources");
    await waitForStory(page);
    await setMode(page, "modal");
    const limitedPaginationExample = page.locator("section").filter({ has: page.getByRole("heading", { name: "Limited Pagination" }) });
    await limitedPaginationExample.locator('button[aria-haspopup="dialog"]').first().click();
    const dialog = page.locator("dialog[open]").first();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("radio", { name: "Austin" })).toBeVisible();
    await dialog.getByRole("button", { name: "+" }).click();
    await expect(dialog.getByRole("radio", { name: "Denver" })).toBeVisible();
    await dialog.getByRole("button", { name: "+" }).click();
    await expect(dialog.getByText("…", { exact: true })).toBeVisible();
    await expectStableScreenshot(page, dialog, "option-source-overflow-more-indicator.png");
});

test("error and empty states in option-list mode", async ({ page }) => {
    await page.goto("/option-sources");
    await waitForStory(page);
    await setMode(page, "option-list");
    const errorExample = story(page, 2);
    await expect(errorExample.locator(".super-select__alert-danger").first()).toBeVisible();
    await expect(
        errorExample.locator('[role="radiogroup"][aria-label="emptyStateSelect"]').locator(".super-select__alert-info"),
    ).toBeVisible();
    await expectStableScreenshot(page, errorExample, "error-and-empty-option-list.png");
});

test("error and empty states in modal dialogs", async ({ page }) => {
    await page.goto("/option-sources");
    await waitForStory(page);
    await setMode(page, "modal");
    await page.locator('select[name="fetchErrorMessageSelect"]').locator('xpath=preceding::button[@aria-haspopup="dialog"][1]').click();
    const errorDialog = page.locator("dialog[open]").first();
    await expect(errorDialog.locator(".super-select__alert-danger")).toBeVisible();
    await errorDialog.press("Escape");

    await page.locator('select[name="emptyStateSelect"]').locator('xpath=preceding::button[@aria-haspopup="dialog"][1]').click();
    const emptyDialog = page.locator("dialog[open]").first();
    await expect(emptyDialog.locator(".super-select__alert-info")).toBeVisible();
    await expectStableScreenshot(page, emptyDialog, "error-and-empty-modal.png");
});
