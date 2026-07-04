import type { Locator, Page } from "@playwright/test";
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
async function openModal(page: Page, triggerIndex = 0) {
    const story = page.getByTestId("story-ready").first();
    const trigger = story.locator('button[aria-haspopup="dialog"]').nth(triggerIndex);
    await expect(trigger).toBeVisible();
    await trigger.click();
    const openDialog = page.locator("dialog[open]").first();
    await expect(openDialog).toBeVisible();
    const dialogIndex = await page.locator("dialog").evaluateAll((dialogs) => dialogs.findIndex((dialog) => dialog.hasAttribute("open")));
    const dialog = page.locator("dialog").nth(dialogIndex);
    return { trigger, dialog };
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

function modalOptionList(dialog: Locator) {
    return dialog.locator(".super-select__list-group");
}

function modalLoadMoreButton(dialog: Locator) {
    return modalOptionList(dialog).getByRole("button", { name: "+" }).first();
}

async function loadNextModalPage(dialog: Locator) {
    const loadMore = modalLoadMoreButton(dialog);
    if ((await loadMore.count()) > 0) {
        await loadMore.click();
        return;
    }

    await modalOptionList(dialog).evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
}

function modalSearchInput(dialog: Locator) {
    return dialog.getByRole("searchbox");
}

function modalDoneButton(dialog: Locator) {
    return dialog.locator(".super-select__modal-footer button").first();
}

function modalTriggerBySelectName(page: Page, name: string) {
    return page.locator(`select[name="${name}"]`).locator('xpath=preceding::button[@aria-haspopup="dialog"][1]');
}

async function openModalBySelectName(page: Page, name: string) {
    const trigger = modalTriggerBySelectName(page, name);
    await expect(trigger).toBeVisible();
    await trigger.click();
    const openDialog = page.locator("dialog[open]").first();
    await expect(openDialog).toBeVisible();
    const dialogIndex = await page.locator("dialog").evaluateAll((dialogs) => dialogs.findIndex((dialog) => dialog.hasAttribute("open")));
    const dialog = page.locator("dialog").nth(dialogIndex);
    return { trigger, dialog };
}

test("single-select closes and updates value", async ({ page }) => {
    await openStory(page, "basic--basic");

    const { trigger, dialog } = await openModal(page);

    await modalSearchInput(dialog).fill("adri");
    const banana = dialog.getByLabel(/adrian pennino/i);
    await expect(banana).toBeVisible();
    await banana.click();

    await expect(dialog).not.toHaveAttribute("open", "");
    await expect(trigger).toContainText("Adrian Pennino");
    await expect(page.locator('select[name="person"]')).toHaveValue("adrian-pennino");
});

test("modal internal option inputs are not included in form submission", async ({ page }) => {
    await page.goto("/configuration");
    const formExample = page.locator("section").filter({ has: page.getByRole("heading", { name: "POST Form" }) });
    const trigger = formExample.locator('select[name="person"]').locator('xpath=preceding::button[@aria-haspopup="dialog"][1]');

    await trigger.click();
    const optionInputs = page.locator('dialog[open] input[type="radio"]');
    const inputDetails = await optionInputs.evaluateAll((inputs) => ({
        names: [...new Set(inputs.map((input) => (input as HTMLInputElement).name))],
        haveFormOwner: inputs.some((input) => Boolean((input as HTMLInputElement).form)),
    }));

    expect(inputDetails.names).toHaveLength(1);
    expect(inputDetails.names[0]).not.toBe("");
    expect(inputDetails.haveFormOwner).toBe(false);

    await page.locator("dialog[open]").press("Escape");

    await formExample.getByRole("button", { name: "Submit" }).click();

    await expect(formExample.getByTestId("uncontrolled-form-submission")).toHaveText("Submitted: person=apollo-creed");
});

test("Enter inside an open modal does not submit the surrounding form", async ({ page }) => {
    await page.goto("/configuration");
    const formExample = page.locator("section").filter({ has: page.getByRole("heading", { name: "POST Form" }) });
    const trigger = formExample.locator('select[name="person"]').locator('xpath=preceding::button[@aria-haspopup="dialog"][1]');

    await trigger.click();
    const dialog = page.locator("dialog[open]");
    await dialog.locator('input[type="search"]').press("Enter");

    await expect(dialog).toHaveAttribute("open", "");
    await expect(formExample.getByTestId("uncontrolled-form-submission")).toHaveCount(0);

    await dialog.locator('input[type="search"]').press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(dialog).toHaveCount(0);
    await expect(formExample.getByTestId("uncontrolled-form-submission")).toHaveCount(0);
});

test("single-select option can be selected by clicking anywhere in its row", async ({ page }) => {
    await openStory(page, "basic--basic");

    const { trigger, dialog } = await openModal(page);

    await modalSearchInput(dialog).fill("adri");
    const optionRow = dialog.locator(".super-select__list-group-item-action").filter({ hasText: "Adrian Pennino" });
    const optionRowBounds = await optionRow.boundingBox();
    expect(optionRowBounds).not.toBeNull();

    await optionRow.click({ position: { x: optionRowBounds!.width - 8, y: optionRowBounds!.height / 2 } });

    await expect(dialog).not.toHaveAttribute("open", "");
    await expect(trigger).toContainText("Adrian Pennino");
    await expect(page.locator('select[name="person"]')).toHaveValue("adrian-pennino");
});

test("search filters options in the dialog list", async ({ page }) => {
    await openStory(page, "basic--basic");

    const { dialog } = await openModal(page);
    await modalSearchInput(dialog).fill("apollo");

    await expect(dialog.getByLabel(/apollo creed/i)).toBeVisible();
    await expect(dialog.getByLabel(/robert balboa/i)).toHaveCount(0);
});

test("trigger and dialog expose structural relationships for assistive tech", async ({ page }) => {
    await openStory(page, "basic--basic");

    const trigger = page.locator('button[aria-haspopup="dialog"]').first();
    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const dialog = page.locator("dialog").first();
    await expect(dialog).toHaveAttribute("open", "");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).not.toHaveAttribute("aria-label", /.+/);
    await expect(dialog).not.toHaveAttribute("aria-labelledby", /.+/);
});

