
import { Events } from "./Events";
import { Engine, EngineHandlersInternal } from "../../spider-engine/src/core/Engine";
import { Scenes } from "../../spider-engine/src/core/Scenes";
import { Assets } from "../../spider-engine/src/assets/Assets";
import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";
import { StaticMeshAsset } from "../../spider-engine/src/assets/StaticMeshAsset";
import { Entities } from "../../spider-engine/src/core/Entities";
import { Transform } from "../../spider-engine/src/core/Transform";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Color } from "../../spider-engine/src/graphics/Color";
import { StaticMesh, defaultAssets } from "../../spider-engine/src/spider-engine";
import { Renderer } from "./Renderer";
import { ObjectManagerInternal } from "../../spider-engine/src/core/ObjectManager";
import { EditorCamera } from "./EditorCamera";
import { Entity } from "../../spider-engine/src/core/Entity";
import { DOMUtils } from "../../spider-engine/src/common/DOMUtils";

interface IKit {
    thumbnail: Texture2D;
    mesh: StaticMeshAsset;
}

namespace Private {

    export let canvasHasFocus: () => boolean;
    function checkCanvasStatus() {
        if (!canvasHasFocus()) {
            requestAnimationFrame(checkCanvasStatus);
            return;
        }

        EngineHandlersInternal.onWindowResized();

        // For debugging
        Object.assign(window, { spiderObjectCache: () => ObjectManagerInternal.objectCache() });

        // This is done here because loadGraphicObjects() fails if canvas doesn't have the focus
        Scenes.load("Assets/Startup.Scene")
            .then(() => {
                EditorCamera.camera = Entities.find("Camera") as Entity;
            })
            // TODO load persistent scene            
            .then(() => {
                return Assets.load("Assets/Kits/cube.ObjectDefinition")
                    .then((_kit: unknown) => {
                        const kit = _kit as IKit;
                        Entities.create()
                            .setComponent(Transform)
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
                    });
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
            return;
        }
        EditorCamera.onMouseMove(localX, localY, Private.touchLeftButton);
    }

    public static onMouseUp(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        if (!Private.touchPressed) {
            return;
        }
        Private.touchPressed = false;
        EditorCamera.onMouseUp(localX, localY);
    }

    public static onMouseLeave(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        Controller.onMouseUp(e, localX, localY);
    }

    public static onMouseWheel(e: WheelEvent) {
        const delta = DOMUtils.getWheelDelta(e.deltaY, e.deltaMode);
        EditorCamera.onMouseWheel(delta);
    }
}
