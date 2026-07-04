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
    "right-to-left--right-to-left": "/accessibility",
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

function modalTriggerBySelectName(page: Page, name: string) {
    return page.locator(`select[name="${name}"]`).locator('xpath=preceding::button[@aria-haspopup="dialog"][1]');
}

test("basic story renders and updates each selectable mode", async ({ page }) => {
    await openStory(page, "basic--basic");

    await setStoryMode(page, "native");
    const nativeSelect = page.locator('select[name="person"]').first();
    await nativeSelect.selectOption("adrian-pennino");
    await expect(nativeSelect).toHaveValue("adrian-pennino");

    await setStoryMode(page, "modal");
    const modalTrigger = modalTriggerBySelectName(page, "person");
    await modalTrigger.click();
    const modalDialog = page.locator("dialog[open]").first();
    await expect(modalDialog).toHaveAttribute("open", "");
    await modalDialog.getByLabel(/apollo creed/i).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator('select[name="person"]')).toHaveValue("apollo-creed");

    await setStoryMode(page, "option-list");
    const optionListRoot = page.locator('[role="radiogroup"][aria-label="person"]').first();
    await optionListRoot.getByRole("radio", { name: /ivan drago/i }).check();
    await expect(optionListRoot.getByRole("radio", { name: /ivan drago/i })).toBeChecked();

    await setStoryMode(page, "toggle-button");
    const toggleRoot = page.locator('[role="radiogroup"][aria-label="person"]').first();
    const toggleInput = toggleRoot.getByRole("radio", { name: /james lang/i });
    await toggleInput.check();
    await expect(toggleInput).toBeChecked();
    await toggleInput.click();
    await expect(toggleInput).not.toBeChecked();
});

test("switching to option-list mode does not steal focus from the mode selector", async ({ page }) => {
    await openStory(page, "basic--basic");

    const modeSelector = page.getByTestId("story-mode-selector");
    const optionListModeInput = modeSelector.locator('input[type="radio"][value="option-list"]');
    const optionListModeButton = modeSelector.locator('label:has(input[type="radio"][value="option-list"])').first();

    await optionListModeButton.click();
    await expect(optionListModeInput).toBeChecked();
    await expect(page.locator('[role="radiogroup"][aria-label="person"]').first()).toBeVisible();
    await expect(optionListModeInput).toBeFocused();
});

test("keyboard switch to option-list mode keeps focus on the mode selector", async ({ page }) => {
    await openStory(page, "basic--basic");

    const modeSelector = page.getByTestId("story-mode-selector");
    const firstModeInput = modeSelector.locator('input[type="radio"][value="modal"]');
    const optionListModeInput = modeSelector.locator('input[type="radio"][value="option-list"]');

    await firstModeInput.focus();
    await page.keyboard.press("ArrowRight");
    await expect(optionListModeInput).toBeChecked();
    await expect(page.locator('[role="radiogroup"][aria-label="person"]').first()).toBeVisible();
    await expect(optionListModeInput).toBeFocused();
});

test("switching to option-list mode keeps the mode selector in place", async ({ page }) => {
    await openStory(page, "basic--basic");
    await page.setViewportSize({ width: 1000, height: 500 });

    const modeSelector = page.getByTestId("story-mode-selector");
    const optionListModeButton = modeSelector.locator('label:has(input[type="radio"][value="option-list"])').first();
    await modeSelector.evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "center" }));
    const positionBefore = await modeSelector.evaluate((element) => element.getBoundingClientRect().top);

    await optionListModeButton.click();
    await expect(page.locator('[role="radiogroup"][aria-label="person"]').first()).toBeVisible();

    const positionAfter = await modeSelector.evaluate((element) => element.getBoundingClientRect().top);
    expect(positionAfter).toBe(positionBefore);
});

test("switching to native single-select does not auto-commit browser default selection into shared state", async ({ page }) => {
    await openStory(page, "configuration--configuration");

    await setStoryMode(page, "native");
    const nativeSelect = page.locator('select[name="configuredSelect"]');
    await expect(nativeSelect).toHaveValue("robert-balboa");

    await setStoryMode(page, "modal");
    await expect(page.locator('select[name="configuredSelect"]')).toHaveValue("");
    const modalTrigger = page.locator('select[name="configuredSelect"]').locator('xpath=preceding::button[@aria-haspopup="dialog"][1]');
    await expect(modalTrigger).not.toContainText("Robert Balboa");
});