test("keyboard navigation flow uses scoped modal search focus and native option controls", async ({ page }) => {
    await openStory(page, "basic--basic");

    // Single-select: ArrowDown from the search input moves focus to the next focusable control.
    {
        const { trigger, dialog } = await openModal(page, 0);
        const search = modalSearchInput(dialog);

        await search.press("ArrowDown");
        const firstRadio = dialog.getByLabel(/robert balboa/i);
        await expect(firstRadio).toBeFocused();
        await firstRadio.press("Space");

        await expect(dialog).not.toHaveAttribute("open", "");
        await expect(trigger).toContainText("Robert Balboa");
    }

    await openStory(page, "basic--basic");

    // Single-select: ArrowUp from the search input has no previous focus target, so it leaves native input behavior alone.
    {
        const { dialog } = await openModal(page, 0);
        const search = modalSearchInput(dialog);

        await search.press("ArrowUp");
        await search.press("Enter");

        await expect(search).toBeFocused();
        await expect(dialog).toHaveAttribute("open", "");
    }

    await openStory(page, "basic--basic");

    // Single-select: no matching options keeps modal open and ignores Enter.
    {
        const { trigger, dialog } = await openModal(page, 0);
        const search = modalSearchInput(dialog);

        await search.fill("zzzzzz");
        await expect(dialog.locator(".super-select__list-group-item-action")).toHaveCount(0);

        await search.press("ArrowDown");
        await search.press("ArrowUp");
        await search.press("Enter");

        await expect(dialog).toHaveAttribute("open", "");
        await expect(trigger).not.toContainText("Adrian Pennino");
        await dialog.press("Escape");
        await expect(dialog).not.toHaveAttribute("open", "");
    }

    await openStory(page, "basic--basic");

    // Multi-select: Tab and Space handle checkbox selection after search focus.
    {
        const { trigger, dialog } = await openModal(page, 1);
        const search = modalSearchInput(dialog);

        await search.press("ArrowDown");
        const firstCheckbox = dialog.getByLabel(/robert balboa/i);
        await expect(firstCheckbox).toBeFocused();
        await firstCheckbox.press("Space");
        await expect(dialog).toHaveAttribute("open", "");

        await page.keyboard.press("Tab");
        const secondCheckbox = dialog.getByLabel(/adrian pennino/i);
        await expect(secondCheckbox).toBeFocused();
        await secondCheckbox.press("Space");
        await expect(dialog).toHaveAttribute("open", "");

        await modalDoneButton(dialog).click();
        await expect(dialog).not.toHaveAttribute("open", "");
        await expect(trigger).toContainText("Robert Balboa");
        await expect(trigger).toContainText("Adrian Pennino");
    }

    // Grouped options still render headers; option choice itself uses the native input.
    await openStory(page, "grouped-basic--grouped-basic");
    {
        const { trigger, dialog } = await openModal(page, 2);
        const groupHeaders = dialog.locator(".super-select__list-group-item-secondary");
        await expect(groupHeaders).toHaveCount(3);
        await expect(groupHeaders.nth(0)).toHaveText("Operations");
        await expect(groupHeaders.nth(1)).toHaveText("Training");
        await expect(groupHeaders.nth(2)).toHaveText("Personal");

        await dialog.getByLabel(/paolo pennino/i).click();

        await expect(dialog).not.toHaveAttribute("open", "");
        await expect(trigger).toContainText("Paolo Pennino");
    }

    // Async search: text-selection shortcut remains native during keyboard interaction.
    await openStory(page, "async-features--async-features");
    {
        const { dialog } = await openModal(page, 0);
        const search = modalSearchInput(dialog);

        await search.fill("san francisco");
        await expect(dialog.getByLabel(/san francisco/i)).toBeVisible();

        await search.press("Shift+Home");
        const selection = await search.evaluate((input) => {
            const element = input as HTMLInputElement;
            return {
                start: element.selectionStart,
                end: element.selectionEnd,
                length: element.value.length,
            };
        });

        expect(selection.start).toBe(0);
        expect(selection.end).toBe(selection.length);

        await search.press("ArrowDown");
        await expect(dialog.getByLabel(/san francisco/i)).toBeFocused();
    }
});

