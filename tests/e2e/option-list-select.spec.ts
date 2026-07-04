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

async function openOptionListStory(page: Page, storyId: string) {
    await openStory(page, storyId);
    await setStoryMode(page, "option-list");
}

function optionListRootByName(page: Page, name: string) {
    return page.locator(`.super-select[aria-label="${name}"]`).first();
}

function optionRows(root: ReturnType<typeof optionListRootByName>) {
    return root.locator(".super-select__list-group-item-action");
}

function searchInput(root: ReturnType<typeof optionListRootByName>) {
    return root.locator(".super-select__form-control");
}

function loadMoreButton(root: ReturnType<typeof optionListRootByName>) {
    return root.getByRole("button", { name: "+" }).first();
}

async function loadNextOptionListPage(root: ReturnType<typeof optionListRootByName>) {
    const loadMore = loadMoreButton(root);
    if ((await loadMore.count()) > 0) {
        await loadMore.click();
        return;
    }

    await root.locator(".super-select__list-group").evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
}

function retryButton(root: ReturnType<typeof optionListRootByName>) {
    return root.getByRole("button", { name: "\u21BB" }).first();
}

test("load more does not submit a containing form", async ({ page }) => {
    await page.goto("/test-fixtures");

    const form = page.getByTestId("load-more-form");
    await form.waitFor();
    await form.getByRole("button", { name: "+" }).click();

    await expect(page.getByTestId("load-more-form-submit-count")).toHaveText("0");
});

test("custom pagination limit controls when the overflow indicator appears", async ({ page }) => {
    await page.goto("/test-fixtures");
    const fixture = page.locator("section").filter({ has: page.getByRole("heading", { name: "Custom Pagination Limit" }) });

    await expect(fixture.getByRole("radio", { name: "Alpha" })).toBeVisible();
    await fixture.getByRole("button", { name: "Load another page" }).click();

    await expect(fixture.getByRole("radio", { name: "Bravo" })).toBeVisible();
    await expect(fixture.getByText("More options remain")).toBeVisible();
    await expect(fixture.getByRole("button", { name: "Load another page" })).toHaveCount(0);
    await expect(fixture.getByRole("radio", { name: "Charlie" })).toHaveCount(0);
});

test("basic story hides search by default and single-select updates value", async ({ page }) => {
    await openOptionListStory(page, "basic--basic");

    const singleRoot = optionListRootByName(page, "person");
    await expect(searchInput(singleRoot)).toHaveCount(0);

    await singleRoot.getByRole("radio", { name: /adrian pennino/i }).check();
    await expect(singleRoot.getByRole("radio", { name: /adrian pennino/i })).toBeChecked();
});

test("basic story multi-select toggles multiple values", async ({ page }) => {
    await openOptionListStory(page, "basic--basic");

    const multiRoot = optionListRootByName(page, "people");
    await multiRoot.getByRole("checkbox", { name: /robert balboa/i }).check();
    await multiRoot.getByRole("checkbox", { name: /apollo creed/i }).check();

    const selectedValues = await page
        .locator('input[type="checkbox"][name="people"]:checked')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value).sort());

    expect(selectedValues).toEqual(["apollo-creed", "robert-balboa"]);
});

test("native keyboard works after tabbing from search into radios and checkboxes", async ({ page }) => {
    await openOptionListStory(page, "async-features--async-features");

    const singleRoot = optionListRootByName(page, "asyncCity");
    await expect(singleRoot.getByRole("radio", { name: /austin/i })).toBeVisible();
    const singleSearch = searchInput(singleRoot);
    await singleSearch.focus();
    await page.keyboard.press("Tab");

    const firstRadio = singleRoot.getByRole("radio", { name: /austin/i });
    await expect(firstRadio).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(singleRoot.getByRole("radio", { name: /boston/i })).toBeChecked();

    const multiRoot = optionListRootByName(page, "asyncCities");
    await expect(multiRoot.getByRole("checkbox", { name: /austin/i })).toBeVisible();
    const multiSearch = searchInput(multiRoot);
    await multiSearch.focus();
    await page.keyboard.press("Tab");

    const firstCheckbox = multiRoot.getByRole("checkbox", { name: /austin/i });
    await expect(firstCheckbox).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(firstCheckbox).toBeFocused();
    await expect(firstCheckbox).not.toBeChecked();

    await page.keyboard.press("Space");
    await expect(firstCheckbox).toBeChecked();
    await page.keyboard.press("Space");
    await expect(firstCheckbox).not.toBeChecked();
});

test("grouped story renders headers for grouped options", async ({ page }) => {
    await openOptionListStory(page, "grouped-basic--grouped-basic");

    const groupedRoot = optionListRootByName(page, "groupedPeople");
    const headers = groupedRoot.locator(".super-select__list-group-item-secondary");
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toHaveText("Operations");
    await expect(headers.nth(1)).toHaveText("Training");
    await expect(headers.nth(2)).toHaveText("Personal");
});