test("option children render in option rows and modal selected content", async ({ page }) => {
    await openStory(page, "basic--basic");

    await setStoryMode(page, "modal");
    const modalTrigger = modalTriggerBySelectName(page, "richOptionContent");
    await modalTrigger.click();
    const dialog = page.locator("dialog[open]").first();
    await expect(dialog.getByText("Texas")).toBeVisible();
    await dialog.getByLabel(/austin texas/i).click();
    await expect(modalTrigger).toContainText("Austin");
    await expect(modalTrigger).toContainText("Texas");

    await setStoryMode(page, "option-list");
    const optionListRoot = page.locator('[role="radiogroup"][aria-label="richOptionContent"]');
    await expect(optionListRoot.getByText("Texas")).toBeVisible();
    await optionListRoot.getByRole("radio", { name: /chicago illinois/i }).check();
    await expect(optionListRoot.getByRole("radio", { name: /chicago illinois/i })).toBeChecked();

    await setStoryMode(page, "toggle-button");
    const toggleRoot = page.locator('[role="radiogroup"][aria-label="richOptionContent"]');
    await expect(toggleRoot.getByText("Washington")).toBeVisible();
    await toggleRoot.getByRole("radio", { name: /seattle washington/i }).check();
    await expect(toggleRoot.getByRole("radio", { name: /seattle washington/i })).toBeChecked();

    await setStoryMode(page, "native");
    const nativeSelect = page.locator('select[name="richOptionContent"]');
    await expect(nativeSelect.locator('option[value="austin"]')).toContainText("Austin Texas");
    await nativeSelect.selectOption("austin");
    await expect(nativeSelect).toHaveValue("austin");
});

test("rich option example uses the default native select with customizable option content", async ({ page }) => {
    await page.goto("/configuration");
    const example = page.locator(".super-select-story__page").filter({ has: page.locator('label[for="rich-option-content-color"]') });

    const multipleTrigger = example.locator('select[name="colors"]').locator('xpath=preceding::button[@aria-haspopup="dialog"][1]');
    await expect(multipleTrigger.locator('span[aria-hidden="true"]')).toHaveCount(2);

    await example.locator('button[aria-haspopup="dialog"]').first().click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.getByRole("radio")).toHaveCount(5);
    await dialog.press("Escape");

    await example.locator('input[type="radio"][value="native"]').click();
    const nativeSelect = example.locator("select#rich-option-content-color");

    await expect(nativeSelect.locator(":scope > button > selectedcontent")).toHaveCount(1);
    await expect(nativeSelect.locator('option[value="ocean-blue"] > span')).toHaveCount(1);
    await expect(nativeSelect.locator('option[value="ocean-blue"]')).not.toHaveAttribute("label");
    await expect.poll(() => nativeSelect.evaluate((element) => getComputedStyle(element).appearance)).toBe("base-select");

    const nativeMultipleSelect = example.locator("select#rich-option-content-colors");
    await expect(nativeMultipleSelect).toHaveValues(["ocean-blue", "emerald"]);
    await expect(nativeMultipleSelect.locator(":scope > button > selectedcontent")).toHaveCount(0);
    await expect(nativeMultipleSelect.locator("option > span")).toHaveCount(5);
    await expect.poll(() => nativeMultipleSelect.evaluate((element) => getComputedStyle(element).appearance)).toBe("base-select");
});

test("mode resolver waits for async initial page and then picks modal or native mode", async ({ page }) => {
    await openStory(page, "mode-resolution--mode-resolution");

    const largeSection = page.getByTestId("super-resolve-large");
    const smallSection = page.getByTestId("super-resolve-small");
    await expect(largeSection.locator('button[aria-haspopup="dialog"]')).toBeVisible();
    await expect(smallSection.locator('select[name="superResolveSmall"]')).toBeVisible();

    const largeTrigger = largeSection.locator('button[aria-haspopup="dialog"]');
    await largeTrigger.click();
    const largeDialog = page.locator("dialog[open]").first();
    await expect(largeDialog).toHaveAttribute("open", "");
    await largeDialog.getByLabel(/chicago/i).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator('select[name="superResolveLarge"]')).toHaveValue("chicago");

    const smallSelect = smallSection.locator('select[name="superResolveSmall"]');
    await expect(smallSelect).toBeVisible();
    await smallSelect.selectOption("adrian-pennino");
    await expect(smallSelect).toHaveValue("adrian-pennino");
});