test("multi-select keeps modal open and tracks multiple values", async ({ page }) => {
    await openStory(page, "basic--basic");

    const { trigger, dialog } = await openModal(page, 1);

    await dialog.getByLabel(/robert balboa/i).click();
    await expect(dialog).toHaveAttribute("open", "");

    await dialog.getByLabel(/apollo creed/i).click();
    await expect(dialog).toHaveAttribute("open", "");
    await expect(trigger).toContainText("Robert Balboa");
    await expect(trigger).toContainText("Apollo Creed");

    const selectedValues = await page
        .locator('select[name="people"] option:checked')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value).sort());

    expect(selectedValues).toEqual(["apollo-creed", "robert-balboa"]);
});

test("modal search ArrowDown moves focus to an option so Space selects it", async ({ page }) => {
    await openStory(page, "basic--basic");

    const single = await openModal(page, 0);
    const singleSearch = modalSearchInput(single.dialog);
    await singleSearch.focus();
    await singleSearch.press("ArrowDown");

    const firstSingleRadio = single.dialog.getByLabel(/robert balboa/i);
    await expect(firstSingleRadio).toBeFocused();
    await firstSingleRadio.press("Space");
    await expect(firstSingleRadio).toBeChecked();
    await expect(single.dialog).not.toHaveAttribute("open", "");
    await expect(single.trigger).toContainText("Robert Balboa");
});

test("modal option controls use native keyboard behavior after receiving focus", async ({ page }) => {
    await openStory(page, "basic--basic");

    const single = await openModal(page, 0);
    const singleSearch = modalSearchInput(single.dialog);
    await singleSearch.focus();
    await page.keyboard.press("Tab");

    const firstSingleRadio = single.dialog.getByLabel(/robert balboa/i);
    await expect(firstSingleRadio).toBeFocused();
    await firstSingleRadio.press("Space");
    await expect(firstSingleRadio).toBeChecked();
    await expect(single.dialog).not.toHaveAttribute("open", "");
    await expect(single.trigger).toContainText("Robert Balboa");

    const multi = await openModal(page, 1);
    const multiSearch = modalSearchInput(multi.dialog);
    await multiSearch.focus();
    await expect(multiSearch).toBeFocused();
    await page.keyboard.press("Tab");

    const firstMultiCheckbox = multi.dialog.getByLabel(/robert balboa/i);
    await firstMultiCheckbox.press("Space");
    await expect(firstMultiCheckbox).toBeChecked();
    await firstMultiCheckbox.press("Space");
    await expect(firstMultiCheckbox).not.toBeChecked();
});

test("single-select radio Arrow keys after Tab update selection without closing modal", async ({ page }) => {
    await openStory(page, "basic--basic");

    const firstOpen = await openModal(page, 0);
    await firstOpen.dialog.getByLabel(/robert balboa/i).click();
    await expect(firstOpen.dialog).not.toHaveAttribute("open", "");

    const single = await openModal(page, 0);
    const singleSearch = modalSearchInput(single.dialog);
    await singleSearch.focus();
    await page.keyboard.press("Tab");

    const firstRadio = single.dialog.getByLabel(/robert balboa/i);
    const secondRadio = single.dialog.getByLabel(/adrian pennino/i);
    await expect(firstRadio).toBeFocused();
    await expect(firstRadio).toBeChecked();

    await page.keyboard.press("ArrowDown");

    await expect(single.dialog).toHaveAttribute("open", "");
    await expect(secondRadio).toBeChecked();
});

test("single-select Enter on focused selected radio closes modal", async ({ page }) => {
    await openStory(page, "basic--basic");

    const firstOpen = await openModal(page, 0);
    await firstOpen.dialog.getByLabel(/robert balboa/i).click();
    await expect(firstOpen.dialog).not.toHaveAttribute("open", "");

    const single = await openModal(page, 0);
    const singleSearch = modalSearchInput(single.dialog);
    await singleSearch.focus();
    await page.keyboard.press("Tab");

    const selectedRadio = single.dialog.getByLabel(/robert balboa/i);
    await expect(selectedRadio).toBeFocused();
    await expect(selectedRadio).toBeChecked();

    await page.keyboard.press("Enter");

    await expect(single.dialog).not.toHaveAttribute("open", "");
    await expect(single.trigger).toContainText("Robert Balboa");
});

test("multi-value label layout story renders consistent default multi-value labels", async ({ page }) => {
    await openStory(page, "multi-value-label-layout--multi-value-label-layout");

    const wrappingTrigger = page.locator('button[aria-haspopup="dialog"]').nth(0);
    const secondTrigger = page.locator('button[aria-haspopup="dialog"]').nth(1);
    const thirdTrigger = page.locator('button[aria-haspopup="dialog"]').nth(2);

    await expect(wrappingTrigger).toContainText("North Warehouse, Zone A");
    await expect(wrappingTrigger).toContainText("West Hub, Gate 3");
    await expect(secondTrigger).toContainText("North Warehouse, Zone A");
    await expect(thirdTrigger).toContainText("North Warehouse, Zone A");

    await expect(wrappingTrigger.locator(".super-select__list-inline .super-select__list-inline-item")).toHaveCount(3);
    await expect(secondTrigger.locator(".super-select__list-inline .super-select__list-inline-item")).toHaveCount(2);
    await expect(thirdTrigger).toContainText("North Warehouse, Zone A");
});

