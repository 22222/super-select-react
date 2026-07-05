import { useMemo, useRef, useState } from "react";
import {
    createOptionSource,
    type EmptyIndicatorProps,
    ModalSelect,
    OptionListSelect,
    type OptionSourceLike,
    type PendingIndicatorProps,
    SuperSelect,
    type SuperSelectMode,
    ToggleButtonSelect,
    useOptionSource,
} from "super-select-react";

import AsyncFirstPageFallbackExample from "./async-first-page-fallback";
import FormBehaviorE2EExample from "./form-behavior-e2e";
import MultiValueLabelLayoutExample from "./multi-value-label-layout";
import SearchVisibilityExample from "./search-visibility";

export default function TestFixtures() {
    return (
        <div className="super-select-story__page" data-testid="story-ready">
            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Active Option Source Transition</h3>
                <ActiveOptionSourceTransition />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Unsupported Mode Option Source Transition</h3>
                <UnsupportedModeOptionSourceTransition />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Active Option Source Replacement</h3>
                <ActiveOptionSourceReplacement />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Mode Resolver Option Source Replacement</h3>
                <ModeResolverOptionSourceReplacement />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Multi Value Label Layout</h3>
                <MultiValueLabelLayoutExample />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Search Visibility</h3>
                <SearchVisibilityExample />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Form Behavior</h3>
                <FormBehaviorE2EExample />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Async First Page Fallback</h3>
                <AsyncFirstPageFallbackExample />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Select Props Passthrough</h3>
                <SelectPropsPassthrough />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Fallback Props Passthrough</h3>
                <FallbackPropsPassthrough />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Remove Pending Resolve Source</h3>
                <RemovePendingResolveSource />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Replace Source During Pagination</h3>
                <ReplaceSourceDuringPagination />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Empty Value Selection</h3>
                <EmptyValueSelection />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Required Validation Edge Cases</h3>
                <RequiredValidationEdgeCases />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Hidden Selected Option</h3>
                <HiddenSelectedOption />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Form Reset Behavior</h3>
                <FormResetBehavior />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Load More Form Behavior</h3>
                <LoadMoreFormBehavior />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Custom Pagination Limit</h3>
                <CustomPaginationLimit />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Use Option Source Inline Fetch</h3>
                <UseOptionSourceInlineFetch />
            </section>

            <section className="super-select-story__card">
                <h3 className="super-select-story__card-title">Use Option Source Deps Reset</h3>
                <UseOptionSourceDepsReset />
            </section>
        </div>
    );
}

function UseOptionSourceInlineFetch() {
    const [renderCount, setRenderCount] = useState(1);
    const optionSource = useOptionSource(async ({ search = "" }) => {
        if (typeof window !== "undefined") {
            const testWindow = window as Window & { __useOptionSourceFetchCount?: number };
            testWindow.__useOptionSourceFetchCount = (testWindow.__useOptionSourceFetchCount ?? 0) + 1;
        }

        const normalizedSearch = search.trim().toLowerCase();
        const options = [
            { value: "alpha", label: "Alpha" },
            { value: "bravo", label: "Bravo" },
        ];
        return {
            options: options.filter((option) => option.label.toLowerCase().includes(normalizedSearch)),
            hasMore: false,
        };
    });

    return (
        <div className="super-select-story__stack">
            <button
                type="button"
                className="super-select__btn super-select__btn-secondary"
                onClick={() => setRenderCount((count) => count + 1)}
            >
                Rerender inline fetch
            </button>
            <output data-testid="use-option-source-render-count">{renderCount}</output>
            <SuperSelect
                mode="option-list"
                name="useOptionSourceInlineFetch"
                aria-label="useOptionSourceInlineFetch"
                optionSource={optionSource}
            />
        </div>
    );
}

function UseOptionSourceDepsReset() {
    const [group, setGroup] = useState<"first" | "second">("first");
    const optionSource = useOptionSource(
        async () => ({
            options:
                group === "first" ? [{ value: "first-alpha", label: "First Alpha" }] : [{ value: "second-charlie", label: "Second Charlie" }],
            hasMore: false,
        }),
        [group],
    );

    return (
        <div className="super-select-story__stack">
            <button type="button" className="super-select__btn super-select__btn-secondary" onClick={() => setGroup("second")}>
                Switch source deps
            </button>
            <SuperSelect
                mode="option-list"
                name="useOptionSourceDepsReset"
                aria-label="useOptionSourceDepsReset"
                optionSource={optionSource}
            />
        </div>
    );
}