test("native and toggle modes use async default page when optionSource is provided", async ({ page }) => {
    await openStory(page, "async-first-page-fallback--async-first-page-fallback");

    const nativeSelect = page.getByTestId("super-async-native").locator('select[name="superAsyncNative"]');
    await expect(nativeSelect.locator("option")).toHaveCount(3);
    await expect(nativeSelect.locator('option[value="robert-balboa"]')).toHaveText("Robert Balboa Local");
    await expect(nativeSelect.locator('option[value="adrian-pennino"]')).toHaveText("Adrian Pennino Remote");
    await expect(nativeSelect.locator('option[value="james-lang"]')).toHaveCount(0);

    await nativeSelect.selectOption("apollo-creed");
    await expect(nativeSelect).toHaveValue("apollo-creed");

    const toggleRoot = page.locator('[role="radiogroup"][aria-label="superAsyncToggle"]');
    await expect(toggleRoot.getByRole("radio", { name: /robert balboa remote/i })).toBeVisible();
    await expect(toggleRoot.getByRole("radio")).toHaveCount(3);
    await expect(toggleRoot.getByRole("radio", { name: /james lang remote/i })).toHaveCount(0);

    await toggleRoot.getByRole("radio", { name: /adrian pennino remote/i }).check();
    await expect(toggleRoot.getByRole("radio", { name: /adrian pennino remote/i })).toBeChecked();
});

test("native and toggle modes use async first page even when the source has more pages", async ({ page }) => {
    await openStory(page, "async-features--async-features");

    await setStoryMode(page, "native");
    const nativeSelect = page.locator('select[name="asyncCity"]');
    await expect(nativeSelect.locator("option")).toHaveCount(8);
    await expect(nativeSelect.locator('option[value="austin"]')).toHaveText("Austin");
    await expect(nativeSelect.locator('option[value="los-angeles"]')).toHaveCount(0);

    await setStoryMode(page, "toggle-button");
    const toggleRoot = page.locator('[role="radiogroup"][aria-label="asyncCity"]');
    await expect(toggleRoot.getByRole("radio", { name: "Austin" })).toBeVisible();
    await expect(toggleRoot.getByRole("radio")).toHaveCount(8);
    await expect(toggleRoot.getByRole("radio", { name: "Los Angeles" })).toHaveCount(0);
});

test("async multi-select example displays every selected value", async ({ page }) => {
    await openStory(page, "async-features--async-features");
    await setStoryMode(page, "option-list");

    const multiRoot = page.locator('[role="group"][aria-label="asyncCities"]');
    await expect(multiRoot.getByRole("checkbox", { name: "Austin" })).toBeVisible();
    await multiRoot.getByRole("checkbox", { name: "Austin" }).check();
    await multiRoot.getByRole("checkbox", { name: "Boston" }).check();

    await expect(page.getByText("Selected: austin,boston")).toBeVisible();
});

test("multiple select preserves a selected empty-string option in every mode", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    const modalFixture = page.getByTestId("empty-value-selection-modal");
    await modalFixture.getByRole("button", { name: "emptyValueSelection-modal" }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.getByRole("checkbox", { name: "Empty value" }).check();
    await dialog.getByRole("checkbox", { name: "Alpha" }).check();
    await dialog.locator(".super-select__modal-footer button").click();
    await expect(modalFixture.getByRole("status")).toHaveText('["","alpha"]');

    const nativeFixture = page.getByTestId("empty-value-selection-native");
    await nativeFixture.locator("select").selectOption(["", "alpha"]);
    await expect(nativeFixture.getByRole("status")).toHaveText('["","alpha"]');

    const optionListFixture = page.getByTestId("empty-value-selection-option-list");
    const optionList = optionListFixture.getByRole("group", { name: "emptyValueSelection-option-list" });
    await optionList.getByRole("checkbox", { name: "Empty value" }).check();
    await optionList.getByRole("checkbox", { name: "Alpha" }).check();
    await expect(optionList.getByRole("checkbox", { name: "Empty value" })).toBeChecked();
    await expect(optionListFixture.getByRole("status")).toHaveText('["","alpha"]');

    const toggleFixture = page.getByTestId("empty-value-selection-toggle-button");
    const toggleButtons = toggleFixture.getByRole("group", { name: "emptyValueSelection-toggle-button" });
    await toggleButtons.getByRole("checkbox", { name: "Empty value" }).check();
    await toggleButtons.getByRole("checkbox", { name: "Alpha" }).check();
    await expect(toggleButtons.getByRole("checkbox", { name: "Empty value" })).toBeChecked();
    await expect(toggleFixture.getByRole("status")).toHaveText('["","alpha"]');
});

