
import * as React from "react";
import * as GoldenLayout from "golden-layout";
import { Button, FocusStyleManager, Popover, PopoverPosition } from "@blueprintjs/core";
import { NavBar } from "./NavBar";

import "./common.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "./icomoon/style.css";

// TODO move this to async container
import "../public/goldenlayout-base.css";
import "../public/goldenlayout-dark-theme.css";
import { Config } from "./Config";
import { Hierarchy } from "./components/Hierarchy";
import { ModelsView } from "./components/ModelsView";
import { Canvas } from "./components/Canvas";
import { Controller } from "./Controller";
import { State } from "./State";
import { Commands, IPopoverConfig } from "./Commands";
import { Quaternion } from "../../spider-engine/src/math/Quaternion";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { Entity } from "../../spider-engine/src/core/Entity";
import { Events } from "./Events";
import { TexturesView } from "./components/TexturesView";
import { PaletteView } from "./components/palette/PaletteView";

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

interface IAppState {
    // Popover
    isPopoverOpen: boolean;
    popoverContent: JSX.Element;
    popoverLeft: number;
    popoverTop: number;
    popoverPlacement: PopoverPosition;
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

    private _mockState: IAppState = {
        // popover
        isPopoverOpen: false,
        popoverContent: <div />,
        popoverLeft: 0,
        popoverTop: 0,
        popoverPlacement: "auto"
    };

    private _root!: HTMLDivElement;
    private _layoutContainer!: HTMLDivElement;
    private _layoutManager!: GoldenLayout;
    private _navBar!: NavBar;
    private _hierarchy?: Hierarchy;
    private _models?: ModelsView;
    private _canvas?: Canvas;
    // tslint:disable-next-line
    private _layoutSaveTimer: any;
    // tslint:disable-next-line
    private _windowResizeTimer: any;
    private _saveLayoutImmediately = false;

