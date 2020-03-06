
import { Events } from "./Events";
import { Engine, EngineHandlersInternal } from "../../spider-engine/src/core/Engine";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { Quaternion } from "../../spider-engine/src/math/Quaternion";
import { Scenes } from "../../spider-engine/src/core/Scenes";
import { Entities } from "../../spider-engine/src/core/Entities";
import { Transform } from "../../spider-engine/src/core/Transform";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { Ray } from "../../spider-engine/src/math/Ray";
import { Matrix44 } from "../../spider-engine/src/math/Matrix44";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Plane, Assets, Vector2, MathEx, SerializableObject } from "../../spider-engine/src/spider-engine";
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
import { Manifest } from "./Manifest";
import { PaletteSlot } from "./palette/PaletteSlot";
import { ColorSlot } from "./palette/ColorSlot";
import { MaterialSlot } from "./palette/MaterialSlot";
import { Palette } from "./palette/Palette";
import { Textures } from "./Textures";
import { FileInterface } from "./FileInterface";
import { Models } from "./Models";
import { ModelMesh } from "../../spider-engine/src/assets/model/ModelMesh";

interface IEntityData {
    kit: IKitAsset;
}

namespace Private {
    
    export let sceneLoaded = false;
    export let selectedKitInstance: Entity | null = null;

    // Touch input
    export let touchPressed = false;
    export let touchLeftButton = false;
    export let touchStart = new Vector2();

    // Snapping
    export const xPlane = new Plane(new Vector3().copy(Vector3.right));
    export const yPlane = new Plane(new Vector3().copy(Vector3.up));
    export const zPlane = new Plane(new Vector3().copy(Vector3.forward));

    const entityData = new Map<Entity, IEntityData>();

    export function removeEntityData(entity: Entity) {
        entityData.delete(entity);
    }

    export function getEntityData(entity: Entity) {
        const data = entityData.get(entity) as IEntityData;
        // tslint:disable-next-line
        console.assert(Boolean(data));
        return data;
    }   

    function createKit(kit: IKitAsset, position?: Vector3, rotation?: Quaternion) {
        return Model.instantiate(kit.model)
            .then(instance => {
                if (position) {
                    instance.updateComponent(Transform, { position });
                }
                if (rotation) {
                    instance.updateComponent(Transform, { rotation });
                }
                entityData.set(instance, {
                    kit
                });
                return instance;
            });
    }    

    export let lastInstantiatedKit: Entity | null = null;
    export function instantiateKit(instance: Entity) {
        lastInstantiatedKit = instance;
        return Utils.saveCurrentScene()
            .then(() => createKit(
                State.instance.selectedKit as IKitAsset,
                instance.transform.position,
                instance.transform.rotation
            ))
            .then(newInstance => {
                Private.selectedKitInstance = newInstance;
                newInstance.active = false;
            });
    }

