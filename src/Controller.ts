
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
import { Plane, Assets, Vector2, MathEx } from "../../spider-engine/src/spider-engine";
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

    export function determinePotentialKitTransform(instance: Entity, localX: number, localY: number): [
        Vector3,
        Quaternion | null
    ] | null {
        const { gridStep, selectedKit } = State.instance;
        const ray = EditorCamera.getWorldRay(localX, localY);
        const rayCast = (ray ? Private.tryPickEntity(ray, instance) : null);
        if (rayCast) {
            switch (selectedKit?.type) {
                case "block": {
                    const selectors: {
                        [key: string]: [(v?: Vector3) => number | undefined, Vector3]
                    } = {
                        x: [(v?: Vector3) => v?.x, Vector3.right],
                        y: [(v?: Vector3) => v?.y, Vector3.up],
                        z: [(v?: Vector3) => v?.z, Vector3.forward]
                    };
                    const [selector, direction] = selectors[selectedKit.plane];
                    const offset = selector(BoundingBoxes.get(rayCast.closest)?.max) ?? 0;
                    const { position } = rayCast.closest.transform;
                    return [
                        Vector3.fromPool().set(
                            position.x * (1 - direction.x) + offset * direction.x,
                            position.y * (1 - direction.y) + offset * direction.y,
                            position.z * (1 - direction.z) + offset * direction.z,
                        ),
                        null
                    ];
                }

                case "prop": {
                    return [
                        Vector3.fromPool().set(
                            Snapping.snap(rayCast.intersection.x, gridStep),
                            Snapping.snap(rayCast.intersection.y, gridStep),
                            Snapping.snap(rayCast.intersection.z, gridStep)
                        ),
                        (() => {
                            const { normal } = rayCast;
                            const propAxis = {
                                x: instance.transform.worldRight,
                                y: instance.transform.worldUp,
                                z: instance.transform.worldForward
                            }[selectedKit.plane];
                            const angle = MathEx.toDegrees(Math.acos(normal.dot(propAxis)));
                            if (angle > .001) {
                                return Quaternion.fromPool().setFromUnitVectors(propAxis, normal);
                            } else {
                                return null;
                            }
                        })()
                    ];
                }
                default:
                    // tslint:disable-next-line
                    console.assert(false, `Invalid kit type ${selectedKit?.type}`);
            }
        } else {
            const intersect = ray?.castOnPlane([xPlane, yPlane, zPlane][State.instance.grid]);
            if (intersect && intersect.intersection) {
                return [
                    Vector3.fromPool().set(
                        Snapping.snap(intersect.intersection.x, gridStep),
                        Snapping.snap(intersect.intersection.y, gridStep),
                        Snapping.snap(intersect.intersection.z, gridStep)
                    ),
                    null
                ];
            }
        }
        return null;
    }

    // Picking
    const localPickingRay = new Ray();
    export function tryPickEntity(pickingRay: Ray, exclude?: Entity) {
        let closest: Entity | null = null;
        const normal = Vector3.fromPool();
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
                                        normal.copy(plane.normal).transformDirection(world);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (!closest) {
            return null;
        }

        return {
            closest: closest.parent as Entity,
            normal,
            intersection: new Vector3()
                .copy(pickingRay.direction)
                .multiply(distToClosest)
                .add(pickingRay.origin)
        };
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
                const potentialPos = Private.determinePotentialKitTransform(selectedKitInstance, localX, localY);
                if (potentialPos) {
                    const [position, rotation] = potentialPos;
                    if (!Private.lastInstantiatedKitPos) {
                        selectedKitInstance.active = true;
                    } else {
                        if (potentialPos) {
                            const treshold = Vector3.distance(Private.lastInstantiatedKitPos, position);
                            // TODO make this treshold dynamic / dependent on current kit bounds?
                            if (treshold >= 2) {
                                selectedKitInstance.active = true;
                            }
                        }
                    }
                    if (selectedKitInstance.active) {
                        selectedKitInstance.transform.position = position;
                        if (rotation) {
                            selectedKitInstance.transform.rotation.multiply(rotation);
                        }
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
                            if (touchLeftButton && !State.instance.altPressed) {
                                Private.paintBrushMode = true;
                                Private.instantiateKit(selectedKitInstance);
                                return;
                            }
                        }
                    }
                } else {
                    const potentialPos = Private.determinePotentialKitTransform(selectedKitInstance, localX, localY);
                    if (potentialPos) {
                        const [position, rotation] = potentialPos;
                        const treshold = Vector3.distance(Private.lastInstantiatedKitPos as Vector3, position);
                        // TODO make this treshold dynamic / dependent on current kit bounds?
                        if (treshold >= 2) {
                            selectedKitInstance.active = true;
                            selectedKitInstance.transform.position = position;
                            Private.instantiateKit(selectedKitInstance);
                        }
                    }
                    return;
                }
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
        const rayCast = ray ? Private.tryPickEntity(ray) : null;
        if (rayCast) {
            // TODO multi-selection
            State.instance.setSelection(rayCast.closest);
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