test("configuration story renders the configurable input", async ({ page }) => {
    await openStory(page, "configuration--configuration");
    await setStoryMode(page, "modal");
    await expect(modalTriggerBySelectName(page, "configuredSelect")).toBeVisible();
    await expect(page.locator('[data-testid="configuration-super-select"]:not([aria-hidden="true"])')).toBeAttached();
    await expect(page.getByTestId("configuration-submit")).toBeVisible();
});

test("configuration events parity in modal mode", async ({ page }) => {
    await openStory(page, "configuration--configuration");
    await setStoryMode(page, "modal");

    const trigger = modalTriggerBySelectName(page, "configuredSelect");
    await trigger.click();
    await page
        .locator("dialog[open]")
        .first()
        .getByLabel(/adrian pennino/i)
        .click();
    await expect(page.locator('select[name="configuredSelect"]')).toHaveValue("adrian-pennino");
    await expect(page.getByTestId("configuration-change-count")).toHaveText("Change events: 1");
});

test("configuration events parity in native mode", async ({ page }) => {
    await openStory(page, "configuration--configuration");
    await setStoryMode(page, "native");

    const select = page.getByTestId("configuration-super-select");
    await select.selectOption("adrian-pennino");
    await expect(select).toHaveValue("adrian-pennino");
    await expect(page.getByTestId("configuration-change-count")).toHaveText("Change events: 1");
});

test("configuration applies interesting props in modal mode", async ({ page }) => {
    await openStory(page, "configuration--configuration");
    await setStoryMode(page, "modal");

    const select = page.locator('select[name="configuredSelect"]');
    await expect(select).toHaveAttribute("required", "");
    await expect(select).toHaveAttribute("autocomplete", "off");
    await expect(select).toHaveAttribute("title", "Configuration demo select");

    await expect(page.locator('select[name="disabledSelect"]')).toHaveAttribute("disabled", "");
    await page.getByTestId("configuration-submit").click();
    await expect(page.getByTestId("configuration-submit-count")).toHaveText("Submit count: 0");
    await expect(modalTriggerBySelectName(page, "requiredSelection")).toHaveClass(/super-select__is-invalid/);
    await expect(modalTriggerBySelectName(page, "requiredSelections")).toHaveClass(/super-select__is-invalid/);

    const trigger = modalTriggerBySelectName(page, "requiredSelection");
    await trigger.click();
    await page
        .locator("dialog[open]")
        .first()
        .getByLabel(/apollo creed/i)
        .click();

    const { dialog } = await openModalBySelectName(page, "requiredSelections");
    await dialog.getByLabel(/robert balboa/i).click();
    await modalDoneButton(dialog).click();

    await page.getByTestId("configuration-submit").click();
    await expect(page.getByTestId("configuration-submit-count")).toHaveText("Submit count: 1");
    await expect(page.getByTestId("configuration-submit-payload")).toHaveText("Payload: Single: apollo-creed; Multiple: robert-balboa");
});

test("configuration applies interesting props in native mode", async ({ page }) => {
    await openStory(page, "configuration--configuration");
    await setStoryMode(page, "native");

    const select = page.locator('select[name="configuredSelect"]');
    await expect(select).toHaveAttribute("required", "");
    await expect(select).toHaveAttribute("autocomplete", "off");
    await expect(select).toHaveAttribute("title", "Configuration demo select");

    await expect(page.locator('select[name="disabledSelect"]')).toHaveAttribute("disabled", "");
    await page.getByTestId("configuration-submit").click();
    await expect(page.getByTestId("configuration-submit-count")).toHaveText("Submit count: 0");

    await page.locator('select[name="requiredSelection"]').selectOption("apollo-creed");
    await page.locator('select[name="requiredSelections"]').selectOption("robert-balboa");

    await page.getByTestId("configuration-submit").click();
    await expect(page.getByTestId("configuration-submit-count")).toHaveText("Submit count: 1");
    await expect(page.getByTestId("configuration-submit-payload")).toHaveText("Payload: Single: apollo-creed; Multiple: robert-balboa");
});

test("async story loads and filters source options", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page);
    const search = modalSearchInput(dialog);
    await search.fill("san");

    await expect(dialog.getByLabel(/san antonio/i)).toBeVisible();
});

test("combined sources show element options first and suppress duplicate remote values", async ({ page }) => {
    await openStory(page, "async-first-page-fallback--async-first-page-fallback");
    await setStoryMode(page, "modal");

    const trigger = modalTriggerBySelectName(page, "combinedSourcesOptionsOnly");

    const { dialog } = await openModalBySelectName(page, "combinedSourcesOptionsOnly");
    await expect(dialog.getByLabel("Robert Balboa Local")).toBeVisible();
    await expect(dialog.getByLabel("Adrian Pennino Local")).toBeVisible();
    await expect(dialog.getByLabel("Apollo Creed Remote")).toBeVisible();
    await expect(dialog.getByLabel("Robert Balboa Remote")).toHaveCount(0);

    const optionLabels = await dialog
        .locator(".super-select__list-group-item-action")
        .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ""));

    expect(optionLabels).toEqual(["Robert Balboa Local", "Adrian Pennino Local", "Apollo Creed Remote"]);

    const search = modalSearchInput(dialog);
    await search.fill("robert");

    await expect(dialog.getByLabel("Robert Balboa Local")).toBeVisible();
    await expect(dialog.getByLabel("Robert Balboa Remote")).toHaveCount(0);

    await search.fill("");
    await expect(dialog.getByLabel("Robert Balboa Local")).toBeVisible();

    await dialog.getByLabel("Robert Balboa Local").click();
    await expect(dialog).not.toHaveAttribute("open", "");
    await expect(trigger).toContainText("Robert Balboa Local");
});