test("grouped option source renders headers from groupLabel", async ({ page }) => {
    await openOptionListStory(page, "grouped-async--grouped-async");

    const groupedRoot = optionListRootByName(page, "groupedPeopleAsync");
    const headers = groupedRoot.locator(".super-select__list-group-item-secondary");
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toHaveText("Operations");
    await expect(headers.nth(1)).toHaveText("Training");
    await expect(headers.nth(2)).toHaveText("Personal");
});

test("async story auto-shows search for paginated source and supports native keyboard selection", async ({ page }) => {
    await openOptionListStory(page, "async-features--async-features");

    const singleRoot = optionListRootByName(page, "asyncCity");
    await expect(optionRows(singleRoot).first()).toBeVisible({ timeout: 10000 });
    await expect(singleRoot.getByRole("radio", { name: /austin/i })).toBeVisible();
    await expect(searchInput(singleRoot)).toBeVisible();

    const search = searchInput(singleRoot);
    await search.focus();
    await page.keyboard.press("Tab");
    await expect(singleRoot.getByRole("radio", { name: /austin/i })).toBeFocused();
    await page.keyboard.press("Space");

    await expect(singleRoot.locator('input[type="radio"]:checked')).toHaveCount(1);
    await expect(search).toHaveValue("");
});

test("async story supports search filtering", async ({ page }) => {
    await openOptionListStory(page, "async-features--async-features");

    const singleRoot = optionListRootByName(page, "asyncCity");
    await expect(singleRoot.getByRole("radio", { name: /austin/i })).toBeVisible();

    const search = searchInput(singleRoot);
    await search.fill("san");
    await expect(singleRoot.getByRole("radio", { name: /san antonio/i })).toBeVisible();
    await expect(singleRoot.getByRole("radio", { name: /austin/i })).toHaveCount(0);
});

test("async story supports manual pagination and overflow indicator", async ({ page }) => {
    await openOptionListStory(page, "async-features--async-features");

    const singleRoot = optionListRootByName(page, "asyncCity");
    await expect(singleRoot.getByRole("radio", { name: /austin/i })).toBeVisible();

    const list = singleRoot.locator(".super-select__list-group");
    await list.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
    const firstPageCount = await optionRows(singleRoot).count();
    await loadNextOptionListPage(singleRoot);
    await expect.poll(async () => optionRows(singleRoot).count()).toBeGreaterThan(firstPageCount);
    await loadNextOptionListPage(singleRoot);
});

test("icon-only action buttons use visible symbol text and no redundant aria-label", async ({ page }) => {
    await openOptionListStory(page, "async-features--async-features");

    const singleRoot = optionListRootByName(page, "asyncCity");
    const loadMore = loadMoreButton(singleRoot);
    await expect(loadMore).toBeVisible();
    await expect(loadMore).not.toHaveAttribute("aria-label");

    await openOptionListStory(page, "error-handling--error-handling");

    const errorRoot = optionListRootByName(page, "fetchErrorMessageSelect");
    const retry = retryButton(errorRoot);
    await expect(retry).toBeVisible();
    await expect(retry).not.toHaveAttribute("aria-label");

    const emptyRoot = optionListRootByName(page, "emptyStateSelect");
    const refresh = retryButton(emptyRoot);
    await expect(refresh).toBeVisible();
    await expect(refresh).not.toHaveAttribute("aria-label");
});

test("custom error indicator receives option source metadata", async ({ page }) => {
    await openOptionListStory(page, "error-handling--error-handling");

    const errorRoot = optionListRootByName(page, "fetchErrorMessageSelect");
    const message = errorRoot.getByTestId("option-source-error-message");
    await expect(message).toHaveAttribute("data-error-code", "server");
    await expect(message).toHaveAttribute("data-http-status", "503");
});

test("option list sets aria-busy while loading and clears when settled", async ({ page }) => {
    await openOptionListStory(page, "async-features--async-features");

    const singleRoot = optionListRootByName(page, "asyncCity");
    const list = singleRoot.locator(".super-select__list-group");
    await expect(list).toHaveAttribute("aria-busy", "true");
    await expect(singleRoot.getByRole("radio", { name: /austin/i })).toBeVisible();
    await expect(list).not.toHaveAttribute("aria-busy", "true");
});

