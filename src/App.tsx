
import * as React from "react";
import * as GoldenLayout from "golden-layout";
import { Button, FocusStyleManager } from "@blueprintjs/core";
import { NavBar } from "./NavBar";

import "./common.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";

// TODO move this to async container
import "../public/goldenlayout-base.css";
import "../public/goldenlayout-dark-theme.css";
import { Config } from "./Config";
import { Properties } from "./components/Properties";
import { Hierarchy } from "./components/Hierarchy";
import { Assets } from "./components/Assets";
import { Canvas } from "./components/Canvas";
import { Controller } from "./Controller";

interface ILayoutConfig {
    type: string;
    component: string;
    title: string;
    navBarTitle: string;
    id: string;
    isVisible: boolean;
    isClosable?: boolean;
    width?: number;
    props?: object;
}

interface ILayout {
    config: ILayoutConfig;
    instance?: React.Component;
    // tslint:disable-next-line
    container?: any;
}

namespace Private {
    // tslint:disable-next-line
    export function makeFocusGetter(id: string, container: any) {
        return () => {
            const parent = container.glContainer.parent.parent;
            if (parent && parent.isStack) {
                const activeItem = parent.getActiveContentItem();
                if (activeItem.config.id === id) {
                    return true;
                }
            }
            return false;
        };
    }
}

export class App extends React.Component {

    private _layoutContainer!: HTMLDivElement;
    private _layoutManager!: GoldenLayout;
    private _navBar!: NavBar;
    private _properties?: Properties;
    private _hierarchy?: Hierarchy;
    private _assets?: Assets;
    private _canvas?: Canvas;
    // tslint:disable-next-line
    private _layoutSaveTimer: any;
    // tslint:disable-next-line
    private _windowResizeTimer: any;
    private _saveLayoutImmediately = false;