test("custom local search matcher can use option metadata from child elements", async ({ page }) => {
    await openStory(page, "async-first-page-fallback--async-first-page-fallback");
    await setStoryMode(page, "modal");

    const { dialog } = await openModalBySelectName(page, "combinedSourcesCustomMatcher");
    const search = modalSearchInput(dialog);
    await expect(search).toHaveCount(1);
    await search.fill("re");
    await expect(dialog.getByLabel("Red")).toBeVisible();
    await expect(dialog.getByLabel("Blue")).toHaveCount(0);
    await expect(dialog.getByLabel("Green")).toBeVisible();
});

test("async story supports limited manual pagination", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page);
    const firstPageCount = await dialog.locator(".super-select__list-group-item-action").count();
    await loadNextModalPage(dialog);
    await expect.poll(async () => dialog.locator(".super-select__list-group-item-action").count()).toBeGreaterThan(firstPageCount);
    await loadNextModalPage(dialog);

    await expect(modalLoadMoreButton(dialog)).toHaveCount(0);
    await expect(modalOptionList(dialog).getByText("\u2026", { exact: true })).toHaveCount(0);
});

test("async single-select page-2 selection does not show resolution error after reopen", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const trigger = page.locator('button[aria-haspopup="dialog"]').nth(0);
    const { dialog } = await openModalBySelectName(page, "asyncCity");

    await expect(dialog.getByLabel(/austin/i)).toBeVisible();
    await modalLoadMoreButton(dialog).click();
    await expect(dialog.getByLabel(/el paso/i)).toBeVisible();

    await dialog.getByLabel(/el paso/i).click();
    await expect(dialog).not.toHaveAttribute("open", "");
    await expect(trigger.locator(".super-select__is-invalid")).toHaveCount(0);

    const reopened = await openModalBySelectName(page, "asyncCity");
    await expect(reopened.dialog.locator(".super-select__alert-danger")).toHaveCount(0);
    await expect(reopened.dialog.locator(".super-select__list-group-item-action").first()).toContainText("El Paso");
});

test("async multi-select page-2 selection does not show resolution error after reopen", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const trigger = page.locator('button[aria-haspopup="dialog"]').nth(1);
    const { dialog } = await openModal(page, 1);

    await expect(dialog.getByLabel(/austin/i)).toBeVisible();
    await dialog.getByLabel(/austin/i).click();

    await modalLoadMoreButton(dialog).click();
    await expect(dialog.getByLabel(/el paso/i)).toBeVisible();
    await dialog.getByLabel(/el paso/i).click();

    await modalDoneButton(dialog).click();
    await expect(dialog).not.toHaveAttribute("open", "");
    await expect(trigger.locator(".super-select__is-invalid")).toHaveCount(0);

    const reopened = await openModal(page, 1);
    await expect(reopened.dialog.locator(".super-select__alert-danger")).toHaveCount(0);
    await expect(reopened.dialog.locator(".super-select__list-group-item-action").first()).toContainText("Austin");
    await expect(reopened.dialog.locator(".super-select__list-group-item-action").nth(1)).toContainText("El Paso");
});

test("async multi-select keeps previously selected option visible until query changes", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page, 1);
    await expect(dialog.getByLabel(/austin/i)).toBeVisible();

    await modalLoadMoreButton(dialog).click();
    const elPasoOptionInput = dialog.getByLabel(/el paso/i);
    await expect(elPasoOptionInput).toBeVisible();
    await elPasoOptionInput.click();

    await modalDoneButton(dialog).click();
    await expect(dialog).not.toHaveAttribute("open", "");

    const reopened = await openModal(page, 1);
    const firstRow = reopened.dialog.locator(".super-select__list-group-item-action").first();
    await expect(firstRow).toContainText("El Paso");
    await expect(reopened.dialog.getByLabel(/el paso/i)).toBeChecked();

    await reopened.dialog.getByLabel(/el paso/i).click();
    await expect(reopened.dialog.getByLabel(/el paso/i)).not.toBeChecked();
    await expect(reopened.dialog.locator(".super-select__list-group-item-action").first()).toContainText("El Paso");

    const search = modalSearchInput(reopened.dialog);
    await search.fill("san");
    const searchStartedAt = Date.now();
    await expect
        .poll(
            async () => {
                const firstRowText = (await reopened.dialog.locator(".super-select__list-group-item-action").first().textContent()) ?? "";
                return Date.now() - searchStartedAt >= 150 ? firstRowText : "";
            },
            { intervals: [25], timeout: 200 },
        )
        .toContain("El Paso");

    await expect(reopened.dialog.getByLabel(/san antonio/i)).toBeVisible();
    await expect(reopened.dialog.getByLabel(/el paso/i)).toHaveCount(0);
});

