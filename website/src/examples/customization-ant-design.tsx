import { Button, ConfigProvider, Modal } from "antd";
import { useMemo, useState } from "react";
import { createOptionSource, type SuperSelectMode } from "super-select-react";

import { AntdSuperSelect } from "../components/AntdSuperSelect";
import { ModeSelector } from "./ModeSelector";

export default function Example() {
    const [mode, setMode] = useState<SuperSelectMode | undefined>(undefined);
    const [isOuterModalOpen, setIsOuterModalOpen] = useState(false);

    const neverResolvingSource = useMemo(
        () =>
            createOptionSource({
                fetch: ({ signal }) =>
                    new Promise((_, reject) => {
                        signal?.addEventListener(
                            "abort",
                            () => {
                                reject(new DOMException("The operation was aborted.", "AbortError"));
                            },
                            { once: true },
                        );
                    }),
            }),
        [],
    );

    const errorSource = useMemo(
        () =>
            createOptionSource({
                fetch: async () => {
                    throw new Error("Request failed");
                },
            }),
        [],
    );

    return (
        <ConfigProvider>
            <div className="super-select-story__page" data-testid="story-ready">
                <ModeSelector mode={mode} setMode={setMode} />

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Single Select</h3>
                    <div className="super-select-story__mt-8">
                        <AntdSuperSelect mode={mode} name="antdSingleCustomization">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </AntdSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Multi Select</h3>
                    <div className="super-select-story__mt-8">
                        <AntdSuperSelect mode={mode} multiple name="antdMultiCustomization">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </AntdSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Grouped Options</h3>
                    <div className="super-select-story__mt-8">
                        <AntdSuperSelect mode={mode} name="antdGroupedCustomization">
                            <optgroup label="Group A">
                                <option value="robert-balboa">Robert Balboa</option>
                                <option value="adrian-pennino">Adrian Pennino</option>
                            </optgroup>
                            <optgroup label="Group B">
                                <option value="apollo-creed">Apollo Creed</option>
                                <option value="james-lang">James Lang</option>
                                <option value="ivan-drago">Ivan Drago</option>
                            </optgroup>
                        </AntdSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Loading State</h3>
                    <div className="super-select-story__mt-8">
                        <AntdSuperSelect
                            mode={mode}
                            name="antdLoadingCustomization"
                            optionSource={neverResolvingSource}
                            defaultValue="apollo-creed"
                        />
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Error State</h3>
                    <div className="super-select-story__mt-8">
                        <AntdSuperSelect mode={mode} name="antdErrorCustomization" optionSource={errorSource} defaultValue="unknown-person">
                            <option value="robert-balboa">Robert Balboa</option>
                            <option value="adrian-pennino">Adrian Pennino</option>
                            <option value="apollo-creed">Apollo Creed</option>
                            <option value="james-lang">James Lang</option>
                            <option value="ivan-drago">Ivan Drago</option>
                        </AntdSuperSelect>
                    </div>
                </section>

                <section className="super-select-story__card">
                    <h3 className="super-select-story__card-title">Toolkit Modal + Modal Select</h3>
                    <div className="super-select-story__mt-8">
                        <Button onClick={() => setIsOuterModalOpen(true)}>Open Ant Design Modal</Button>
                        <Modal open={isOuterModalOpen} onCancel={() => setIsOuterModalOpen(false)} footer={null} title="Choose an option">
                            <AntdSuperSelect mode="modal" name="antdNestedModalSelect">
                                <option value="robert-balboa">Robert Balboa</option>
                                <option value="adrian-pennino">Adrian Pennino</option>
                                <option value="apollo-creed">Apollo Creed</option>
                                <option value="james-lang">James Lang</option>
                                <option value="ivan-drago">Ivan Drago</option>
                            </AntdSuperSelect>
                        </Modal>
                    </div>
                </section>
            </div>
        </ConfigProvider>
    );
}