    public componentDidMount() {
        FocusStyleManager.onlyShowFocusOnTabs();        
       
        const views: { [type: string]: ILayout } = {
            Assets: {
                config: {
                    type: "react-component",
                    component: "Assets",
                    title: "Assets",
                    navBarTitle: "Assets",
                    id: "Assets",
                    isVisible: false
                }
            },
            Properties: {
                config: {
                    type: "react-component",
                    component: "Properties",
                    title: "Properties",
                    navBarTitle: "Properties",
                    id: "Properties",
                    isVisible: false,
                    width: 20
                }
            },
            Scene: {
                config: {
                    type: "react-component",
                    component: "Scene",
                    title: "Scene",
                    navBarTitle: "Scene",
                    id: "Scene",
                    isVisible: false,
                    props: {
                        selectedNodes: []
                    },
                    width: 12
                }
            },
            Canvas: {
                config: {
                    type: "react-component",
                    component: "Canvas",
                    title: "Preview",
                    navBarTitle: "Preview",
                    id: "Canvas",
                    isVisible: false,
                    isClosable: false
                }
            }
        };

        const initialLayout = {
            settings: {
                showCloseIcon: false,
                showPopoutIcon: true
            },
            dimensions: {
                borderWidth: 2,
                minItemWidth: 200,
                minItemHeight: 300
            },
            content: [
                {
                    type: "row",
                    content: [
                        views.Scene.config,
                        {
                            type: "stack",
                            content: [
                                views.Canvas.config,
                                views.Assets.config
                            ]
                        },
                        views.Properties.config,
                    ]
                }
            ]
        };

        const layoutStateStr = localStorage.getItem("layout_state");
        let layoutState = layoutStateStr ? JSON.parse(layoutStateStr) : undefined;
        // // Upgrade from old layouts
        if (!layoutState || !layoutState.settings.showPopoutIcon) {
            layoutState = initialLayout;
            localStorage.removeItem("layout_state");
        }

        const layout = new GoldenLayout(layoutState || initialLayout, this._layoutContainer);

        // tslint:disable-next-line
        layout.on("itemDestroyed", (e: ILayout) => {
            const id = e?.config.id;
            if (id && (id in views)) {
                views[id].config.isVisible = false;
                this._navBar.forceUpdate();
            }
        });

        // tslint:disable-next-line
        layout.on("itemCreated", (e: ILayout) => {
            const id = e?.config.id;
            if (id && (id in views)) {
                views[id].config.isVisible = true;
                this._navBar.forceUpdate();
            }
        });

        // tslint:disable-next-line
        layout.on("stateChanged", (e: any) => {
            if (this._layoutSaveTimer) {
                clearTimeout(this._layoutSaveTimer);
            }
            if (this._saveLayoutImmediately) {
                this.saveLayout();
                this._saveLayoutImmediately = false;
            } else {
                this._layoutSaveTimer = setTimeout(() => this.saveLayout(), Config.layoutSaveDelay);
            }
        });

        // tslint:disable-next-line
        layout.on("stackCreated", (stack: any) => {
            const popoutButton = stack.header.controlsContainer.children("li.lm_popout");
            popoutButton.css("display", "none"); // hide popout button by default
            popoutButton.off("click");

            // Fix golden layout bug, layout global size often gets fucked after changing stack selection
            setTimeout(() => layout.updateSize(), 10);

            // tslint:disable-next-line
            stack.on("activeContentItemChanged", (newActiveItem: any) => {
                layout.updateSize();
            });
        });

        // BUILTIN VIEWS
        // tslint:disable-next-line
        layout.registerComponent("Properties", (container: any, state: any) => {
            const instance = new Properties({});
            views[container.glContainer._config.id].instance = instance;
            views[container.glContainer._config.id].container = container;
            this._properties = instance;
            // this.tryUpdateObjectEditorTitle(EditorState.getSelectedObjects());
            return instance;
        });

        // tslint:disable-next-line
        layout.registerComponent("Scene", (container: any, state: any) => {
            const instance = new Hierarchy({});
            views[container.glContainer._config.id].instance = instance;
            views[container.glContainer._config.id].container = container;
            this._hierarchy = instance;
            return instance;
        });

        // tslint:disable-next-line
        layout.registerComponent("Assets", (container: any, state: any) => {
            const instance = new Assets({});
            views[container.glContainer._config.id].instance = instance;
            views[container.glContainer._config.id].container = container;
            this._assets = instance;
            return instance;
        });

        // tslint:disable-next-line
        layout.registerComponent("Canvas", (container: any, state: any) => {
            const id = container.glContainer._config.id;
            const instance = new Canvas({});
            container.glContainer.on("resize", (e: UIEvent) => Controller.onResize());
            Controller.canvasFocusGetter = Private.makeFocusGetter(id, container);
            views[container.glContainer._config.id].instance = instance;
            views[container.glContainer._config.id].container = container;
            this._canvas = instance;
            return instance;
        });       

        this._layoutManager = layout;

        try {
            layout.init();

            this.onWindowResized = this.onWindowResized.bind(this);
            window.addEventListener("resize", this.onWindowResized);
        } catch (e) {
            // Failed initializing the layout.
            setTimeout(
                () => {
                    localStorage.removeItem("layout_state");
                    location.reload();
                },
                100
            );
        }
    }

    public render() {

        const navbarWidth = "46px";
        return (
            <div
                className="fill-parent bp3-dark"
                style={{
                    backgroundColor: "black"
                }}
            >
                <NavBar
                    ref={e => this._navBar = e as NavBar}
                    width={navbarWidth}
                />
                <div
                    ref={e => this._layoutContainer = e as HTMLDivElement}
                    style={{
                        width: `calc(100% - ${navbarWidth})`,
                        height: "100%",
                        float: "left",
                        zIndex: 0
                    }}
                />
            </div>
        );
    }

    private saveLayout() {
        if (!this._layoutManager || !this._layoutManager.isInitialised) {
            return;
        }
        const state = this._layoutManager.toConfig();
        const stateStr = JSON.stringify(state, null, 2);
        const previous = localStorage.getItem("layout_state");
        if (previous !== stateStr) {
            // tslint:disable-next-line
            console.log("Saving layout...");
            localStorage.setItem("layout_state", stateStr);
        }
        delete this._layoutSaveTimer;
    }

    private onWindowResized(e: UIEvent) {
        if (!this._layoutManager || !this._layoutManager.isInitialised) {
            return;
        }
        // weird golden-layout shenanigans, the width() function is not available at initialization.
        // Even through this callback is only registered after the component is mounted and the layout is created!
        // TODO investigate further.
        if (typeof (this._layoutManager.container.width) === "function") {
            if (this._windowResizeTimer) {
                clearTimeout(this._windowResizeTimer);
            }
            this._windowResizeTimer = setTimeout(() => {
                this._layoutManager.updateSize();
                // Golden Layout bug, this needs to be called twice otherwise size is sometimes wrong!!
                this._layoutManager.updateSize();
                delete this._windowResizeTimer;
            }, 60);

        }
    }
}
