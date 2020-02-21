
import { Events } from "./Events";
import { Engine, EngineHandlersInternal } from "../../spider-engine/src/core/Engine";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { Quaternion } from "../../spider-engine/src/math/Quaternion";
import { Scenes, ScenesInternal } from "../../spider-engine/src/core/Scenes";
import { Entities } from "../../spider-engine/src/core/Entities";
import { Transform } from "../../spider-engine/src/core/Transform";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { Ray } from "../../spider-engine/src/math/Ray";
import { Matrix44 } from "../../spider-engine/src/math/Matrix44";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Plane, Assets, Vector2 } from "../../spider-engine/src/spider-engine";
import { Renderer } from "./Renderer";
import { ObjectManagerInternal } from "../../spider-engine/src/core/ObjectManager";
import { EditorCamera } from "./EditorCamera";
import { Entity } from "../../spider-engine/src/core/Entity";
import { DOMUtils } from "../../spider-engine/src/common/DOMUtils";
import { IKitAsset, Grid } from "./Types";
import { State } from "./State";
import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";
import { Debug } from "../../spider-engine/src/io/Debug";
import { Triangle } from "../../spider-engine/src/math/Triangle";
import { Components } from "../../spider-engine/src/core/Components";
import { CullModes } from "../../spider-engine/src/graphics/GraphicTypes";
import { EntityController } from "./EntityController";
import { Commands } from "./Commands";
import { Snapping } from "./Snapping";
import { Settings } from "./Settings";
import { Model } from "./Model";
import { BoundingBoxes } from "./BoundingBoxes";
import { Config } from "./Config";
import { Utils } from "./Utils";

namespace Private {

    let defaultMaterial: Material;
    export let sceneLoaded = false;

    // Touch input
    export let touchPressed = false;
    export let touchLeftButton = false;
    export let touchStart = new Vector2();
    export let paintBrushMode = false;

    // Snapping
    export const xPlane = new Plane(new Vector3().copy(Vector3.right));
    export const yPlane = new Plane(new Vector3().copy(Vector3.up));
    export const zPlane = new Plane(new Vector3().copy(Vector3.forward));
    export function createKit(kit: IKitAsset, position?: Vector3, rotation?: Quaternion) {
        return Model.instantiate(kit.model)
            .then(instance => {
                if (position) {
                    instance.updateComponent(Transform, { position });
                }
                if (rotation) {
                    instance.updateComponent(Transform, { rotation });
                }
                return instance;
            });
    }    

    export let lastInstantiatedKitPos: Vector3 | null = null;
    export function instantiateKit(instance: Entity) {
        lastInstantiatedKitPos = new Vector3().copy(instance.transform.position);
        Utils.saveCurrentScene()
            .then(() => Private.createKit(
                State.instance.selectedKit as IKitAsset,
                instance.transform.position,
                instance.transform.rotation
            ))
            .then(newInstance => {
                State.instance.selectedKitInstance = newInstance;
                newInstance.active = false;
            });
    }

    export function determinePotentialKitPosition(instance: Entity, localX: number, localY: number) {
        const ray = EditorCamera.getWorldRay(localX, localY);
        const closest = (ray ? Private.tryPickEntity(ray, instance) : null)?.parent;        
        if (closest) {
            const yOffset = BoundingBoxes.get(closest)?.max.y ?? 0;
            return Vector3.fromPool().set(
                closest.transform.position.x,
                yOffset,
                closest.transform.position.z,                
            );
        } else {
            const intersect = ray?.castOnPlane([xPlane, yPlane, zPlane][State.instance.grid]);
            if (intersect && intersect.intersection) {
                const { gridStep } = State.instance;
                return Vector3.fromPool().set(
                    Snapping.snap(intersect.intersection.x, gridStep),
                    Snapping.snap(intersect.intersection.y, gridStep),
                    // intersect.intersection.y,
                    Snapping.snap(intersect.intersection.z, gridStep)
                );
            }
        }
        return null;
    }

    // Picking
    const localPickingRay = new Ray();
    export function tryPickEntity(pickingRay: Ray, exclude?: Entity) {
        let closest: Entity | null = null;
        const invWorld = Matrix44.fromPool();
        let distToClosest = Number.MAX_VALUE;
        const v1 = Vector3.fromPool();
        const v2 = Vector3.fromPool();
        const v3 = Vector3.fromPool();
        const plane = Plane.fromPool();
        const triangle = Triangle.fromPool();
        let visuals = Components.ofType(Visual); // TODO pass filter here?

        if (exclude) {
            visuals = visuals.filter(v => v.entity.parent !== exclude);
        }
            
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
        return closest;
    }

    // Initialization
    export let canvasHasFocus: () => boolean;
    function checkCanvasStatus() {
        if (!canvasHasFocus()) {
            requestAnimationFrame(checkCanvasStatus);
            return;
        }

        EngineHandlersInternal.onWindowResized();

        Promise.resolve()
            .then(() => {
                return new Promise(resolve => {
                    IndexedDb.read("files", Config.currentScenePath)
                        .then(data => {
                            const scene = Scenes.create();
                            scene.deserialize(JSON.parse(data))
                                .then(resolve);
                        })
                        .catch(() => {
                            Scenes.load("Assets/Startup.Scene")
                                .then(() => Utils.saveCurrentScene())
                                .then(resolve);
                        });
                });
            })
            .then(() => {
                EditorCamera.cameraEntity = Entities.find("Camera") as Entity;
                Commands.saveScene.attach(() => Utils.saveCurrentScene());

                Events.selectedKitChanged.attach(kit => {
                    const { selectedKitInstance } = State.instance;
                    if (selectedKitInstance) {
                        selectedKitInstance.destroy();
                        State.instance.selectedKitInstance = null;
                        Private.lastInstantiatedKitPos = null;
                    }
                    if (kit) {
                        createKit(kit).then(instance => {
                            State.instance.selectedKitInstance = instance;
                            instance.active = false;
                        });
                    }
                });

                sceneLoaded = true;
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
            .then(() => State.instance.load())
            .then(() => {
                // For debugging
                Object.assign(window, { spiderObjectCache: () => ObjectManagerInternal.objectCache() });
                Events.engineReady.post();
                checkCanvasStatus();
            })
            .catch(error => {
                // tslint:disable-next-line
                console.error(error);
            });
    });
}

export class Controller {
    public static set canvasFocusGetter(hasFocus: () => boolean) {
        Private.canvasHasFocus = hasFocus;
    }