test("required modal without a name still participates in form validation", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
        if (message.type() === "error") {
            consoleErrors.push(message.text());
        }
    });

    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    await page.getByRole("button", { name: "Submit unnamed modal form" }).click();
    await expect(page.getByTestId("required-unnamed-modal-submit-count")).toHaveText("0");
    expect(consoleErrors).toEqual([]);

    await page.getByRole("button", { name: "requiredUnnamedModal" }).click();
    await page.locator("dialog[open]").getByRole("radio", { name: "Alpha" }).click();
    await page.getByRole("button", { name: "Submit unnamed modal form" }).click();
    await expect(page.getByTestId("required-unnamed-modal-submit-count")).toHaveText("1");
});

test("required option list stays valid when its selected option is filtered out", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    const optionList = page.getByRole("radiogroup", { name: "requiredFilteredOptionList" });
    await expect(optionList.getByRole("radio", { name: "Alpha" })).toBeChecked();
    await optionList.locator('xpath=preceding::input[@type="search"][1]').fill("bravo");
    await expect(optionList.getByRole("radio", { name: "Bravo" })).toBeVisible();
    await expect(optionList.getByRole("radio", { name: "Alpha" })).toHaveCount(0);

    await page.getByRole("button", { name: "Submit filtered option list form" }).click();
    await expect(page.getByTestId("required-filtered-option-list-submit-count")).toHaveText("1");
});

test("required select remains invalid while async options are loading", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    await page.getByRole("button", { name: "Submit required async fallback form" }).click();
    await expect(page.getByTestId("required-async-fallback-submit-count")).toHaveText("0");
    await expect(page.getByTestId("required-async-fallback-invalid-count")).toHaveText("1");
});

test("selected hidden option stays out of the rendered option list", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    const optionList = page.getByRole("radiogroup", { name: "hiddenSelectedOption" });
    await expect(optionList.getByRole("radio", { name: "Visible option" })).toBeVisible();
    await expect(optionList.getByRole("radio", { name: "Hidden option" })).toHaveCount(0);
});

test("standalone custom modes reset uncontrolled selections to their defaults", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    const modalForm = page.getByTestId("standalone-modal-reset-form");
    const modalButton = modalForm.getByRole("button", { name: "standaloneModalReset" });
    await modalButton.click();
    await page.locator("dialog[open]").getByRole("radio", { name: "Bravo" }).click();
    await expect(modalButton).toContainText("Bravo");
    await modalForm.getByRole("button", { name: "Reset standalone modal" }).click();
    await expect(modalButton).toContainText("Alpha");

    const optionListForm = page.getByTestId("standalone-option-list-reset-form");
    const optionList = optionListForm.getByRole("radiogroup", { name: "standaloneOptionListReset" });
    await optionList.getByRole("radio", { name: "Bravo" }).click();
    await expect(optionList.getByRole("radio", { name: "Bravo" })).toBeChecked();
    await optionListForm.getByRole("button", { name: "Reset standalone option list" }).click();
    await expect(optionList.getByRole("radio", { name: "Alpha" })).toBeChecked();

    const toggleForm = page.getByTestId("standalone-toggle-reset-form");
    const toggleButtons = toggleForm.getByRole("radiogroup", { name: "standaloneToggleReset" });
    await toggleButtons.getByRole("radio", { name: "Bravo" }).click();
    await expect(toggleButtons.getByRole("radio", { name: "Bravo" })).toBeChecked();
    await toggleForm.getByRole("button", { name: "Reset standalone toggle buttons" }).click();
    await expect(toggleButtons.getByRole("radio", { name: "Alpha" })).toBeChecked();

    const multipleForm = page.getByTestId("standalone-multiple-reset-form");
    const multipleButtons = multipleForm.getByRole("group", { name: "standaloneMultipleReset" });
    await multipleButtons.getByRole("checkbox", { name: "Alpha" }).click();
    await multipleButtons.getByRole("checkbox", { name: "Charlie" }).click();
    await multipleForm.getByRole("button", { name: "Reset standalone multiple select" }).click();
    await expect(multipleButtons.getByRole("checkbox", { name: "Alpha" })).toBeChecked();
    await expect(multipleButtons.getByRole("checkbox", { name: "Bravo" })).toBeChecked();
    await expect(multipleButtons.getByRole("checkbox", { name: "Charlie" })).not.toBeChecked();
});

