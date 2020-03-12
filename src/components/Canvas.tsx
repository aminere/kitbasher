
import * as React from "react";
import { Events } from "../Events";
import { Controller } from "../Controller";
import { Tooltip, Position, Button, Intent, Checkbox, Switch } from "@blueprintjs/core";
import { State } from "../State";
import { PropertyGrid } from "./propertygrid/PropertyGrid";
import { Entity } from "../../../spider-engine/src/core/Entity";
import { Transform } from "../../../spider-engine/src/core/Transform";
import { SerializerUtils, SerializerUtilsInternal } from "../../../spider-engine/src/serialization/SerializerUtils";
import { Commands } from "../Commands";
import { Panel } from "./Panel";
import { PlaneSelector } from "./PlaneSelector";
import { ControlMode, IKitAsset } from "../Types";
import { ModelMesh } from "../../../spider-engine/src/assets/model/ModelMesh";
import { MaterialEditor } from "./MaterialEditor";
import { Material } from "../../../spider-engine/src/graphics/Material";
import { Visual, Interfaces } from "../../../spider-engine/src/spider-engine";
import { Palette } from "../palette/Palette";

// tslint:disable:max-line-length

interface ICanvasState {
    enabled: boolean;
}

export class Canvas extends React.Component<{}, ICanvasState> {

    private _canvas!: HTMLCanvasElement;
    private _transform!: PropertyGrid;

    private _mockState = {
        selection: [] as Entity[]
    };

    constructor(props: {}) {
        super(props);
        this.state = {
            enabled: false
        };
    }

    public componentDidMount() {
        Events.canvasMounted.post(this._canvas);
        Events.assetBrowserReady.attach(() => {
            this.setState({ enabled: true });
        });

        Events.transformChanged.attach(() => {
            if (this._mockState.selection.length > 0) {
                this._transform.forceUpdate();
            }
        });

        Events.selectedItemChanged.attach(() => this.forceUpdate());
        Events.selectedEntityChanged.attach(selection => {
            Object.assign(this._mockState, { selection });
            this.forceUpdate();
        });

        this.handleMouseWheel = this.handleMouseWheel.bind(this);
        this._canvas.addEventListener("wheel", this.handleMouseWheel, { passive: false });
    }

    public componentWillUnmount() {
        this._canvas.removeEventListener("wheel", this.handleMouseWheel);
    }

