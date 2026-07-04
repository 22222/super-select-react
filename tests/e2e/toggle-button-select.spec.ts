import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const storyRouteMap: Record<string, string> = {
    "basic--basic": "/getting-started",
    "multi-value-label-layout--multi-value-label-layout": "/test-fixtures",
    "async-features--async-features": "/option-sources",
    "error-handling--error-handling": "/option-sources",
    "grouped-basic--grouped-basic": "/getting-started",
    "grouped-async--grouped-async": "/option-sources",
    "search-visibility--search-visibility": "/test-fixtures",
    "wrapping-behavior--wrapping-behavior": "/getting-started",
    "accessibility-naming--accessibility-naming": "/configuration",
    "form-behavior--form-behavior": "/test-fixtures",
    "configuration--configuration": "/configuration",
    "mode-resolution--mode-resolution": "/modes",
    "async-first-page-fallback--async-first-page-fallback": "/test-fixtures",
    "customization--customization": "/customization-bootstrap",
};

async function openStory(page: Page, storyId: string) {
    const route = storyRouteMap[storyId];
    if (!route) {
        throw new Error(`Unknown story route for id: ${storyId}`);
    }
    await page.goto(route);
    await page.getByTestId("story-ready").first().waitFor();
}
async function setStoryMode(page: Page, mode: "modal" | "native" | "option-list" | "toggle-button" | undefined) {
    const selectors = page.getByTestId("story-mode-selector");
    await expect(selectors.first()).toBeVisible();

    if (!mode) {
        const checkedInputs = selectors.locator('input[type="radio"]:checked');
        if ((await checkedInputs.count()) > 0) {
            await checkedInputs.first().click();
        }
        return;
    }

    const targets = selectors.locator(`input[type="radio"][value="${mode}"]`);
    await expect(targets.first()).toBeVisible();

    for (let index = 0; index < (await targets.count()); index += 1) {
        const target = targets.nth(index);
        if (!(await target.isChecked())) {
            await target.click();
        }
    }
}

async function openToggleStory(page: Page, storyId: string) {
    await openStory(page, storyId);
    await setStoryMode(page, "toggle-button");
}

function toggleGroupRootByName(page: Page, name: string) {
    return page.locator(`[role="radiogroup"][aria-label="${name}"], [role="group"][aria-label="${name}"]`);
}

test("basic story single-select updates checked radio", async ({ page }) => {
    await openToggleStory(page, "basic--basic");

    const singleRoot = toggleGroupRootByName(page, "person");

    await singleRoot.getByRole("radio", { name: /adrian pennino/i }).check();
    await expect(singleRoot.getByRole("radio", { name: /adrian pennino/i })).toBeChecked();

    await singleRoot.getByRole("radio", { name: /apollo creed/i }).check();
    await expect(singleRoot.getByRole("radio", { name: /apollo creed/i })).toBeChecked();
    await expect(singleRoot.getByRole("radio", { name: /adrian pennino/i })).not.toBeChecked();

    await singleRoot.getByRole("radio", { name: /apollo creed/i }).click();
    await expect(singleRoot.getByRole("radio", { name: /apollo creed/i })).not.toBeChecked();
});

test("basic story multi-select toggles multiple checkboxes", async ({ page }) => {
    await openToggleStory(page, "basic--basic");

    const multiRoot = toggleGroupRootByName(page, "people");
    await multiRoot.getByRole("checkbox", { name: /robert balboa/i }).check();
    await multiRoot.getByRole("checkbox", { name: /apollo creed/i }).check();
    await multiRoot.getByRole("checkbox", { name: /robert balboa/i }).uncheck();

    const selectedValues = await multiRoot
        .locator('input[type="checkbox"]:checked')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value).sort());

    expect(selectedValues).toEqual(["apollo-creed"]);
});

test("grouped story renders optgroups as separate button groups", async ({ page }) => {
    await openToggleStory(page, "grouped-basic--grouped-basic");

    const groupedRoot = toggleGroupRootByName(page, "groupedPeople");
    const radios = groupedRoot.locator('input[type="radio"]');
    const buttonGroups = groupedRoot.locator(".super-select__btn-group");

    await expect(radios).toHaveCount(9);
    await expect(buttonGroups).toHaveCount(3);
    await expect(groupedRoot.getByRole("radio", { name: /apollo creed/i })).toBeVisible();
    await expect(groupedRoot.getByRole("radio", { name: /paolo pennino/i })).toBeVisible();
});

test("form behavior blocks required submit and includes selected values in payload", async ({ page }) => {
    await openToggleStory(page, "form-behavior--form-behavior");

    await page.getByTestId("toggle-group-single-submit").click();
    await expect(page.getByTestId("toggle-group-single-submit-count")).toHaveText("Submit count: 0");
    await expect(page.getByTestId("toggle-group-single-invalid-count")).toHaveText("Invalid count: 1");

    const singleRoot = toggleGroupRootByName(page, "singleToggleRequired");
    await singleRoot.getByRole("radio", { name: /adrian pennino/i }).check();
    await page.getByTestId("toggle-group-single-submit").click();
    await expect(page.getByTestId("toggle-group-single-submit-count")).toHaveText("Submit count: 1");
    await expect(page.getByTestId("toggle-group-single-payload")).toHaveText("Payload: adrian-pennino");

    await page.getByTestId("toggle-group-multi-submit").click();
    await expect(page.getByTestId("toggle-group-multi-submit-count")).toHaveText("Submit count: 0");

    const multiRoot = toggleGroupRootByName(page, "multiToggleRequired");
    await multiRoot.getByRole("checkbox", { name: /robert balboa/i }).check();
    await multiRoot.getByRole("checkbox", { name: /apollo creed/i }).check();

    await page.getByTestId("toggle-group-multi-submit").click();
    await expect(page.getByTestId("toggle-group-multi-submit-count")).toHaveText("Submit count: 1");
    await expect(page.getByTestId("toggle-group-multi-payload")).toHaveText("Payload: apollo-creed,robert-balboa");
});
