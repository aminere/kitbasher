
import { Events } from "./Events";
import { Engine, EngineHandlersInternal } from "../../spider-engine/src/core/Engine";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { Scenes, ScenesInternal } from "../../spider-engine/src/core/Scenes";
import { Entities } from "../../spider-engine/src/core/Entities";
import { Transform } from "../../spider-engine/src/core/Transform";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { Camera } from "../../spider-engine/src/graphics/Camera";
import { Ray } from "../../spider-engine/src/math/Ray";
import { Matrix44 } from "../../spider-engine/src/math/Matrix44";
import { Material } from "../../spider-engine/src/graphics/Material";
import { StaticMesh, Plane, Assets, Vector2 } from "../../spider-engine/src/spider-engine";
import { Renderer } from "./Renderer";
import { ObjectManagerInternal } from "../../spider-engine/src/core/ObjectManager";
import { EditorCamera } from "./EditorCamera";
import { Entity } from "../../spider-engine/src/core/Entity";
import { DOMUtils } from "../../spider-engine/src/common/DOMUtils";
import { IKitAsset } from "./Types";
import { State } from "./State";
import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";
import { Debug } from "../../spider-engine/src/io/Debug";
import { Triangle } from "../../spider-engine/src/math/Triangle";
import { Components } from "../../spider-engine/src/core/Components";
import { CullModes } from "../../spider-engine/src/graphics/GraphicTypes";
import { EntityController } from "./EntityController";
import { Commands } from "./Commands";

namespace Private {

    const currentScenePath = "currentScene.Scene";
    let defaultMaterial: Material;

    export function saveCurrentScene() {
        const engineHud = Entities.find("EngineHud");
        if (engineHud) {
            engineHud.destroy();
        }
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
                            const scene = Scenes.create();
                            scene.deserialize(JSON.parse(data))
                                .then(resolve);
                        })
                        .catch(() => {
                            Scenes.load("Assets/Startup.Scene")
                                .then(() => saveCurrentScene())
                                .then(resolve);
                        });
                });
            })
            .then(() => {
                EditorCamera.cameraEntity = Entities.find("Camera") as Entity;
            });
    }

    // Touch input
    export let touchPressed = false;
    export let touchLeftButton = false;
    export let touchStart = new Vector2();

    // Snapping
    export function createKit(kit: IKitAsset, position?: Vector3) {
        return Entities.create()
            .setComponent(Transform, position ? { position } : undefined)
            .setComponent(Visual, {
                geometry: new StaticMesh({ mesh: kit.mesh }),
                material: defaultMaterial
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

    Events.canvasMounted.attach(canvas => {
        Engine.create({
            container: canvas,
            customTypes: [
            ],
            preRender: Renderer.preRender,
            postRender: Renderer.postRender
        })
            .then(() => Renderer.load())
            .then(() => new Promise(resolve => {
                Assets.load("Assets/Editor/Default.Material")
                    .then(asset => defaultMaterial = asset as Material)
                    .then(resolve);
            }))
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

    Commands.saveScene.attach(() => saveCurrentScene());
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
        Private.touchStart.set(localX, localY);
        EditorCamera.onMouseDown(localX, localY);
    }

    public static onMouseMove(e: React.MouseEvent<HTMLElement>, localX: number, localY: number) {

        const { 
            potentialKit,
            touchLeftButton,
            touchStart
        } = Private;

        if (!Private.touchPressed) {        
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
                return;
            }

            EntityController.onMouseMove(localX, localY, EditorCamera.camera, false, Vector2.zero);
            return;
        }

        if (EntityController.onMouseMove(localX, localY, EditorCamera.camera, touchLeftButton, touchStart)) {
            return;
        }

        if (EditorCamera.onMouseMove(localX, localY, touchLeftButton)) {
            return;
        }
    }

    public static onMouseUp(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        if (!Private.touchPressed) {
            return;
        }

        Private.touchPressed = false;

        if (EntityController.onMouseUp()) {
            Private.saveCurrentScene();
            return;
        }

        if (EditorCamera.onMouseUp(localX, localY)) {
            Private.saveCurrentScene();
            return;
        }

        if (!Private.touchLeftButton) {
            return;
        }

        // Click
        const { potentialKit } = Private;
        if (potentialKit) {
            // Insert kit
            Private.saveCurrentScene()
                .then(() => {
                    Private.potentialKit = Private.createKit(
                        State.instance.selectedKit as IKitAsset,
                        potentialKit.transform.position
                    );
                });
            return;
        }

        // Pick entity
        let closest: Entity | undefined;
        const localPickingRay = new Ray();
        const pickingRay = EditorCamera.getWorldRay(localX, localY);
        if (!pickingRay) {
            return;
        }
        const invWorld = Matrix44.fromPool();
        let distToClosest = Number.MAX_VALUE;
        const v1 = Vector3.fromPool();
        const v2 = Vector3.fromPool();
        const v3 = Vector3.fromPool();
        const plane = Plane.fromPool();
        const triangle = Triangle.fromPool();

        const visuals = Components.ofType(Visual);
        for (const v of visuals) {
            const vb = v.geometry ? v.geometry.getVertexBuffer() : undefined;
            const boundingBox = v.geometry ? v.geometry.getBoundingBox() : undefined;
            if (!vb || !boundingBox || !v.material) {
                continue;
            }

            if (vb.primitiveType === "TRIANGLES") {
                const useBackFaces = v.material.cullMode === CullModes.Front;
                const world = v.worldTransform;
                invWorld.getInverse(world);
                localPickingRay.copy(pickingRay).transform(invWorld);
                if (localPickingRay.castOnAABB(boundingBox)) {
                    const positions = vb.attributes.position as number[];
                    for (let i = 0; i < positions.length; i += 9) {
                        v1.set(positions[i], positions[i + 1], positions[i + 2]);
                        v2.set(positions[i + 3], positions[i + 4], positions[i + 5]);
                        v3.set(positions[i + 6], positions[i + 7], positions[i + 8]);
                        plane.setFromPoints(v1, v2, v3);
                        const result = localPickingRay.castOnPlane(plane);
                        if (result.intersection) {
                            const rayShootingIntoPlane = plane.normal.dot(localPickingRay.direction) < 0;
                            const useTriangle = useBackFaces ? !rayShootingIntoPlane : rayShootingIntoPlane;
                            if (useTriangle) {
                                triangle.set(v1, v2, v3);
                                if (triangle.contains(result.intersection)) {
                                    const distance = Vector3.distance(
                                        result.intersection.transform(world), 
                                        pickingRay.origin
                                    );
                                    if (distance < distToClosest) {
                                        distToClosest = distance;
                                        closest = v.entity;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (closest) {
            // TODO multi-selection
            State.instance.setSelection(closest);
        } else {
            State.instance.clearSelection();
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