function CustomPaginationLimit() {
    const optionSource = useMemo(
        () =>
            createOptionSource(async ({ offset = 0 }) => ({
                options: [
                    { value: "alpha", label: "Alpha" },
                    { value: "bravo", label: "Bravo" },
                    { value: "charlie", label: "Charlie" },
                ].slice(offset, offset + 1),
                hasMore: true,
            })),
        [],
    );

    return (
        <OptionListSelect
            name="customPaginationLimit"
            optionSource={optionSource}
            customization={{
                maxAdditionalPages: 1,
                moreIndicator: {
                    loadMoreButton: { content: "Load another page" },
                    overflowIndicator: { content: "More options remain" },
                },
            }}
        />
    );
}

function LoadMoreFormBehavior() {
    const [submitCount, setSubmitCount] = useState(0);
    const optionSource = useMemo(
        () =>
            createOptionSource(async ({ offset = 0 }) => ({
                options: offset === 0 ? [{ value: "alpha", label: "Alpha" }] : [{ value: "bravo", label: "Bravo" }],
                hasMore: offset === 0,
            })),
        [],
    );

    return (
        <form
            data-testid="load-more-form"
            onSubmit={(event) => {
                event.preventDefault();
                setSubmitCount((count) => count + 1);
            }}
        >
            <OptionListSelect name="loadMoreForm" optionSource={optionSource} />
            <output data-testid="load-more-form-submit-count">{submitCount}</output>
        </form>
    );
}

function FormResetBehavior() {
    const [mode, setMode] = useState<SuperSelectMode>("modal");
    const [eventCounts, setEventCounts] = useState({ change: 0, input: 0, value: 0 });

    return (
        <div className="super-select-story__stack">
            <form data-testid="standalone-modal-reset-form">
                <ModalSelect name="standaloneModalReset" aria-label="standaloneModalReset" defaultValue="alpha">
                    <option value="alpha">Alpha</option>
                    <option value="bravo">Bravo</option>
                </ModalSelect>
                <button type="reset">Reset standalone modal</button>
            </form>

            <form data-testid="standalone-option-list-reset-form">
                <OptionListSelect name="standaloneOptionListReset" aria-label="standaloneOptionListReset" defaultValue="alpha">
                    <option value="alpha">Alpha</option>
                    <option value="bravo">Bravo</option>
                </OptionListSelect>
                <button type="reset">Reset standalone option list</button>
            </form>

            <form data-testid="standalone-toggle-reset-form">
                <ToggleButtonSelect name="standaloneToggleReset" aria-label="standaloneToggleReset" defaultValue="alpha">
                    <option value="alpha">Alpha</option>
                    <option value="bravo">Bravo</option>
                </ToggleButtonSelect>
                <button type="reset">Reset standalone toggle buttons</button>
            </form>

            <form data-testid="standalone-multiple-reset-form">
                <ToggleButtonSelect
                    multiple
                    name="standaloneMultipleReset"
                    aria-label="standaloneMultipleReset"
                    defaultValue={["alpha", "bravo"]}
                >
                    <option value="alpha">Alpha</option>
                    <option value="bravo">Bravo</option>
                    <option value="charlie">Charlie</option>
                </ToggleButtonSelect>
                <button type="reset">Reset standalone multiple select</button>
            </form>

            <form data-testid="mode-switch-reset-form">
                <button type="button" onClick={() => setMode("modal")}>
                    Use modal reset mode
                </button>
                <button type="button" onClick={() => setMode("option-list")}>
                    Use option-list reset mode
                </button>
                <SuperSelect
                    mode={mode}
                    name="modeSwitchReset"
                    aria-label="modeSwitchReset"
                    defaultValue="alpha"
                    onChange={() => setEventCounts((counts) => ({ ...counts, change: counts.change + 1 }))}
                    onInput={() => setEventCounts((counts) => ({ ...counts, input: counts.input + 1 }))}
                    onValueChange={() => setEventCounts((counts) => ({ ...counts, value: counts.value + 1 }))}
                >
                    <option value="alpha">Alpha</option>
                    <option value="bravo">Bravo</option>
                </SuperSelect>
                <button type="reset">Reset mode-switching select</button>
                <output data-testid="form-reset-event-counts">{JSON.stringify(eventCounts)}</output>
            </form>

            <form id="external-reset-form">
                <button type="reset">Reset external form select</button>
            </form>
            <OptionListSelect form="external-reset-form" name="externalFormReset" aria-label="externalFormReset" defaultValue="alpha">
                <option value="alpha">Alpha</option>
                <option value="bravo">Bravo</option>
            </OptionListSelect>

            <form data-testid="controlled-reset-form">
                <ToggleButtonSelect name="controlledReset" aria-label="controlledReset" value="bravo" onChange={() => undefined}>
                    <option value="alpha">Alpha</option>
                    <option value="bravo">Bravo</option>
                </ToggleButtonSelect>
                <button type="reset">Reset controlled select</button>
            </form>

            <form
                data-testid="cancelled-reset-form"
                onReset={(event) => {
                    event.preventDefault();
                }}
            >
                <ToggleButtonSelect name="cancelledReset" aria-label="cancelledReset" defaultValue="alpha">
                    <option value="alpha">Alpha</option>
                    <option value="bravo">Bravo</option>
                </ToggleButtonSelect>
                <button type="reset">Cancel select reset</button>
            </form>
        </div>
    );
}