    public componentDidMount() {

        Commands.showPopover.attach(info => this.showPopover(info));
        Commands.closePopover.attach(() => this.closePopover());

        FocusStyleManager.onlyShowFocusOnTabs();

        const views: { [type: string]: ILayout } = {
            Models: {
                config: {
                    type: "react-component",
                    component: "Models",
                    title: "Models",
                    navBarTitle: "Models",
                    id: "Models",
                    isVisible: false,
                    isClosable: false
                }
            },
            Textures: {
                config: {
                    type: "react-component",
                    component: "Textures",
                    title: "Textures",
                    navBarTitle: "Textures",
                    id: "Textures",
                    isVisible: false,
                    isClosable: false
                }
            },
            Palette: {
                config: {
                    type: "react-component",
                    component: "Palette",
                    title: "Palette",
                    navBarTitle: "Palette",
                    id: "Palette",
                    isVisible: false,
                    isClosable: false
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
                    }
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
                        {
                            type: "stack",
                            content: [
                                views.Models.config,
                                views.Scene.config,
                                views.Palette.config,
                                views.Textures.config
                            ],
                            width: 20
                        },
                        {
                            type: "stack",
                            content: [
                                views.Canvas.config
                            ],
                            width: 80
                        }
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
        layout.registerComponent("Textures", (container: any, state: any) => {
            const instance = new TexturesView({});
            views[container.glContainer._config.id].instance = instance;
            views[container.glContainer._config.id].container = container;
            return instance;
        });

        // tslint:disable-next-line
        layout.registerComponent("Palette", (container: any, state: any) => {
            const instance = new PaletteView({});
            views[container.glContainer._config.id].instance = instance;
            views[container.glContainer._config.id].container = container;
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
        layout.registerComponent("Models", (container: any, state: any) => {
            const instance = new ModelsView({});
            views[container.glContainer._config.id].instance = instance;
            views[container.glContainer._config.id].container = container;
            this._models = instance;
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
            this.onKeyDown = this.onKeyDown.bind(this);
            this.onKeyUp = this.onKeyUp.bind(this);
            window.addEventListener("resize", this.onWindowResized);
            window.addEventListener("keyup", this.onKeyUp);
            window.addEventListener("keydown", this.onKeyDown);

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

    public componentWillUnmount() {
        window.removeEventListener("resize", this.onWindowResized);
        window.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("keydown", this.onKeyDown);
    }

    public render() {

        const navbarWidth = "46px";
        return (
            <div
                ref={e => this._root = e as HTMLDivElement}
                className="fill-parent bp3-dark unselectable"
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
                <div
                    style={{
                        position: "absolute",
                        left: `${this._mockState.popoverLeft}px`,
                        top: `${this._mockState.popoverTop}px`
                    }}
                >
                    <Popover
                        isOpen={this._mockState.isPopoverOpen}
                        content={this._mockState.popoverContent}
                        onInteraction={open => {
                            const state = { isPopoverOpen: open };
                            if (!open) {
                                Object.assign(state, { popoverContent: <div /> });
                            }
                            this.updateState(state);
                        }}
                        position={this._mockState.popoverPlacement}
                    >
                        <span />
                    </Popover>
                </div>
            </div>
        );
    }

    private updateState(state: object) {
        Object.assign(this._mockState, state);
        this.forceUpdate();
    }

    private closePopover() {
        this.updateState({ isPopoverOpen: false });
    }

    private showPopover(info: IPopoverConfig) {
        let placement: PopoverPosition = "auto";
        let positionX = info.targetRect ? info.targetRect.left : info.clientX;
        let positionY = info.targetRect ? info.targetRect.top : info.clientY;
        const targetRect = info.targetRect;
        const nearBottom = positionY > this._root.clientHeight / 3.2;
        const placeTop = () => {
            placement = "top";
            if (targetRect) {
                positionY = targetRect.top;
                positionX = targetRect.left + targetRect.width / 2;
            }
        };
        const placeBottom = () => {
            placement = "bottom";
            if (targetRect) {
                positionY = targetRect.bottom;
                positionX = targetRect.left + targetRect.width / 2;
            }
        };
        const placeRight = () => {
            placement = "right";
            if (targetRect) {
                positionY = targetRect.top + targetRect.height / 2;
                positionX = targetRect.right;
            }
        };
        const placeLeft = () => {
            placement = "left";
            if (targetRect) {
                positionY = targetRect.top + targetRect.height / 2;
                positionX = targetRect.left;
            }
        };
        const autoPlace = () => {
            const nearLeft = positionX < this._root.clientWidth / 3.2;
            if (nearLeft) {
                if (nearBottom) {
                    placeTop();
                } else {
                    placeRight();
                }
            } else {
                if (nearBottom) {
                    placeTop();
                } else {
                    placeLeft();
                }
            }
        };
        if (info.placement) {
            if (info.placement === "bottom") {
                placeBottom();
            } else if (info.placement === "top") {
                placeTop();
            } else if (info.placement === "vertical") {
                if (nearBottom) {
                    placeTop();
                } else {
                    placeBottom();
                }
            } else {
                autoPlace();
            }
        } else {
            autoPlace();
        }
        this.updateState({
            isPopoverOpen: true,
            popoverContent: info.content,
            popoverLeft: positionX,
            popoverTop: positionY,
            popoverPlacement: placement
        });
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

    private onKeyDown(e: KeyboardEvent) {
        if (e.key === "Alt") {
            State.instance.altPressed = true;
        }
    }

    private onKeyUp(e: KeyboardEvent) {
        // tslint:disable-next-line
        console.log(e.key, e.keyCode);
        if (e.key === "Escape") {
            if (State.instance.selectedKit) {
                State.instance.selectedKit = null;
            } else {
                State.instance.clearSelection();
            }
        } else if (e.key === "Delete") {
            Controller.deleteSelection();
        } else if (e.key === "Alt") {
            State.instance.altPressed = false;
        } else if (e.key.toLowerCase() === "r") {

            const rotate = (entity: Entity, axis: Vector3) => {
                entity.transform.rotation.multiply(Quaternion.fromAxisAngle(axis, Math.PI / 2));
                entity.active = true;
                Events.transformChanged.post(entity);
            };

            const { selection, grid, selectedKit } = State.instance;
            const { selectedKitInstance } = Controller;
            if (selection.length > 0) {
                // TODO multi selection
                rotate(selection[0], [Vector3.right, Vector3.up, Vector3.forward][grid]);
                Commands.saveScene.post();
            } else {
                if (selectedKitInstance && selectedKit) {
                    const { transform } = selectedKitInstance;
                    rotate(selectedKitInstance, {
                        x: transform.worldRight,
                        y: transform.worldUp,
                        z: transform.worldForward
                    }[selectedKit.plane]);
                    State.instance.autoRotation = false;
                }
            }
        }
    }
}