test("SuperSelect resets to its original default after a mode switch without firing value events", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    const form = page.getByTestId("mode-switch-reset-form");
    await form.getByRole("button", { name: "modeSwitchReset" }).click();
    await page.locator("dialog[open]").getByRole("radio", { name: "Bravo" }).click();
    await expect(page.getByTestId("form-reset-event-counts")).toHaveText('{"change":1,"input":1,"value":1}');

    await form.getByRole("button", { name: "Use option-list reset mode" }).click();
    const optionList = form.getByRole("radiogroup", { name: "modeSwitchReset" });
    await expect(optionList.getByRole("radio", { name: "Bravo" })).toBeChecked();
    await form.getByRole("button", { name: "Reset mode-switching select" }).click();
    await expect(optionList.getByRole("radio", { name: "Alpha" })).toBeChecked();
    await expect(page.getByTestId("form-reset-event-counts")).toHaveText('{"change":1,"input":1,"value":1}');

    await form.getByRole("button", { name: "Use modal reset mode" }).click();
    await expect(form.getByRole("button", { name: "modeSwitchReset" })).toContainText("Alpha");
});

test("form reset supports external form association", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    const optionList = page.getByRole("radiogroup", { name: "externalFormReset" });
    await optionList.getByRole("radio", { name: "Bravo" }).click();
    await expect(optionList.getByRole("radio", { name: "Bravo" })).toBeChecked();
    await page.getByRole("button", { name: "Reset external form select" }).click();
    await expect(optionList.getByRole("radio", { name: "Alpha" })).toBeChecked();
});

test("form reset leaves controlled values unchanged and respects a cancelled reset", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    const controlledForm = page.getByTestId("controlled-reset-form");
    const controlledButtons = controlledForm.getByRole("radiogroup", { name: "controlledReset" });
    await controlledForm.getByRole("button", { name: "Reset controlled select" }).click();
    await expect(controlledButtons.getByRole("radio", { name: "Bravo" })).toBeChecked();

    const cancelledForm = page.getByTestId("cancelled-reset-form");
    const cancelledButtons = cancelledForm.getByRole("radiogroup", { name: "cancelledReset" });
    await cancelledButtons.getByRole("radio", { name: "Bravo" }).click();
    await cancelledForm.getByRole("button", { name: "Cancel select reset" }).click();
    await expect(cancelledButtons.getByRole("radio", { name: "Bravo" })).toBeChecked();
});