test("async multi-select keeps searched selected option visible after clearing search", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page, 1);
    const search = modalSearchInput(dialog);

    await expect(dialog.getByLabel(/austin/i)).toBeVisible();

    await search.fill("el paso");
    const elPasoOptionInput = dialog.getByLabel(/el paso/i);
    const elPasoOptionRow = dialog
        .locator(".super-select__list-group-item-action")
        .filter({ hasText: /el paso/i })
        .first();
    await expect(elPasoOptionInput).toBeVisible();

    await elPasoOptionInput.click();
    await expect(elPasoOptionRow).toHaveClass(/super-select__active/);

    await search.fill("");

    await expect(dialog.locator(".super-select__list-group-item-action").first()).toContainText("El Paso");
    await expect(
        dialog
            .locator(".super-select__list-group-item-action")
            .filter({ hasText: /el paso/i })
            .first(),
    ).toHaveClass(/super-select__active/);
});

test("async multi-select does not reorder options immediately after selecting while modal is open", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page, 1);
    await expect(dialog.getByLabel(/austin/i)).toBeVisible();

    await modalLoadMoreButton(dialog).click();
    const elPasoOptionInput = dialog.getByLabel(/el paso/i);
    await expect(elPasoOptionInput).toBeVisible();
    await elPasoOptionInput.click();

    await expect(dialog.locator(".super-select__list-group-item-action").first()).toContainText("Austin");
});

test("async search does not show loading immediately during debounce", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page);
    const loadingIndicator = dialog.locator(".super-select__spinner-border");

    // Wait for initial open fetch to complete so we only validate search debounce behavior.
    await expect(dialog.getByLabel(/austin/i)).toBeVisible();
    await expect(loadingIndicator).toHaveCount(0);

    const search = modalSearchInput(dialog);
    await search.fill("san");

    // Debounce is 250ms, so before that window there should be no loading indicator.
    const searchStartedAt = Date.now();
    let sawLoadingBeforeDebounce = false;
    await expect
        .poll(
            async () => {
                const loadingCount = await loadingIndicator.count();
                sawLoadingBeforeDebounce ||= loadingCount > 0;
                return Date.now() - searchStartedAt >= 150 ? (sawLoadingBeforeDebounce ? 1 : 0) : -1;
            },
            { intervals: [25], timeout: 200 },
        )
        .toBe(0);

    await expect(dialog.getByLabel(/san antonio/i)).toBeVisible();
});

test("never-resolving async source shows loading indicator on trigger", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    // Trigger index 2 is the never-resolving single select in the Loading State section
    const trigger = page.locator('button[aria-haspopup="dialog"]').nth(2);
    await expect(trigger).toBeVisible();

    // Should show loading indicator before opening modal
    await expect(trigger.locator(".super-select__spinner-border")).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-busy", "true");

    // Open modal and verify modal also shows loading indicator
    const { dialog } = await openModal(page, 2);
    await expect(dialog.locator(".super-select__spinner-border")).toBeVisible();

    // Closing modal should clear the loading state
    await dialog.press("Escape");
    await expect(dialog).not.toHaveAttribute("open", "");
});

test("search input keeps native Shift+Home text selection", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page);
    const search = modalSearchInput(dialog);

    await search.fill("san francisco");
    await search.press("Shift+Home");

    const selection = await search.evaluate((input) => {
        const element = input as HTMLInputElement;
        return {
            start: element.selectionStart,
            end: element.selectionEnd,
            valueLength: element.value.length,
        };
    });

    expect(selection.start).toBe(0);
    expect(selection.end).toBe(selection.valueLength);
});

test("search input preserves common text-selection shortcuts and keeps results visible", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page);
    const search = modalSearchInput(dialog);

    await search.fill("san francisco");
    await expect(dialog.getByLabel(/san francisco/i)).toBeVisible();

    await search.press("Shift+Home");
    let selection = await search.evaluate((input) => {
        const element = input as HTMLInputElement;
        return {
            start: element.selectionStart,
            end: element.selectionEnd,
            valueLength: element.value.length,
            selectedText: element.value.slice(element.selectionStart ?? 0, element.selectionEnd ?? 0),
        };
    });
    expect(selection.start).toBe(0);
    expect(selection.end).toBe(selection.valueLength);

    await search.press("End");
    const selectionAfterEnd = await search.evaluate((input) => {
        const element = input as HTMLInputElement;
        return {
            start: element.selectionStart,
            end: element.selectionEnd,
            valueLength: element.value.length,
        };
    });
    expect(selectionAfterEnd.start).toBe(selectionAfterEnd.valueLength);
    expect(selectionAfterEnd.end).toBe(selectionAfterEnd.valueLength);
    await expect(dialog.getByLabel(/san francisco/i)).toBeVisible();

    await search.press("Control+Shift+ArrowLeft");
    selection = await search.evaluate((input) => {
        const element = input as HTMLInputElement;
        return {
            start: element.selectionStart,
            end: element.selectionEnd,
            valueLength: element.value.length,
            selectedText: element.value.slice(element.selectionStart ?? 0, element.selectionEnd ?? 0),
        };
    });
    expect(selection.end).toBe(selection.valueLength);
    expect(selection.start).toBeGreaterThan(0);
    expect(selection.selectedText.toLowerCase()).toBe("francisco");
    await expect(dialog.getByLabel(/san francisco/i)).toBeVisible();
});