test("option source does not render empty state before the initial page starts loading", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    await page.evaluate(() => {
        (window as Window & { __asyncCityLoadingIndicatorRendered?: boolean }).__asyncCityLoadingIndicatorRendered = false;
        (window as Window & { __sawAsyncCityEmptyMarker?: boolean }).__sawAsyncCityEmptyMarker = false;
        const observer = new MutationObserver(() => {
            if (document.querySelector("[aria-label='asyncCity'] [data-testid='async-city-empty-marker']")) {
                (window as Window & { __sawAsyncCityEmptyMarker?: boolean }).__sawAsyncCityEmptyMarker = true;
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });

    await setStoryMode(page, "option-list");

    const singleRoot = optionListRootByName(page, "asyncCity");
    await expect(singleRoot.getByRole("radio", { name: /austin/i })).toBeVisible();

    const loadingIndicatorRendered = await page.evaluate(
        () => (window as Window & { __asyncCityLoadingIndicatorRendered?: boolean }).__asyncCityLoadingIndicatorRendered,
    );
    const sawEmptyMarker = await page.evaluate(
        () => (window as Window & { __sawAsyncCityEmptyMarker?: boolean }).__sawAsyncCityEmptyMarker,
    );
    expect(loadingIndicatorRendered).toBe(true);
    expect(sawEmptyMarker).toBe(false);
});

test("initial async option source examples do not render empty state before loading", async ({ page }) => {
    await page.addInitScript(() => {
        (window as Window & { __initialMountPendingModes?: string[] }).__initialMountPendingModes = [];
        (window as Window & { __initialMountEmptyModes?: string[] }).__initialMountEmptyModes = [];
    });
    await openStory(page, "async-features--async-features");

    const modalTrigger = page
        .locator('select[name="initialMountModalValues"]')
        .locator('xpath=preceding::button[@aria-haspopup="dialog"][1]');
    await expect(modalTrigger).toBeVisible();
    await modalTrigger.click();
    const modalDialog = page.locator("dialog[open]").first();
    await expect(modalDialog.getByRole("radio", { name: "Archived" })).toBeVisible();

    const optionListRoot = optionListRootByName(page, "initialMountOptionListValues");
    await expect(optionListRoot.getByRole("radio", { name: "Archived" })).toBeVisible();

    const toggleButtonRoot = page.locator('[role="radiogroup"][aria-label="initialMountToggleButtonValues"]');
    await expect(toggleButtonRoot.getByRole("radio", { name: "Archived" })).toBeVisible();

    const pendingModes = await page.evaluate(
        () => (window as Window & { __initialMountPendingModes?: string[] }).__initialMountPendingModes ?? [],
    );
    const emptyModes = await page.evaluate(
        () => (window as Window & { __initialMountEmptyModes?: string[] }).__initialMountEmptyModes ?? [],
    );
    expect(new Set(pendingModes)).toEqual(new Set(["modal", "option-list", "toggle-button"]));
    expect(emptyModes.filter((mode) => mode !== "modal")).toEqual([]);
});

test("async multi-select keeps selected option visible after clearing search", async ({ page }) => {
    await openOptionListStory(page, "async-features--async-features");

    const multiRoot = optionListRootByName(page, "asyncCities");
    await expect(multiRoot.getByRole("checkbox", { name: /austin/i })).toBeVisible();

    const search = searchInput(multiRoot);
    await search.fill("el paso");

    const elPasoOption = multiRoot.getByRole("checkbox", { name: /el paso/i });
    await expect(elPasoOption).toBeVisible();
    await elPasoOption.check();
    await expect(elPasoOption).toBeChecked();

    await search.fill("");
    await expect(optionRows(multiRoot).first()).toContainText("El Paso");
});

test("combined sources keep local options first and suppress duplicate remote values", async ({ page }) => {
    await openOptionListStory(page, "async-first-page-fallback--async-first-page-fallback");

    const combinedRoot = optionListRootByName(page, "combinedSourcesOptionsOnly");
    await expect(combinedRoot.getByRole("radio", { name: "Apollo Creed Remote" })).toBeVisible();
    await expect(combinedRoot.getByRole("radio", { name: "Robert Balboa Remote" })).toHaveCount(0);

    const optionLabels = await optionRows(combinedRoot).evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ""));

    expect(optionLabels).toEqual(["Robert Balboa Local", "Adrian Pennino Local", "Apollo Creed Remote"]);
});

test("combined sources custom matcher props are ignored in option-list mode", async ({ page }) => {
    await openOptionListStory(page, "async-first-page-fallback--async-first-page-fallback");

    const matcherRoot = optionListRootByName(page, "combinedSourcesCustomMatcher");
    const search = searchInput(matcherRoot);
    await expect(search).toHaveCount(0);
    await expect(matcherRoot.getByRole("radio", { name: "Red" })).toBeVisible();
    await expect(matcherRoot.getByRole("radio", { name: "Blue" })).toBeVisible();
    await expect(matcherRoot.getByRole("radio", { name: "Green" })).toBeVisible();
});