    public static onResize() {
        EngineHandlersInternal.onWindowResized();
    }

    public static onMouseDown(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        if (!Private.sceneLoaded) {
            return;
        }
        if (Private.touchPressed) {
            return;
        }
        Private.touchPressed = true;
        Private.touchLeftButton = e.button === 0;
        Private.touchStart.set(localX, localY);
        EditorCamera.onMouseDown(localX, localY);
    }

    public static onMouseMove(e: React.MouseEvent<HTMLElement>, localX: number, localY: number) {
        if (!Private.sceneLoaded) {
            return;
        }
        const {
            touchLeftButton,
            touchStart
        } = Private;

        const { selectedKitInstance } = State.instance;
        if (!Private.touchPressed) {
            if (selectedKitInstance) {
                const potentialPos = Private.determinePotentialKitPosition(
                    selectedKitInstance,
                    localX,
                    localY
                );
                if (potentialPos) {
                    if (!Private.lastInstantiatedKitPos) {
                        selectedKitInstance.active = true;
                    } else {
                        if (potentialPos) {
                            const treshold = Vector3.distance(Private.lastInstantiatedKitPos, potentialPos);
                            // TODO make this treshold dynamic / dependent on current kit bounds?
                            if (treshold >= 2) {
                                selectedKitInstance.active = true;
                            }
                        }
                    }
                    if (selectedKitInstance.active) {
                        selectedKitInstance.transform.position = potentialPos;
                    }
                }                
            } else {
                if (EntityController.visible) {
                    EntityController.onMouseMove(localX, localY, EditorCamera.camera, false, Vector2.zero);
                }
            }
            return;
        } else {
            if (selectedKitInstance) {
                if (!Private.paintBrushMode) {
                    const treshold = Vector2.distance(Private.touchStart, Vector2.fromPool().set(localX, localY));
                    if (treshold > Config.paintBrushActivationPixelTreshold) {
                        if (selectedKitInstance.active) {
                            Private.paintBrushMode = true;
                            Private.instantiateKit(selectedKitInstance);
                        }
                    }
                } else {
                    const potentialPos = Private.determinePotentialKitPosition(
                        selectedKitInstance,
                        localX,
                        localY
                    );
                    if (potentialPos) {
                        const treshold = Vector3.distance(
                            Private.lastInstantiatedKitPos as Vector3,
                            potentialPos
                        );
                        // TODO make this treshold dynamic / dependent on current kit bounds?
                        if (treshold >= 2) {
                            selectedKitInstance.active = true;
                            selectedKitInstance.transform.position = potentialPos;
                            Private.instantiateKit(selectedKitInstance);
                        }
                    }
                }
                return;
            }
        }

        const doEntityControl = EntityController.transformStarted || !EditorCamera.transformStarted;
        if (doEntityControl) {
            if (EntityController.onMouseMove(localX, localY, EditorCamera.camera, touchLeftButton, touchStart)) {
                return;
            }
            if (EditorCamera.onMouseMove(localX, localY, touchLeftButton)) {
                return;
            }
        } else {
            if (EditorCamera.onMouseMove(localX, localY, touchLeftButton)) {
                return;
            }
            if (EntityController.onMouseMove(localX, localY, EditorCamera.camera, touchLeftButton, touchStart)) {
                return;
            }            
        }
    }

    public static onMouseUp(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        if (!Private.sceneLoaded) {
            return;
        }
        if (!Private.touchPressed) {
            return;
        }

        Private.touchPressed = false;

        if (EntityController.onMouseUp()) {
            Utils.saveCurrentScene();
            return;
        }

        if (EditorCamera.onMouseUp(localX, localY)) {
            Utils.saveCurrentScene();
            return;
        }

        if (!Private.touchLeftButton) {
            return;
        }

        Private.touchLeftButton = false;

        // Click
        if (!Private.paintBrushMode) {
            const { selectedKitInstance } = State.instance;
            if (selectedKitInstance) {
                if (selectedKitInstance.active) {
                    Private.instantiateKit(selectedKitInstance);
                }
                return;
            }
        } else {
            Private.paintBrushMode = false;
            return;
        }        

        // Pick entity
        const ray = EditorCamera.getWorldRay(localX, localY);
        const closest = ray ? Private.tryPickEntity(ray) : null;
        if (closest) {
            // TODO multi-selection
            State.instance.setSelection(closest.parent as Entity);
        } else {
            State.instance.clearSelection();
        }
    }

    public static onMouseLeave(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {
        if (!Private.sceneLoaded) {
            return;
        }
        Controller.onMouseUp(e, localX, localY);
    }

    public static onMouseWheel(e: WheelEvent) {
        if (!Private.sceneLoaded) {
            return;
        }
        const delta = DOMUtils.getWheelDelta(e.deltaY, e.deltaMode);
        EditorCamera.onMouseWheel(delta);
    }
}