test("modal button shows async selected label after switching away and back", async ({ page }) => {
    await openStory(page, "async-features--async-features");
    await setStoryMode(page, "modal");

    let modalTrigger = modalTriggerBySelectName(page, "asyncCity");
    await modalTrigger.click();
    const dialog = page.locator("dialog[open]").first();
    await expect(dialog.getByRole("radio", { name: "Boston" })).toBeVisible();
    await dialog.getByRole("radio", { name: "Boston" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(modalTrigger).toContainText("Boston");

    await setStoryMode(page, "option-list");
    await expect(page.locator('[role="radiogroup"][aria-label="asyncCity"]').getByRole("radio", { name: "Boston" })).toBeChecked();

    await setStoryMode(page, "modal");
    modalTrigger = modalTriggerBySelectName(page, "asyncCity");
    await expect(modalTrigger).toContainText("Boston");
});

test("toolkit option-list radios support arrow-key selection", async ({ page }) => {
    for (const route of ["/customization-mantine", "/customization-material-ui", "/customization-ant-design"]) {
        await page.goto(route);
        await page.getByTestId("story-ready").first().waitFor();

        const modeSelector = page.getByTestId("story-mode-selector");
        const optionListModeInput = modeSelector.locator('input[type="radio"][value="option-list"]');
        await optionListModeInput.click();
        await expect(optionListModeInput).toBeChecked();

        const optionListRoot = page.locator('[role="radiogroup"]').nth(1);
        const firstRadio = optionListRoot.getByRole("radio").nth(0);
        const secondRadio = optionListRoot.getByRole("radio").nth(1);

        await firstRadio.focus();
        await page.keyboard.press("ArrowDown");

        await expect(secondRadio).toBeChecked();
    }
});

test("custom modes apply select props to their visible controls", async ({ page }) => {
    await openStory(page, "multi-value-label-layout--multi-value-label-layout");

    const modalTrigger = page.getByRole("button", { name: "Modal props label" });
    await expect(modalTrigger).toHaveAttribute("id", "modal-props-select");
    await expect(modalTrigger).toHaveAttribute("title", "Modal props title");
    await expect(modalTrigger).toHaveAttribute("tabindex", "3");
    await expect(modalTrigger).toHaveAttribute("aria-describedby", "select-props-description");
    await expect(modalTrigger).toHaveAttribute("accesskey", "m");
    await expect(modalTrigger).toHaveAttribute("data-select-prop", "modal");
    await expect(modalTrigger).toHaveAttribute("dir", "rtl");
    await expect(modalTrigger).toHaveAttribute("lang", "fr");
    await modalTrigger.dispatchEvent("dblclick");
    await expect(page.getByTestId("modal-props-event-target")).toHaveText("double-click:modal-props-select");
    await modalTrigger.dispatchEvent("wheel");
    await expect(page.getByTestId("modal-props-event-target")).toHaveText("wheel:modal-props-select");
    await modalTrigger.dispatchEvent("animationstart");
    await expect(page.getByTestId("modal-props-event-target")).toHaveText("animation-start:modal-props-select");

    await modalTrigger.click();
    await expect(page.locator("dialog[open]")).toHaveAttribute("aria-label", "Modal props label");
    await page.keyboard.press("Escape");

    const labelledByTrigger = page.getByRole("button", { name: "Modal labelled by existing text" });
    await labelledByTrigger.click();
    await expect(page.locator("dialog[open]")).toHaveAttribute("aria-labelledby", "modal-props-labelledby");
    await page.keyboard.press("Escape");

    const idLabelledTrigger = page.getByRole("button", { name: "Modal labelled through its trigger" });
    await idLabelledTrigger.click();
    await expect(page.locator("dialog[open]")).toHaveAttribute("aria-labelledby", "modal-id-labelled-select");
    await page.keyboard.press("Escape");

    const optionList = page.getByRole("radiogroup", { name: "Option list props label" });
    await expect(page.locator("#option-list-props-select")).toHaveCount(1);
    await expect(optionList).toHaveAttribute("id", "option-list-props-select");
    await expect(optionList).toHaveAttribute("title", "Option list props title");
    await expect(optionList.getByRole("radio", { name: "Alpha" })).toHaveAttribute("tabindex", "4");
    await expect(optionList).toHaveAttribute("aria-describedby", "select-props-description");
    await expect(optionList).toHaveAttribute("accesskey", "o");
    await expect(optionList).toHaveAttribute("data-select-prop", "option-list");
    await expect(optionList).toHaveAttribute("dir", "rtl");
    await expect(optionList).toHaveAttribute("lang", "fr");
    await optionList.dispatchEvent("dblclick");
    await expect(page.getByTestId("option-list-props-event-target")).toHaveText("double-click:option-list-props-select");
    await optionList.dispatchEvent("wheel");
    await expect(page.getByTestId("option-list-props-event-target")).toHaveText("wheel:option-list-props-select");
    await optionList.dispatchEvent("animationstart");
    await expect(page.getByTestId("option-list-props-event-target")).toHaveText("animation-start:option-list-props-select");

    const toggleButtons = page.getByRole("radiogroup", { name: "Toggle props label" });
    await expect(toggleButtons).toHaveAttribute("id", "toggle-props-select");
    await expect(toggleButtons).toHaveAttribute("title", "Toggle props title");
    await expect(toggleButtons).toHaveAttribute("tabindex", "5");
    await expect(toggleButtons).toHaveAttribute("aria-describedby", "select-props-description");
    await expect(toggleButtons).toHaveAttribute("accesskey", "t");
    await expect(toggleButtons).toHaveAttribute("data-select-prop", "toggle");
    await expect(toggleButtons).toHaveAttribute("dir", "rtl");
    await expect(toggleButtons).toHaveAttribute("lang", "fr");
    await toggleButtons.dispatchEvent("dblclick");
    await expect(page.getByTestId("toggle-props-event-target")).toHaveText("double-click:toggle-props-select");
    await toggleButtons.dispatchEvent("wheel");
    await expect(page.getByTestId("toggle-props-event-target")).toHaveText("wheel:toggle-props-select");
    await toggleButtons.dispatchEvent("animationstart");
    await expect(page.getByTestId("toggle-props-event-target")).toHaveText("animation-start:toggle-props-select");

    const fallback = page.locator("#fallback-props-select");
    await expect(fallback).toHaveAttribute("title", "Fallback props title");
    await expect(fallback).toHaveAttribute("tabindex", "6");
    await expect(fallback).toHaveAttribute("aria-label", "Fallback props label");
    await expect(fallback).toHaveAttribute("aria-describedby", "select-props-description");
    await expect(fallback).toHaveAttribute("accesskey", "f");
    await expect(fallback).toHaveAttribute("dir", "rtl");
    await expect(fallback).toHaveAttribute("lang", "fr");
});

test("default styles follow right-to-left direction in every mode", async ({ page }) => {
    await page.goto("/test-fixtures");
    await page.getByTestId("story-ready").first().waitFor();

    const modalTrigger = page.getByRole("button", { name: "Modal props label" });
    await expect(modalTrigger).toHaveCSS("text-align", "start");
    await modalTrigger.click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toHaveAttribute("dir", "rtl");
    await expect(dialog).toHaveAttribute("lang", "fr");
    await expect(dialog.locator(".super-select__list-group-item-action").first()).toHaveCSS("text-align", "start");
    await page.keyboard.press("Escape");

    const optionList = page.getByRole("radiogroup", { name: "Option list props label" });
    await expect(optionList.locator(".super-select__list-group-item-action").first()).toHaveCSS("text-align", "start");

    const toggleButtons = page.getByRole("radiogroup", { name: "Toggle props label" }).locator(".super-select__btn");
    const toggleCorners = await toggleButtons.evaluateAll((buttons) =>
        buttons.map((button) => {
            const style = window.getComputedStyle(button);
            return {
                topLeft: style.borderTopLeftRadius,
                topRight: style.borderTopRightRadius,
            };
        }),
    );
    expect(toggleCorners[0]).toEqual({ topLeft: "0px", topRight: "6px" });
    expect(toggleCorners.at(-1)).toEqual({ topLeft: "6px", topRight: "0px" });

    const nativeSelect = page.getByRole("combobox", { name: "Native props label" });
    await expect(nativeSelect).toHaveCSS("direction", "rtl");
    const backgroundPositionX = await nativeSelect.evaluate((select) => window.getComputedStyle(select).backgroundPositionX);
    expect(backgroundPositionX).toBe("14px, 20px");
});

test("right-to-left example renders Arabic options in every mode", async ({ page }) => {
    await openStory(page, "right-to-left--right-to-left");

    await setStoryMode(page, "modal");
    await modalTriggerBySelectName(page, "rtlCity").click();
    await expect(page.locator("dialog[open]")).toContainText("القاهرة");
    await page.keyboard.press("Escape");

    await setStoryMode(page, "option-list");
    await expect(page.locator('[role="radiogroup"][aria-label="مدينة"]')).toContainText("القاهرة");
    await expect(page.locator('[role="group"][aria-label="مدن"]')).toContainText("بيروت");

    await setStoryMode(page, "toggle-button");
    await expect(page.locator('[role="radiogroup"][aria-label="مدينة"]')).toContainText("القاهرة");
    await expect(page.locator('[role="group"][aria-label="مدن"]')).toContainText("بيروت");

    await setStoryMode(page, "native");
    await expect(page.locator('select[name="rtlCity"] option')).toHaveText(["القاهرة", "دبي", "بيروت"]);
    await expect(page.locator('select[name="rtlCities"] option')).toHaveText(["القاهرة", "دبي", "بيروت"]);
});