function EmptyValueSelection() {
    const [valuesByMode, setValuesByMode] = useState<Record<SuperSelectMode, string[]>>({
        modal: [],
        native: [],
        "option-list": [],
        "toggle-button": [],
    });

    return (
        <div className="super-select-story__stack">
            {(["modal", "native", "option-list", "toggle-button"] satisfies SuperSelectMode[]).map((mode) => (
                <div key={mode} data-testid={`empty-value-selection-${mode}`}>
                    <SuperSelect
                        mode={mode}
                        multiple
                        name={`emptyValueSelection-${mode}`}
                        aria-label={`emptyValueSelection-${mode}`}
                        value={valuesByMode[mode]}
                        onValueChange={(nextValue) =>
                            setValuesByMode((currentValues) => ({
                                ...currentValues,
                                [mode]: Array.isArray(nextValue) ? nextValue : [nextValue],
                            }))
                        }
                    >
                        <option value="">Empty value</option>
                        <option value="alpha">Alpha</option>
                    </SuperSelect>
                    <output>{JSON.stringify(valuesByMode[mode])}</output>
                </div>
            ))}
        </div>
    );
}

function RequiredValidationEdgeCases() {
    const [modalSubmitCount, setModalSubmitCount] = useState(0);
    const [optionListSubmitCount, setOptionListSubmitCount] = useState(0);
    const [fallbackSubmitCount, setFallbackSubmitCount] = useState(0);
    const [fallbackInvalidCount, setFallbackInvalidCount] = useState(0);
    const optionSource = useMemo(
        () =>
            createOptionSource(async ({ search = "" }) => {
                const normalizedSearch = search.trim().toLowerCase();
                const options = [
                    { value: "alpha", label: "Alpha" },
                    { value: "bravo", label: "Bravo" },
                ].filter((option) => option.label.toLowerCase().includes(normalizedSearch));
                return { options, hasMore: false };
            }),
        [],
    );
    const pendingOptionSource = useMemo(() => createOptionSource(() => new Promise<never>(() => undefined)), []);

    return (
        <div className="super-select-story__stack">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setModalSubmitCount((count) => count + 1);
                }}
            >
                <SuperSelect mode="modal" required aria-label="requiredUnnamedModal">
                    <option value="alpha">Alpha</option>
                    <option value="bravo">Bravo</option>
                </SuperSelect>
                <button type="submit">Submit unnamed modal form</button>
                <output data-testid="required-unnamed-modal-submit-count">{modalSubmitCount}</output>
            </form>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setOptionListSubmitCount((count) => count + 1);
                }}
            >
                <SuperSelect
                    mode="option-list"
                    required
                    name="requiredFilteredOptionList"
                    aria-label="requiredFilteredOptionList"
                    defaultValue="alpha"
                    optionSource={optionSource}
                />
                <button type="submit">Submit filtered option list form</button>
                <output data-testid="required-filtered-option-list-submit-count">{optionListSubmitCount}</output>
            </form>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setFallbackSubmitCount((count) => count + 1);
                }}
            >
                <SuperSelect
                    mode="toggle-button"
                    required
                    name="requiredAsyncFallback"
                    optionSource={pendingOptionSource}
                    onInvalid={() => setFallbackInvalidCount((count) => count + 1)}
                />
                <button type="submit">Submit required async fallback form</button>
                <output data-testid="required-async-fallback-submit-count">{fallbackSubmitCount}</output>
                <output data-testid="required-async-fallback-invalid-count">{fallbackInvalidCount}</output>
            </form>
        </div>
    );
}

