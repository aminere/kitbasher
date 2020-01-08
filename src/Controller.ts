
import { Events } from "./Events";
import { Engine, EngineHandlersInternal } from "../../spider-engine/src/core/Engine";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { Scenes, ScenesInternal } from "../../spider-engine/src/core/Scenes";
import { Assets } from "../../spider-engine/src/assets/Assets";
import { Entities } from "../../spider-engine/src/core/Entities";
import { Transform } from "../../spider-engine/src/core/Transform";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Color } from "../../spider-engine/src/graphics/Color";
import { StaticMesh, defaultAssets, Plane } from "../../spider-engine/src/spider-engine";
import { Renderer } from "./Renderer";
import { ObjectManagerInternal } from "../../spider-engine/src/core/ObjectManager";
import { EditorCamera } from "./EditorCamera";
import { Entity } from "../../spider-engine/src/core/Entity";
import { DOMUtils } from "../../spider-engine/src/common/DOMUtils";
import { IKitAsset } from "./Types";
import { State } from "./State";
import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";
import { Debug } from "../../spider-engine/src/io/Debug";

namespace Private {

    const currentScenePath = "currentScene.Scene";

    export function saveCurrentScene() {
        const scene = ScenesInternal.list()[0];
        const data = JSON.stringify(scene.serialize(), null, 2);
        return IndexedDb.write("files", currentScenePath, data);            
    }

    export let canvasHasFocus: () => boolean;
    function checkCanvasStatus() {
        if (!canvasHasFocus()) {
            requestAnimationFrame(checkCanvasStatus);
            return;
        }

        EngineHandlersInternal.onWindowResized();

        // For debugging
        Object.assign(window, { spiderObjectCache: () => ObjectManagerInternal.objectCache() });

        Promise.resolve()
            .then(() => {
                return new Promise(resolve => {
                    IndexedDb.read("files", currentScenePath)
                        .then(data => {
                            ObjectManagerInternal.loadObjectFromData(currentScenePath, data)
                                .then(resolve)
                                .catch(e => {
                                    // tslint:disable-next-line
                                    Debug.logError(e);
                                });
                        })
                        .catch(() => {                            
                            Scenes.load("Assets/Startup.Scene")
                                .then(() => saveCurrentScene())
                                .then(resolve);
                        });
                });
            })
            .then(() => {
                EditorCamera.camera = Entities.find("Camera") as Entity;
            });
    }

    Events.canvasMounted.attach(canvas => {
        Engine.create({
            container: canvas,
            customTypes: [
            ],
            preRender: Renderer.preRender,
            postRender: Renderer.postRender
        })
            .then(() => Renderer.load())
            .then(() => {
                const dbName = `kitbasher-${process.env.CONFIG}`;
                const dbVersion = 1;
                return IndexedDb.initialize(dbName, dbVersion);
            })
            .then(() => {
                Events.engineReady.post();
                checkCanvasStatus();
            })
            .catch(error => {
                // tslint:disable-next-line
                console.error(error);
            });
    });

    // Touch input
    export let touchPressed = false;
    export let touchLeftButton = false;

    // Snapping
    export function createKit(kit: IKitAsset, position?: Vector3) {
        return Entities.create()
                .setComponent(Transform, position ? { position } : undefined)
                .setComponent(Visual, {
                    geometry: new StaticMesh({ mesh: kit.mesh }),
                    material: new Material({
                        shader: defaultAssets.shaders.phong,
                        shaderParams: {
                            diffuse: Color.white,
                            ambient: new Color(.1, .1, .2)
                        }
                    })
                });
    }

    export let potentialKit: Entity | null = null;
    State.selectedKitChanged.attach(kit => {
        if (potentialKit) {
            potentialKit.destroy();
            potentialKit = null;
        }
        if (kit) {
            potentialKit = createKit(kit);
            potentialKit.active = false;
        }
    });

    export let groundPlane = new Plane();
    export let gridSize = 1;
}

export class Controller {
    public static set canvasFocusGetter(hasFocus: () => boolean) {
        Private.canvasHasFocus = hasFocus;
    }

    public static onResize() {
        EngineHandlersInternal.onWindowResized();
    }

    public static onMouseDown(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        if (Private.touchPressed) {
            return;
        }
        Private.touchPressed = true;
        Private.touchLeftButton = e.button === 0;
        EditorCamera.onMouseDown(localX, localY);
    }

    public static onMouseMove(e: React.MouseEvent<HTMLElement>, localX: number, localY: number) {
        if (!Private.touchPressed) {
            const { potentialKit } = Private;
            if (potentialKit) {
                potentialKit.active = true;

                const ray = EditorCamera.getWorldRay(localX, localY);
                const intersect = ray?.castOnPlane(Private.groundPlane);
                if (intersect && intersect.intersection) {
                    const { gridSize } = Private;
                    const snap = (i: number) => {
                        const ratio = i / gridSize;
                        const ratioInt = Math.floor(ratio);
                        const ratioFract = ratio - ratioInt;
                        return gridSize * (ratioInt + Math.round(ratioFract));
                    };
                    potentialKit.transform.position.x = snap(intersect.intersection.x);
                    potentialKit.transform.position.z = snap(intersect.intersection.z);
                }
            }
            return;
        }

        if (EditorCamera.onMouseMove(localX, localY, Private.touchLeftButton)) {
            return;
        }
    }

    public static onMouseUp(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        if (!Private.touchPressed) {
            return;
        }

        Private.touchPressed = false;
        if (EditorCamera.onMouseUp(localX, localY)) {
            return;
        }

        if (Private.touchLeftButton) {
            // Click
            const { potentialKit } = Private;
            if (potentialKit) {
                potentialKit.destroy();
                Private.saveCurrentScene()
                    .then(() => {
                        Private.potentialKit = Private.createKit(
                            State.instance.selectedKit as IKitAsset,
                            potentialKit.transform.position
                        );
                    });
            }
        }
    }

    public static onMouseLeave(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        Controller.onMouseUp(e, localX, localY);
    }

    public static onMouseWheel(e: WheelEvent) {
        const delta = DOMUtils.getWheelDelta(e.deltaY, e.deltaMode);
        EditorCamera.onMouseWheel(delta);
    }
}