test("error story shows source error in list area", async ({ page }) => {
    await openOptionListStory(page, "error-handling--error-handling");

    const errorRoot = optionListRootByName(page, "fetchErrorMessageSelect");
    await expect(errorRoot.locator(".super-select__alert-danger")).toBeVisible();
    await expect(errorRoot.locator(".super-select__alert-danger")).toContainText("Server returned 503 while loading people options.");
    await expect(retryButton(errorRoot)).toBeVisible();
});

test("error story renders empty state when source returns no options", async ({ page }) => {
    await openOptionListStory(page, "error-handling--error-handling");

    const emptyRoot = optionListRootByName(page, "emptyStateSelect");
    await expect(emptyRoot.locator(".super-select__alert-info span[aria-hidden='true']", { hasText: "\u2212" })).toBeVisible();
    await expect(optionRows(emptyRoot)).toHaveCount(0);
});

test("static empty option list does not show a retry action", async ({ page }) => {
    await page.goto("/customization");
    await page.getByTestId("story-ready").first().waitFor();
    await setStoryMode(page, "option-list");

    const emptyRoot = optionListRootByName(page, "basicCustomizationAlwaysEmpty");
    await expect(emptyRoot.locator(".super-select__alert-info")).toBeVisible();
    await expect(emptyRoot.getByRole("button")).toHaveCount(0);
});

test("search-visibility story hides search for local options but shows it for any option source", async ({ page }) => {
    await openOptionListStory(page, "search-visibility--search-visibility");

    const localRoot = optionListRootByName(page, "visibilityLocalDefault");
    await expect(searchInput(localRoot)).toHaveCount(0);

    const singlePageRoot = optionListRootByName(page, "visibilitySinglePageSource");
    await expect(singlePageRoot.getByRole("radio", { name: /robert balboa/i })).toBeVisible();
    await expect(searchInput(singlePageRoot)).toBeVisible();
});

test("search-visibility story keeps search hidden for local options without an option source", async ({ page }) => {
    await openOptionListStory(page, "search-visibility--search-visibility");

    const forcedRoot = optionListRootByName(page, "visibilityForced");
    await expect(searchInput(forcedRoot)).toHaveCount(0);
});

test("search-visibility story auto-shows search for paginated source", async ({ page }) => {
    await openOptionListStory(page, "search-visibility--search-visibility");

    const paginatedRoot = optionListRootByName(page, "visibilityPaginatedSource");
    await expect(paginatedRoot.getByRole("radio", { name: /austin/i })).toBeVisible();
    await expect(searchInput(paginatedRoot)).toBeVisible();
});

test("form behavior single required blocks submit and then submits selected value", async ({ page }) => {
    await openOptionListStory(page, "form-behavior--form-behavior");

    await page.getByTestId("option-list-single-submit").click();
    await expect(page.getByTestId("option-list-single-submit-count")).toHaveText("Submit count: 0");
    await expect(page.getByTestId("option-list-single-invalid-count")).toHaveText("Invalid count: 1");

    const singleRoot = optionListRootByName(page, "singleFilteredRequired");
    await singleRoot.getByRole("radio", { name: /adrian pennino/i }).check();

    await page.getByTestId("option-list-single-submit").click();
    await expect(page.getByTestId("option-list-single-submit-count")).toHaveText("Submit count: 1");
    await expect(page.getByTestId("option-list-single-payload")).toHaveText("Payload: adrian-pennino");
});

test("form behavior multi required blocks submit and preserves selected values across pagination and filtering", async ({ page }) => {
    await openOptionListStory(page, "form-behavior--form-behavior");

    await page.getByTestId("option-list-multi-submit").click();
    await expect(page.getByTestId("option-list-multi-submit-count")).toHaveText("Submit count: 0");

    const multiRoot = optionListRootByName(page, "multiPaginatedRequired");
    await expect(multiRoot.getByRole("checkbox", { name: /austin/i })).toBeVisible();
    await multiRoot.getByRole("checkbox", { name: /austin/i }).check();

    await loadMoreButton(multiRoot).click();
    await expect(multiRoot.getByRole("checkbox", { name: /el paso/i })).toBeVisible();
    await multiRoot.getByRole("checkbox", { name: /el paso/i }).check();

    await searchInput(multiRoot).fill("san");
    await expect(multiRoot.getByRole("checkbox", { name: /austin/i })).toBeVisible();
    await expect(multiRoot.getByRole("checkbox", { name: /el paso/i })).toBeVisible();

    await page.getByTestId("option-list-multi-submit").click();
    await expect(page.getByTestId("option-list-multi-submit-count")).toHaveText("Submit count: 1");
    await expect(page.getByTestId("option-list-multi-payload")).toHaveText("Payload: austin,el-paso");
});