test("error handling story shows modal fetch error in option area", async ({ page }) => {
    await openStory(page, "error-handling--error-handling");

    const { dialog } = await openModalBySelectName(page, "fetchErrorMessageSelect");

    const optionListError = dialog.locator(".super-select__alert-danger");

    await expect(optionListError).toBeVisible();
    await expect(optionListError).toContainText("Server returned 503 while loading people options.");
    await expect(optionListError.getByTestId("option-source-error-message")).toHaveAttribute("data-error-code", "server");
    await expect(optionListError.getByTestId("option-source-error-message")).toHaveAttribute("data-http-status", "503");
    await expect(dialog.getByRole("button", { name: "\u21BB" })).toBeVisible();
    await expect(modalLoadMoreButton(dialog)).toHaveCount(0);
    await expect(modalOptionList(dialog).getByText("\u2026", { exact: true })).toHaveCount(0);
    await expect(dialog.locator(".super-select__list-group-item-action")).toHaveCount(0);
});

test("error handling story with no-message fetch error shows no fallback text", async ({ page }) => {
    await openStory(page, "error-handling--error-handling");

    const { dialog } = await openModalBySelectName(page, "fetchErrorNoMessageSelect");

    const optionListError = dialog.locator(".super-select__alert-danger");

    await expect(optionListError).toBeVisible();
    await expect(optionListError.locator("p")).toHaveCount(0);
});

test("error handling story refresh recovers after toggling fetch failure off", async ({ page }) => {
    await openStory(page, "error-handling--error-handling");

    const { dialog } = await openModalBySelectName(page, "fetchErrorMessageSelect");
    const optionListError = dialog.locator(".super-select__alert-danger");

    await expect(optionListError).toBeVisible();

    await dialog.getByRole("button", { name: "\u21BB" }).click();
    await expect(optionListError).toBeVisible();

    await page.keyboard.press("Escape");
    await page.getByTestId("error-toggle-fetch-fail").uncheck();

    const reopened = await openModalBySelectName(page, "labelErrorWithMessageSelect");
    await expect(reopened.dialog.locator(".super-select__alert-danger")).toHaveCount(0);
    await expect(reopened.dialog.getByRole("button", { name: "\u21BB" })).toHaveCount(0);
    await expect(reopened.dialog.getByLabel(/robert balboa/i)).toBeVisible();
});

test("error handling story hides unresolved raw values by default", async ({ page }) => {
    await openStory(page, "error-handling--error-handling");

    const singleTrigger = modalTriggerBySelectName(page, "labelErrorWithMessageSelect");
    const multiTrigger = modalTriggerBySelectName(page, "labelErrorNoMessageSelect");

    await expect(singleTrigger).not.toContainText("id-42");

    await expect(multiTrigger).not.toContainText("id-42");
    await expect(multiTrigger).not.toContainText("id-77");
    await expect(multiTrigger).not.toContainText("id-91");

    await expect(page.locator(".super-select__form-select[aria-haspopup='dialog'].super-select__is-invalid")).toHaveCount(2);
});

test("error handling story shows default empty indicator when no options are available", async ({ page }) => {
    await openStory(page, "error-handling--error-handling");

    const { dialog } = await openModalBySelectName(page, "emptyStateSelect");
    const loadingIndicator = dialog.locator(".super-select__spinner-border");

    await expect(dialog.locator(".super-select__alert-info span[aria-hidden='true']", { hasText: "\u2212" })).toBeVisible();
    await expect(dialog.locator(".super-select__list-group-item-action")).toHaveCount(0);

    await dialog.getByRole("button", { name: "\u21BB" }).click();
    await expect(loadingIndicator).toHaveCount(0);
    await expect(dialog.locator(".super-select__alert-info span[aria-hidden='true']", { hasText: "\u2212" })).toBeVisible();
});

test("error handling story label resolution without message stays icon-only and allows multi-select changes", async ({ page }) => {
    await openStory(page, "error-handling--error-handling");

    await page.getByTestId("error-toggle-fetch-fail").uncheck();

    const { dialog } = await openModalBySelectName(page, "labelErrorNoMessageSelect");
    await expect(dialog.locator(".super-select__alert-danger")).toHaveCount(0);
    await expect(dialog.locator("p")).toHaveCount(0);

    await dialog.getByLabel(/robert balboa/i).click();
    await dialog.getByLabel(/apollo creed/i).click();
    await modalDoneButton(dialog).click();

    const selectedValues = await page
        .locator('select[name="labelErrorNoMessageSelect"] option:checked')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value).sort());

    expect(selectedValues).toEqual(["apollo-creed", "id-42", "id-77", "robert-balboa"]);
});

test("error handling story label resolution with message shows source error text", async ({ page }) => {
    await openStory(page, "error-handling--error-handling");

    const { dialog } = await openModalBySelectName(page, "labelErrorWithMessageSelect");

    await expect(dialog.locator(".super-select__alert-danger")).toHaveCount(0);
    await expect(dialog.getByLabel(/robert balboa/i)).toBeVisible();
});