function HiddenSelectedOption() {
    const optionSource = useMemo<OptionSourceLike>(
        () => ({
            getOptionPage: async () => ({
                options: [
                    { value: "hidden", label: "Hidden option", hidden: true },
                    { value: "visible", label: "Visible option" },
                ],
                hasMore: false,
            }),
            resolveValues: async () => [{ value: "hidden", label: "Hidden option", hidden: true }],
        }),
        [],
    );

    return <SuperSelect mode="option-list" aria-label="hiddenSelectedOption" value="hidden" optionSource={optionSource} />;
}

function SelectPropsPassthrough() {
    const [modalEventTarget, setModalEventTarget] = useState("");
    const [optionListEventTarget, setOptionListEventTarget] = useState("");
    const [toggleEventTarget, setToggleEventTarget] = useState("");

    return (
        <div className="super-select-story__stack">
            <p id="select-props-description">Select props passthrough fixture.</p>

            <SuperSelect
                mode="modal"
                id="modal-props-select"
                name="modalPropsSelect"
                title="Modal props title"
                tabIndex={3}
                aria-label="Modal props label"
                aria-describedby="select-props-description"
                accessKey="m"
                data-select-prop="modal"
                dir="rtl"
                lang="fr"
                onDoubleClick={(event) => setModalEventTarget(`double-click:${event.currentTarget.id ?? ""}`)}
                onWheel={(event) => setModalEventTarget(`wheel:${event.currentTarget.id ?? ""}`)}
                onAnimationStart={(event) => setModalEventTarget(`animation-start:${event.currentTarget.id ?? ""}`)}
            >
                <option value="alpha">Alpha</option>
                <option value="bravo">Bravo</option>
            </SuperSelect>
            <span data-testid="modal-props-event-target">{modalEventTarget}</span>

            <span id="modal-props-labelledby">Modal labelled by existing text</span>
            <SuperSelect mode="modal" name="modalLabelledBySelect" aria-labelledby="modal-props-labelledby">
                <option value="alpha">Alpha</option>
                <option value="bravo">Bravo</option>
            </SuperSelect>

            <label htmlFor="modal-id-labelled-select">Modal labelled through its trigger</label>
            <SuperSelect mode="modal" id="modal-id-labelled-select" name="modalIdLabelledSelect">
                <option value="alpha">Alpha</option>
                <option value="bravo">Bravo</option>
            </SuperSelect>

            <SuperSelect
                mode="option-list"
                id="option-list-props-select"
                name="optionListPropsSelect"
                title="Option list props title"
                tabIndex={4}
                aria-label="Option list props label"
                aria-describedby="select-props-description"
                accessKey="o"
                data-select-prop="option-list"
                dir="rtl"
                lang="fr"
                required
                onDoubleClick={(event) => setOptionListEventTarget(`double-click:${event.currentTarget.id ?? ""}`)}
                onWheel={(event) => setOptionListEventTarget(`wheel:${event.currentTarget.id ?? ""}`)}
                onAnimationStart={(event) => setOptionListEventTarget(`animation-start:${event.currentTarget.id ?? ""}`)}
            >
                <option value="alpha">Alpha</option>
                <option value="bravo">Bravo</option>
            </SuperSelect>
            <span data-testid="option-list-props-event-target">{optionListEventTarget}</span>

            <SuperSelect
                mode="toggle-button"
                id="toggle-props-select"
                name="togglePropsSelect"
                title="Toggle props title"
                tabIndex={5}
                aria-label="Toggle props label"
                aria-describedby="select-props-description"
                accessKey="t"
                data-select-prop="toggle"
                dir="rtl"
                lang="fr"
                onDoubleClick={(event) => setToggleEventTarget(`double-click:${event.currentTarget.id ?? ""}`)}
                onWheel={(event) => setToggleEventTarget(`wheel:${event.currentTarget.id ?? ""}`)}
                onAnimationStart={(event) => setToggleEventTarget(`animation-start:${event.currentTarget.id ?? ""}`)}
            >
                <option value="alpha">Alpha</option>
                <option value="bravo">Bravo</option>
            </SuperSelect>
            <span data-testid="toggle-props-event-target">{toggleEventTarget}</span>

            <SuperSelect mode="native" name="nativePropsSelect" aria-label="Native props label" dir="rtl" lang="fr">
                <option value="alpha">Alpha</option>
                <option value="bravo">Bravo</option>
            </SuperSelect>
        </div>
    );
}