    public render() {
        const { controlMode } = State.instance;
        const insertionMode = Boolean(State.instance.selectedKit);
        const hasSelection = this._mockState.selection.length > 0;
        // tslint:disable-next-line
        console.assert((insertionMode && hasSelection) === false);
        return (
            <div
                className="fill-parent"
                style={{
                    position: "relative",
                    backgroundColor: "rgb(30, 30, 30)"
                }}
            >
                <canvas
                    ref={e => this._canvas = e as HTMLCanvasElement}
                    className="fill-parent"
                    onMouseDown={e => {
                        Controller.onMouseDown(
                            e,
                            e.clientX - this._canvas.getBoundingClientRect().left,
                            e.clientY - this._canvas.getBoundingClientRect().top
                        );
                    }}
                    onMouseMove={e => {
                        Controller.onMouseMove(
                            e,
                            e.clientX - this._canvas.getBoundingClientRect().left,
                            e.clientY - this._canvas.getBoundingClientRect().top
                        );
                    }}
                    onMouseUp={e => {
                        Controller.onMouseUp(
                            e,
                            e.clientX - e.currentTarget.getBoundingClientRect().left,
                            e.clientY - e.currentTarget.getBoundingClientRect().top
                        );
                    }}
                    onMouseLeave={e => {
                        Controller.onMouseLeave(
                            e,
                            e.clientX - e.currentTarget.getBoundingClientRect().left,
                            e.clientY - e.currentTarget.getBoundingClientRect().top
                        );
                    }}
                    onContextMenu={e => e.preventDefault()}
                />
                {
                    this.state.enabled
                    &&
                    <div
                        style={{
                            position: "absolute",
                            padding: "4px",
                            right: "0px",
                            bottom: "0px"
                        }}
                    >
                        <div
                            style={{ width: "30px" }}
                        >
                            <Tooltip content="Select" position={Position.LEFT}>
                                <Button
                                    icon={(
                                        <span
                                            style={{
                                                fontFamily: "icomoon",
                                            }}
                                        >
                                            &#xe900;
                                        </span>
                                    )}
                                    onClick={() => State.instance.selectedKit = null}
                                    intent={!State.instance.selectedKit ? "primary" : "none"}
                                    active={!State.instance.selectedKit}
                                    onFocus={e => e.currentTarget.blur()}
                                />
                            </Tooltip>
                            <Tooltip content="Insert" position={Position.LEFT}>
                                <Button
                                    icon="plus"
                                    onClick={() => Events.insertClicked.post()}
                                    intent={State.instance.selectedKit ? "primary" : "none"}
                                    active={insertionMode}
                                    onFocus={e => e.currentTarget.blur()}
                                />
                            </Tooltip>
                        </div>
                    </div>
                }
                <div
                    style={{
                        position: "absolute",
                        right: "0",
                        top: "0",
                        width: "250px"
                    }}
                >
                    {
                        (() => {
                            const props: {
                                [name: string]: {
                                    // tslint:disable-next-line
                                    get: () => any,
                                    // tslint:disable-next-line
                                    set: (value: any) => void
                                }
                            } = {};

                            Object.assign(props, {
                                step: {
                                    get: () => State.instance.gridStep,
                                    set: (value: number) => State.instance.gridStep = value
                                }
                            });

                            if (hasSelection) {
                                if (State.instance.controlMode === ControlMode.Rotate) {
                                    Object.assign(props, {
                                        angle: {
                                            get: () => State.instance.angleStep,
                                            set: (value: number) => State.instance.angleStep = value
                                        }
                                    });
                                }
                            }

                            // Object.assign(props, {
                            //     grid: {
                            //         get: () => <PlaneSelector />
                            //     }
                            // });

                            return (
                                <Panel
                                    title="Snapping"
                                    content={(
                                        <PropertyGrid
                                            enabled={State.instance.snapping}
                                            target={{
                                                ...Object.entries(props).reduce((prev, cur) => {
                                                    return { ...prev, ...{ [cur[0]]: cur[1].get() } };
                                                }, {})
                                            }}
                                            metadata={{
                                                grid: { customEditor: true }
                                            }}
                                            onPropertyChanged={(name, value) => {
                                                Object.entries(props)
                                                    .filter(p => p[0] === name)
                                                    .forEach(p => p[1].set(value));
                                            }}
                                        />
                                    )}
                                    controls={(
                                        <div style={{ marginTop: "12px" }}>
                                            <Switch
                                                checked={State.instance.snapping}
                                                large={true}
                                                onChange={() => {
                                                    State.instance.snapping = !State.instance.snapping;
                                                    this.forceUpdate();
                                                }}
                                            />
                                        </div>
                                    )}
                                />
                            );
                        })()
                    }
                </div>
                <div
                    style={{
                        position: "absolute",
                        left: "0",
                        top: "0",
                        width: "250px"
                    }}
                >
                    {(() => {
                        if (hasSelection) {
                            return (
                                <div>
                                    <Panel
                                        title="Materials"
                                        content={(
                                            <MaterialEditor
                                                materials={this._mockState.selection[0].children.map(c => {
                                                    const v = c.getComponent(Visual) as Visual;
                                                    return v.material as Material;
                                                })}
                                                onChanged={(material, slot) => {
                                                    const target = this._mockState.selection[0].children[material];
                                                    const v = target.getComponent(Visual) as Visual;
                                                    v.material = Palette.materials[slot];
                                                    Commands.saveScene.post();
                                                }}
                                            />
                                        )}
                                    />
                                    <Panel
                                        title="Object"
                                        content={(
                                            <div>
                                                <PropertyGrid
                                                    ref={e => this._transform = e as PropertyGrid}
                                                    target={this._mockState.selection[0].getComponent(Transform) as Transform}
                                                    onPropertyChanged={(name, newValue) => {
                                                        SerializerUtilsInternal.tryUsePropertySetter = true;
                                                        const entity = this._mockState.selection[0];
                                                        SerializerUtils.setProperty(
                                                            entity.getComponent(Transform) as Transform,
                                                            name,
                                                            newValue
                                                        );                                                        
                                                        SerializerUtilsInternal.tryUsePropertySetter = false;
                                                        Commands.saveScene.post();
                                                    }}
                                                />                                                
                                            </div>
                                        )}
                                        controls={(
                                            <div style={{ padding: "4px" }}>
                                                <Tooltip content="Move / Scale" position={Position.BOTTOM}>
                                                    <span style={{ padding: "2px 4px" }}>
                                                        <Button
                                                            icon="move"
                                                            active={controlMode === ControlMode.Hybrid}
                                                            intent={controlMode === ControlMode.Hybrid ? Intent.PRIMARY : Intent.NONE}
                                                            onClick={(e: React.MouseEvent<HTMLElement>) => {
                                                                State.instance.controlMode = ControlMode.Hybrid;
                                                                e.stopPropagation();
                                                                this.forceUpdate();
                                                            }}
                                                            onFocus={e => e.currentTarget.blur()}
                                                        />
                                                    </span>
                                                </Tooltip>
                                                <Tooltip content="Rotate" position={Position.BOTTOM}>
                                                    <span style={{ padding: "2px" }}>
                                                        <Button
                                                            icon="refresh"
                                                            active={controlMode === ControlMode.Rotate}
                                                            intent={controlMode === ControlMode.Rotate ? Intent.PRIMARY : Intent.NONE}
                                                            onClick={(e: React.MouseEvent<HTMLElement>) => {
                                                                State.instance.controlMode = ControlMode.Rotate;
                                                                e.stopPropagation();
                                                                this.forceUpdate();
                                                            }}
                                                            onFocus={e => e.currentTarget.blur()}
                                                        />
                                                    </span>
                                                </Tooltip>
                                            </div>
                                        )}
                                    />
                                </div>
                            );
                        } else if (insertionMode) {
                            return (
                                <Panel
                                    title="Materials"
                                    content={(
                                        <MaterialEditor
                                            materials={(() => {
                                                const kit = State.instance.selectedKit as IKitAsset;
                                                return kit.model.elements.data.map(r => {
                                                    const e = r.instance as ModelMesh;
                                                    return e.material.asset as Material;
                                                });
                                            })()}
                                            onChanged={(material, slot) => {
                                                const kit = State.instance.selectedKit as IKitAsset;
                                                const target = kit.model.elements.data[material].instance as ModelMesh;
                                                target.material.asset = Palette.materials[slot];
                                                SerializerUtilsInternal.serializeIdsAsPaths = true;
                                                Interfaces.file.write(
                                                    kit.model.templatePath as string,
                                                    JSON.stringify(kit.model.serialize())
                                                );
                                                SerializerUtilsInternal.serializeIdsAsPaths = false;
                                                Events.selectKitMaterialChanged.post(kit);
                                            }}
                                        />
                                    )}
                                />
                            );
                        }
                    })()}
                </div>
            </div>
        );
    }

    private handleMouseWheel(e: WheelEvent) {
        Controller.onMouseWheel(e);
        e.stopPropagation();
    }
}