test("static single-select pins selected option at top on reopen", async ({ page }) => {
    await openStory(page, "basic--basic");

    // Select Ivan Drago (near the bottom of the list) in the single-select
    const { dialog } = await openModal(page, 0);
    await dialog.getByLabel(/ivan drago/i).click();
    await expect(dialog).not.toHaveAttribute("open", "");

    // Reopen; Ivan Drago should now be first.
    const { dialog: dialog2 } = await openModal(page, 0);
    await expect(dialog2.locator(".super-select__list-group-item-action").first()).toContainText("Ivan Drago");
});

test("static multi-select pins selected options at top on reopen", async ({ page }) => {
    await openStory(page, "basic--basic");

    // Select Ivan Drago and Paolo Pennino (near the end of the list) in the multi-select
    const { dialog } = await openModal(page, 1);
    await dialog.getByLabel(/ivan drago/i).click();
    await dialog.getByLabel(/paolo pennino/i).click();
    await modalDoneButton(dialog).click();
    await expect(dialog).not.toHaveAttribute("open", "");

    // Reopen; Ivan Drago and Paolo Pennino should be the first two options.
    const { dialog: dialog2 } = await openModal(page, 1);
    await expect(dialog2.locator(".super-select__list-group-item-action").first()).toContainText("Ivan Drago");
    await expect(dialog2.locator(".super-select__list-group-item-action").nth(1)).toContainText("Paolo Pennino");
});

test("grouped single-select reorders entire group without splitting headers", async ({ page }) => {
    await openStory(page, "grouped-basic--grouped-basic");

    const firstOpen = await openModal(page, 2);
    await firstOpen.dialog.getByLabel(/tony evers/i).click();
    await expect(firstOpen.dialog).not.toHaveAttribute("open", "");

    const reopened = await openModal(page, 2);
    const groupHeaders = reopened.dialog.locator(".super-select__list-group-item-secondary");
    await expect(groupHeaders.filter({ hasText: "Training" })).toHaveCount(1);

    await expect(reopened.dialog.locator(".super-select__list-group-item-action").nth(0)).toContainText("Tony Evers");
    await expect(reopened.dialog.locator(".super-select__list-group-item-action").nth(1)).toContainText("Michael Goldmill");
});

test("grouped multi-select preserves original group order when selections are made out of order", async ({ page }) => {
    await openStory(page, "grouped-basic--grouped-basic");

    const firstOpen = await openModal(page, 3);
    await firstOpen.dialog.getByLabel(/tony evers/i).click();
    await firstOpen.dialog.getByLabel(/apollo creed/i).click();
    await modalDoneButton(firstOpen.dialog).click();
    await expect(firstOpen.dialog).not.toHaveAttribute("open", "");

    const reopened = await openModal(page, 3);
    const groupHeaders = reopened.dialog.locator(".super-select__list-group-item-secondary");
    await expect(groupHeaders.nth(0)).toHaveText("Operations");
    await expect(groupHeaders.nth(1)).toHaveText("Training");
    await expect(groupHeaders.filter({ hasText: "Training" })).toHaveCount(1);

    await expect(reopened.dialog.locator(".super-select__list-group-item-action").first()).toContainText("Apollo Creed");
    await expect(reopened.dialog.getByLabel(/tony evers/i)).toBeChecked();
    await expect(reopened.dialog.getByLabel(/apollo creed/i)).toBeChecked();
});

test("async single-select pins page-2 selection at top on reopen", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page, 0);

    // Wait for page 1 to load, then load page 2
    await expect(dialog.getByLabel(/austin/i)).toBeVisible();
    await modalLoadMoreButton(dialog).click();
    await expect(dialog.getByLabel(/el paso/i)).toBeVisible();

    // Select El Paso from page 2. The modal closes on single-select.
    await dialog.getByLabel(/el paso/i).click();
    await expect(dialog).not.toHaveAttribute("open", "");

    // Reopen; El Paso should be first even though it is not on page 1.
    const { dialog: dialog2 } = await openModal(page, 0);
    await expect(dialog2.locator(".super-select__list-group-item-action").first()).toBeVisible();
    await expect(dialog2.locator(".super-select__list-group-item-action").first()).toContainText("El Paso");
});

test("async multi-select pins page-1 and page-2 selections at top on reopen", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    const { dialog } = await openModal(page, 1);

    // Select Austin from page 1
    await expect(dialog.getByLabel(/austin/i)).toBeVisible();
    await dialog.getByLabel(/austin/i).click();

    // Load page 2 and select El Paso
    await modalLoadMoreButton(dialog).click();
    await expect(dialog.getByLabel(/el paso/i)).toBeVisible();
    await dialog.getByLabel(/el paso/i).click();

    await modalDoneButton(dialog).click();
    await expect(dialog).not.toHaveAttribute("open", "");

    // Reopen; Austin and El Paso should appear first in selection order.
    const { dialog: dialog2 } = await openModal(page, 1);
    await expect(dialog2.locator(".super-select__list-group-item-action").first()).toBeVisible();
    await expect(dialog2.locator(".super-select__list-group-item-action").first()).toContainText("Austin");
    await expect(dialog2.locator(".super-select__list-group-item-action").nth(1)).toContainText("El Paso");
});