function FallbackPropsPassthrough() {
    const optionSource = useMemo(
        () => createOptionSource(() => new Promise<{ options: { value: string; label: string }[]; hasMore: boolean }>(() => undefined)),
        [],
    );

    return (
        <SuperSelect
            mode="native"
            id="fallback-props-select"
            name="fallbackPropsSelect"
            title="Fallback props title"
            tabIndex={6}
            aria-label="Fallback props label"
            aria-describedby="select-props-description"
            accessKey="f"
            dir="rtl"
            lang="fr"
            optionSource={optionSource}
        />
    );
}

function RemovePendingResolveSource() {
    const [hasSource, setHasSource] = useState(true);
    const optionSource = useMemo<OptionSourceLike>(
        () => ({
            getOptionPage: async () => ({
                options: [{ value: "alpha", label: "Alpha" }],
                hasMore: false,
            }),
            resolveValues: (_values, signal) =>
                new Promise((_, reject) => {
                    signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
                }),
        }),
        [],
    );

    return (
        <div className="super-select-story__stack">
            <button type="button" className="super-select__btn super-select__btn-secondary" onClick={() => setHasSource(false)}>
                Remove source
            </button>
            <SuperSelect
                mode="modal"
                name="removePendingResolveSource"
                aria-label="removePendingResolveSource"
                value="missing-value"
                optionSource={hasSource ? optionSource : undefined}
            />
        </div>
    );
}

function ReplaceSourceDuringPagination() {
    const [version, setVersion] = useState<"first" | "second">("first");
    const resolveOldPageRef = useRef<() => void>(() => undefined);
    const optionSource = useMemo<OptionSourceLike>(
        () => ({
            getOptionPage: async () => ({
                options:
                    version === "first"
                        ? [{ value: "first-alpha", label: "First Alpha" }]
                        : [{ value: "second-alpha", label: "Second Alpha" }],
                hasMore: version === "first",
                nextPage:
                    version === "first"
                        ? (options) =>
                              new Promise((resolve, reject) => {
                                  resolveOldPageRef.current = () =>
                                      resolve({
                                          options: [{ value: "first-bravo", label: "First Bravo" }],
                                          hasMore: false,
                                      });
                                  options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
                                      once: true,
                                  });
                              })
                        : undefined,
            }),
            resolveValues: async () => [],
        }),
        [version],
    );

    return (
        <div className="super-select-story__stack">
            <button type="button" className="super-select__btn super-select__btn-secondary" onClick={() => setVersion("second")}>
                Replace paginated source
            </button>
            <button type="button" className="super-select__btn super-select__btn-secondary" onClick={() => resolveOldPageRef.current()}>
                Resolve old page
            </button>
            <SuperSelect
                mode="option-list"
                name="replaceSourceDuringPagination"
                aria-label="replaceSourceDuringPagination"
                optionSource={optionSource}
            />
        </div>
    );
}

function ActiveOptionSourceTransition() {
    const [enabled, setEnabled] = useState(false);
    const optionSource = useAsyncOptionSource();

    return (
        <div className="super-select-story__stack">
            <button type="button" className="super-select__btn super-select__btn-secondary" onClick={() => setEnabled(true)}>
                Enable source
            </button>
            <SuperSelect
                mode="option-list"
                name="activeOptionSourceTransition"
                optionSource={enabled ? optionSource : undefined}
                customization={{
                    pendingIndicator: {
                        component: (props) => <TransitionPendingIndicator {...props} name="activeOptionSourceTransition" />,
                    },
                    emptyIndicator: {
                        component: (props) => <TransitionEmptyIndicator {...props} name="activeOptionSourceTransition" />,
                    },
                }}
            />
        </div>
    );
}