    export function determineKitPosition(instance: Entity, localX: number, localY: number): [
        Vector3,
        Quaternion | null,
        Entity | null
    ] | null {
        const { gridStep, selectedKit } = State.instance;
        const ray = EditorCamera.getWorldRay(localX, localY);
        const rayCast = (ray ? Private.tryPickEntity(ray, instance) : null);
        const intersect = ray?.castOnPlane([xPlane, yPlane, zPlane][State.instance.grid]);

        const snapped = (pos: Vector3) => {
            return Vector3.fromPool().set(
                Snapping.snap(pos.x, gridStep),
                Snapping.snap(pos.y, gridStep),
                Snapping.snap(pos.z, gridStep)
            );
        };

        if (rayCast) {
            switch (selectedKit?.type) {
                case "block": {

                    const localBBox = BoundingBoxes.getLocal(rayCast.closest);
                    const { transform } = rayCast.closest;

                    const verticalOffset = Vector3.fromPool().copy(transform.up)
                        .multiply(localBBox?.max.y as number)
                        .multiply(transform.scale.y);

                    return [
                        Vector3.fromPool().copy(verticalOffset)
                            .add(transform.position),
                        transform.rotation,
                        rayCast.closest
                    ];

                    /*const selectors: {
                        [key: string]: [(v?: Vector3) => number | undefined, Vector3]
                    } = {
                        x: [(v?: Vector3) => v?.x, Vector3.right],
                        y: [(v?: Vector3) => v?.y, Vector3.up],
                        z: [(v?: Vector3) => v?.z, Vector3.forward]
                    };
                    const [selector, direction] = selectors[selectedKit.plane];
                    const offset = selector(BoundingBoxes.get(rayCast.closest)?.max) ?? 0;
                    const { position } = rayCast.closest.transform;
                    // const pos = snapped(intersect?.intersection);
                    const pos = snapped( position);
                    return [
                        Vector3.fromPool().set(
                            pos.x * (1 - direction.x) + offset * direction.x,
                            pos.y * (1 - direction.y) + offset * direction.y,
                            pos.z * (1 - direction.z) + offset * direction.z,
                        ),
                        rayCast.closest.transform.rotation,
                        rayCast.closest
                    ];*/
                }

                case "prop": {
                    return [
                        rayCast.intersection,
                        // Vector3.fromPool().set(
                        //     Snapping.snap(rayCast.intersection.x, gridStep),
                        //     Snapping.snap(rayCast.intersection.y, gridStep),
                        //     Snapping.snap(rayCast.intersection.z, gridStep)
                        // ),
                        (() => {
                            const { normal } = rayCast;
                            const propAxis = {
                                x: instance.transform.worldRight,
                                y: instance.transform.worldUp,
                                z: instance.transform.worldForward
                            }[selectedKit.plane];
                            const angle = MathEx.toDegrees(Math.acos(normal.dot(propAxis)));
                            if (angle > .001) {
                                return instance.transform.rotation.multiply(
                                    Quaternion.fromPool().setFromUnitVectors(propAxis, normal)
                                );
                            } else {
                                return null;
                            }
                        })(),
                        rayCast.closest
                    ];
                }
                default:
                    // tslint:disable-next-line
                    console.assert(false, `Invalid kit type ${selectedKit?.type}`);
            }
        } else {            
            if (intersect && intersect.intersection) {
                return [snapped(intersect.intersection), null, null];
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

                Events.selectedItemChanged.attach(item => {
                    if (selectedKitInstance) {
                        selectedKitInstance.destroy();
                        Private.selectedKitInstance = null;
                        Private.lastInstantiatedKit = null;
                    }
                    if (item && Utils.isModel(item)) {
                        createKit(item as IKitAsset).then(instance => {
                            Private.selectedKitInstance = instance;
                            instance.active = false;
                        });
                    }
                });

                Events.selectKitMaterialChanged.attach(kit => {                    
                    if (!Private.selectedKitInstance) {
                        // tslint:disable-next-line
                        console.assert(false);
                        return;
                    }                    
                    kit.model.elements.data.forEach((r, i) => {
                        const instance = Private.selectedKitInstance as Entity;
                        const target = instance.children[i].getComponent(Visual) as Visual;
                        target.material = (r.instance as ModelMesh).material.asset as Material;
                    });
                });

                sceneLoaded = true;
            });
    }

    Events.canvasMounted.attach(canvas => {
        Promise.resolve()
            .then(() => {
                if (process.env.PLATFORM === "web") {
                    const dbName = `kitbasher-${process.env.CONFIG}`;
                    const dbVersion = 1;
                    return IndexedDb.initialize(dbName, dbVersion);
                }
            })
            .then(() => Engine.create({
                container: canvas,
                customTypes: [
                    [PaletteSlot, SerializableObject],
                    [ColorSlot, PaletteSlot],
                    [MaterialSlot, PaletteSlot]
                ],
                customFileIO: new FileInterface(),
                preRender: Renderer.preRender,
                postRender: Renderer.postRender
            }))
            .then(Renderer.load)
            .then(() => State.instance.load())
            .then(Manifest.load)
            .then(Textures.load)
            .then(Palette.load)
            .then(Models.load)
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

    public static get selectedKitInstance() { return Private.selectedKitInstance; }

    public static deleteSelection() {
        if (State.instance.selection.length < 1) {
            return;
        }
        State.instance.selection.forEach(entity => {
            entity.destroy();
            Private.removeEntityData(entity);
        });
        State.instance.clearSelection();
        Commands.saveScene.post();
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

        const { selectedKitInstance } = Private;
        if (!Private.touchPressed) {
            if (selectedKitInstance) {
                const potentialPos = Private.determineKitPosition(selectedKitInstance, localX, localY);
                if (potentialPos) {
                    const [position, rotation, pickedEntity] = potentialPos;
                    if (!Private.lastInstantiatedKit) {
                        selectedKitInstance.active = true;
                    } else {
                        const treshold = Vector3.distance(
                            Private.lastInstantiatedKit.transform.position, 
                            position
                        );
                        // TODO make this treshold dynamic / dependent on current kit bounds?
                        if (treshold >= 2 || pickedEntity !== Private.lastInstantiatedKit) {
                            selectedKitInstance.active = true;
                        }                        
                    }
                    if (selectedKitInstance.active) {
                        selectedKitInstance.transform.position = position;
                        if (rotation) {
                            selectedKitInstance.transform.rotation = rotation;
                        }
                    }
                }                
            } else {
                if (EntityController.visible) {
                    EntityController.onMouseMove(localX, localY, EditorCamera.camera, false, Vector2.zero);
                }
            }
            return;
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
        const { selectedKitInstance } = Private;
        if (selectedKitInstance) {
            if (selectedKitInstance.active) {
                Private.instantiateKit(selectedKitInstance)
                    .then(() => {
                        State.instance.selectedKit = null;
                        State.instance.setSelection(selectedKitInstance);
                    });
            }
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