function UnsupportedModeOptionSourceTransition() {
    const [enabled, setEnabled] = useState(false);
    const optionSource = useAsyncOptionSource();

    return (
        <div className="super-select-story__stack">
            <button type="button" className="super-select__btn super-select__btn-secondary" onClick={() => setEnabled(true)}>
                Enable source
            </button>
            <SuperSelect
                mode="toggle-button"
                name="unsupportedModeOptionSourceTransition"
                optionSource={enabled ? optionSource : undefined}
                customization={{
                    pendingIndicator: {
                        component: (props) => <TransitionPendingIndicator {...props} name="unsupportedModeOptionSourceTransition" />,
                    },
                }}
            />
        </div>
    );
}

function ActiveOptionSourceReplacement() {
    const [version, setVersion] = useState<"first" | "second">("first");
    const optionSource = useMemo(
        () =>
            createOptionSource(async () => {
                await new Promise((resolve) => window.setTimeout(resolve, 150));
                return {
                    options:
                        version === "first"
                            ? [
                                  { value: "alpha", label: "Alpha" },
                                  { value: "bravo", label: "Bravo" },
                              ]
                            : [
                                  { value: "charlie", label: "Charlie" },
                                  { value: "delta", label: "Delta" },
                              ],
                    hasMore: false,
                };
            }),
        [version],
    );

    return (
        <div className="super-select-story__stack">
            <button type="button" className="super-select__btn super-select__btn-secondary" onClick={() => setVersion("second")}>
                Replace source
            </button>
            <SuperSelect
                mode="option-list"
                name="activeOptionSourceReplacement"
                optionSource={optionSource}
                customization={{
                    pendingIndicator: {
                        component: (props) => <TransitionPendingIndicator {...props} name="activeOptionSourceReplacement" />,
                    },
                }}
            />
        </div>
    );
}

function ModeResolverOptionSourceReplacement() {
    const [version, setVersion] = useState<"first" | "second">("first");
    const optionSource = useMemo(
        () =>
            createOptionSource(async () => {
                await new Promise((resolve) => window.setTimeout(resolve, 150));
                return {
                    options:
                        version === "first"
                            ? [
                                  { value: "alpha", label: "Alpha" },
                                  { value: "bravo", label: "Bravo" },
                              ]
                            : [
                                  { value: "charlie", label: "Charlie" },
                                  { value: "delta", label: "Delta" },
                              ],
                    hasMore: false,
                };
            }),
        [version],
    );

    return (
        <div className="super-select-story__stack">
            <button type="button" className="super-select__btn super-select__btn-secondary" onClick={() => setVersion("second")}>
                Replace resolver source
            </button>
            <SuperSelect
                name="modeResolverOptionSourceReplacement"
                optionSource={optionSource}
                mode={(context) => {
                    if (typeof window !== "undefined") {
                        const testWindow = window as Window & { __modeResolverOptionLabels?: string[] };
                        testWindow.__modeResolverOptionLabels = [
                            ...(testWindow.__modeResolverOptionLabels ?? []),
                            context.options.map((option) => option.label).join(","),
                        ];
                    }

                    return "native";
                }}
                customization={{
                    pendingIndicator: {
                        component: (props) => <TransitionPendingIndicator {...props} name="modeResolverOptionSourceReplacement" />,
                    },
                }}
            />
        </div>
    );
}

function useAsyncOptionSource() {
    return useMemo(
        () =>
            createOptionSource(async () => {
                await new Promise((resolve) => window.setTimeout(resolve, 150));
                return {
                    options: [
                        { value: "alpha", label: "Alpha" },
                        { value: "bravo", label: "Bravo" },
                    ],
                    hasMore: false,
                };
            }),
        [],
    );
}

function TransitionPendingIndicator({ name, ...props }: PendingIndicatorProps & { name: string }) {
    if (typeof window !== "undefined") {
        const testWindow = window as Window & { __transitionPendingNames?: string[] };
        testWindow.__transitionPendingNames = [...(testWindow.__transitionPendingNames ?? []), name];
    }

    return (
        <span className={props.className} style={props.style} role="status" title={props.title}>
            Loading options.
        </span>
    );
}

function TransitionEmptyIndicator({ name, ...props }: EmptyIndicatorProps & { name: string }) {
    if (typeof window !== "undefined") {
        const testWindow = window as Window & { __transitionEmptyNames?: string[] };
        testWindow.__transitionEmptyNames = [...(testWindow.__transitionEmptyNames ?? []), name];
    }

    return (
        <span className={props.className} style={props.style}>
            No options.
        </span>
    );
}
