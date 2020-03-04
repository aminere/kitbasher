import { Ray } from "../../spider-engine/src/math/Ray";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { Plane, PlaneClassification } from "../../spider-engine/src/math/Plane";
import { AABB } from "../../spider-engine/src/math/AABB";
import { Color } from "../../spider-engine/src/graphics/Color";
import { Quaternion } from "../../spider-engine/src/math/Quaternion";
import { Camera } from "../../spider-engine/src/graphics/Camera";
import { Vector2 } from "../../spider-engine/src/math/Vector2";
import { State } from "./State";
import { Axis, ControlMode } from "./Types";
import { Events } from "./Events";
import { Matrix44 } from "../../spider-engine/src/math/Matrix44";
import { Transform } from "../../spider-engine/src/core/Transform";
import { WebGL } from "../../spider-engine/src/graphics/WebGL";
import { GeometryRenderer } from "../../spider-engine/src/graphics/geometry/GeometryRenderer";
import { Snapping } from "./Snapping";
import { Settings } from "./Settings";
import { Entity } from "../../spider-engine/src/core/Entity";
import { BoundingBoxes } from "./BoundingBoxes";
import { MathEx } from "../../spider-engine/src/math/MathEx";

namespace Private {
    export let visible = false;
    export const axisThickness = .2;
    export const axisLengthFactor = .16;
    export const axisThicknessFactor = .1;
    export const coneRadiusFactor = .01;
    export const coneLengthFactor = .02;
    export const xyzLengthFactor = .32;
    export const xyzBoxThickness = .09;
    export const rotationCollisionRadius = .7;

    // This parameter is used to determine the right control planes to use
    // It represents how much inclination with respect to the camera is tolerated
    export const axisInclinationFactor = .4;

    export let transformStarted = false;
    export let axisLength = 0;
    export let boxExtentFactor = 0;

    export const localPickingRay = new Ray();
    export const initialIntersection = new Vector3();
    export const currentIntersection = new Vector3();
    export const translation = new Vector3();
    export const translation2 = new Vector3();
    export const controlPlane = new Plane();

    // translation
    export const xPosAxisAABB = new AABB();
    export const xNegAxisAABB = new AABB();
    export const yPosAxisAABB = new AABB();
    export const yNegAxisAABB = new AABB();
    export const zPosAxisAABB = new AABB();
    export const zNegAxisAABB = new AABB();
    export const xyAABB = new AABB();
    export const xzAABB = new AABB();
    export const zyAABB = new AABB();
    export const xyControllerColor = new Color().copy(Color.red).add(Color.green).setAlpha(0.6);
    export const xzControllerColor = new Color().copy(Color.red).add(Color.blue).setAlpha(0.6);
    export const zyControllerColor = new Color().copy(Color.blue).add(Color.green).setAlpha(0.6);
    export const xyzPoint1 = new Vector3();
    export const xyzPoint2 = new Vector3();
    export const xyzPoint3 = new Vector3();
    export const xyzPoint4 = new Vector3();
    export const initialPosition = new Vector3();

    // rotation
    export const xRotationAABB = new AABB();
    export const yRotationAABB = new AABB();
    export const zRotationAABB = new AABB();
    export const initialRotation = new Quaternion();
    export const localRight = new Vector3();
    export const localUp = new Vector3();
    export const localForward = new Vector3();
    export const ringColor = new Color(.5, .5, .5, 1);
    export const _intersection = new Vector3();

    // Scale
    export const initialScale = new Vector3();
    export let xPlaneDir = 1;
    export let yPlaneDir = 1;
    export let zPlaneDir = 1;

    export let selectedAxis = Axis.None;

    export function makeCenteredPos(entity: Entity, position: Vector3) {
        const bbox = BoundingBoxes.get(entity);
        if (bbox) {            
            position.x = (bbox.min.x + bbox.max.x) / 2;
            position.y = (bbox.min.y + bbox.max.y) / 2;
            position.z = (bbox.min.z + bbox.max.z) / 2;
        }
    }
}

export class EntityController {

    public static get visible() { return Private.visible; }
    public static get gizmoHighlighted() { return Private.selectedAxis !== Axis.None; }
    public static get transformStarted() { return Private.transformStarted; }

    public static onMouseMove(
        localX: number,
        localY: number,
        camera: Camera,
        mouseLeftPressed: boolean,
        clickStart: Vector2
    ) {
        const selectedEntities = State.instance.selection;
        // TODO handle multi selection
        const selectedEntity = selectedEntities.length > 0 ? selectedEntities[0] : null;
        if (!selectedEntity) {
            return false;
        }

        const {
            selectedAxis,
            controlPlane,
            initialIntersection,
            initialPosition,
            initialRotation,
            initialScale,
            localRight,
            localUp,
            localForward,
            currentIntersection,
            translation,
            translation2,
            localPickingRay,
            _intersection,
            axisLength,
            axisInclinationFactor
        } = Private;

        const { controlMode } = State.instance;
        if (mouseLeftPressed) {
            const newTransformStarted = EntityController.gizmoHighlighted;
            if (!Private.transformStarted && newTransformStarted) {
                const transform = selectedEntity.transform;
                if (transform) {
                    const toCamera = Vector3.fromPool().copy(camera.entity.transform.worldPosition)
                        .substract(transform.worldPosition).normalize();
                    const toObject = Vector3.fromPool().copy(toCamera).flip();
                    if (controlMode === ControlMode.Hybrid) {                        
                        if (selectedAxis === Axis.XY) {
                            controlPlane.setFromPoint(transform.worldForward, transform.worldPosition);
                        } else if (selectedAxis === Axis.XZ) {
                            controlPlane.setFromPoint(transform.worldUp, transform.worldPosition);
                        } else if (selectedAxis === Axis.ZY) {
                            controlPlane.setFromPoint(transform.worldRight, transform.worldPosition);
                        } else if (selectedAxis === Axis.XPos || selectedAxis === Axis.XNeg) {
                            const dotZ = Math.abs(toObject.dot(transform.worldForward));
                            const dotY = Math.abs(toObject.dot(transform.worldUp));
                            if (dotZ > dotY) {
                                controlPlane.setFromPoint(transform.worldForward, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(transform.worldUp, transform.worldPosition);
                            }

                        } else if (selectedAxis === Axis.YPos || selectedAxis === Axis.YNeg) {
                            const dotX = Math.abs(toObject.dot(transform.worldRight));
                            const dotZ = Math.abs(toObject.dot(transform.worldForward));
                            if (dotX > dotZ) {
                                controlPlane.setFromPoint(transform.worldRight, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(transform.worldForward, transform.worldPosition);
                            }
                        } else if (selectedAxis === Axis.ZPos || selectedAxis === Axis.ZNeg) {
                            const dotX = Math.abs(toObject.dot(transform.worldRight));
                            const dotY = Math.abs(toObject.dot(transform.worldUp));
                            if (dotX > dotY) {
                                controlPlane.setFromPoint(transform.worldRight, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(transform.worldUp, transform.worldPosition);
                            }
                        }

                        const pickingRay = camera.getWorldRay(clickStart.x, clickStart.y);
                        if (pickingRay) {
                            initialIntersection.copy(pickingRay.castOnPlane(controlPlane).intersection as Vector3);
                            initialPosition.copy(transform.position);
                            initialScale.copy(transform.scale);
                        } else {
                            return false;
                        }
                    } else if (controlMode === ControlMode.Rotate) {
                        const planeOffset = Vector3.fromPool()
                            .copy(toCamera)
                            .multiply(Private.axisLength)
                            .add(transform.worldPosition);
                        if (selectedAxis === Axis.X) {
                            const dotX = Math.abs(toObject.dot(transform.worldRight));
                            if (dotX > axisInclinationFactor) {
                                controlPlane.setFromPoint(transform.worldRight, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(toCamera, planeOffset);
                            }
                        } else if (selectedAxis === Axis.Y) {
                            const dotY = Math.abs(toObject.dot(transform.worldUp));
                            if (dotY > axisInclinationFactor) {
                                controlPlane.setFromPoint(transform.worldUp, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(toCamera, planeOffset);
                            }
                        } else if (selectedAxis === Axis.Z) {
                            const dotZ = Math.abs(toObject.dot(transform.worldForward));
                            if (dotZ > axisInclinationFactor) {
                                controlPlane.setFromPoint(transform.worldForward, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(toCamera, planeOffset);
                            }
                        }
                        const pickingRay = camera.getWorldRay(clickStart.x, clickStart.y);
                        if (pickingRay) {
                            initialIntersection.copy(pickingRay.castOnPlane(controlPlane).intersection as Vector3);
                            initialIntersection.substract(transform.worldPosition).normalize();
                            initialRotation.copy(transform.rotation);
                            localRight.copy(transform.right);
                            localUp.copy(transform.up);
                            localForward.copy(transform.forward);
                        } else {
                            return false;
                        }
                    }
                }
                Private.transformStarted = true;
            }
        }

        if (Private.transformStarted) {
            const transform = selectedEntity.transform;
            if (transform) {
                const pickingRay = camera.getWorldRay(localX, localY);
                if (pickingRay) {
                    currentIntersection.copy(pickingRay.castOnPlane(controlPlane).intersection as Vector3);
                } else {
                    return false;
                }
                // Translation
                if (controlMode === ControlMode.Hybrid) {
                    translation.substractVectors(currentIntersection, initialIntersection);
                    const parentScale = (transform.parent && transform.parent.transform)
                        ? transform.parent.transform.worldScale
                        : Vector3.one;                    

                    const step = State.instance.gridStep;

                    const snap = (a: Vector3, b: Vector3) => {
                        transform.position.x = a.x + Snapping.snap(b.x, step);
                        transform.position.y = a.y + Snapping.snap(b.y, step);
                        transform.position.z = a.z + Snapping.snap(b.z, step);
                    };

                    const scaleSnap = (prop: "x" | "y" | "z", offset: Vector3, axis: Vector3) => {
                        const dir = Math.sign(offset.dot(axis));
                        const amount = Snapping.snap(offset.length * dir, step) * .5;
                        transform.scale[prop] = initialScale[prop] + amount;
                        return amount;
                    };

                    if (selectedAxis === Axis.XPos) {
                        // console.log(BoundingBoxes.get(transform.entity));

                        translation.projectOnVector(transform.worldRight).multiply(1 / parentScale.x);
                        const { length } = translation;
                        const dir = Math.sign(translation.dot(transform.worldRight));
                        translation.copy(transform.right).multiply(length * dir);                        
                        const amount = scaleSnap("x", translation, transform.worldRight);
                        transform.position.copy(transform.right).multiply(amount).add(initialPosition);

                    } else if (selectedAxis === Axis.XNeg) {
                        translation.projectOnVector(transform.worldRight).multiply(1 / parentScale.x);
                        const { length } = translation;
                        const dir = Math.sign(translation.dot(transform.worldRight));
                        translation.copy(transform.right).multiply(length * dir);
                        const amount = scaleSnap("x", translation.flip(), transform.worldRight);
                        transform.position.copy(transform.right).multiply(-amount).add(initialPosition);

                    } else if (selectedAxis === Axis.YPos) {
                        translation.projectOnVector(transform.worldUp).multiply(1 / parentScale.y);
                        const { length } = translation;
                        const dir = Math.sign(translation.dot(transform.worldUp));
                        translation.copy(transform.up).multiply(length * dir);
                        const amount = scaleSnap("y", translation, transform.worldUp);
                        transform.position.copy(transform.up).multiply(amount).add(initialPosition);

                    } else if (selectedAxis === Axis.YNeg) {
                        translation.projectOnVector(transform.worldUp).multiply(1 / parentScale.y);
                        const length = translation.length;
                        const dir = Math.sign(translation.dot(transform.worldUp));
                        translation.copy(transform.up).multiply(length * dir);
                        const amount = scaleSnap("y", translation.flip(), transform.worldUp);
                        transform.position.copy(transform.up).multiply(-amount).add(initialPosition);

                    } else if (selectedAxis === Axis.ZPos) {
                        translation.projectOnVector(transform.worldForward).multiply(1 / parentScale.z);
                        const length = translation.length;
                        const dir = Math.sign(translation.dot(transform.worldForward));
                        translation.copy(transform.forward).multiply(length * dir);
                        const amount = scaleSnap("z", translation, transform.worldForward);
                        transform.position.copy(transform.forward).multiply(amount).add(initialPosition);

                    } else if (selectedAxis === Axis.ZNeg) {
                        translation.projectOnVector(transform.worldForward).multiply(1 / parentScale.z);
                        const length = translation.length;
                        const dir = Math.sign(translation.dot(transform.worldForward));
                        translation.copy(transform.forward).multiply(length * dir);
                        const amount = scaleSnap("z", translation.flip(), transform.worldForward);
                        transform.position.copy(transform.forward).multiply(-amount).add(initialPosition);

                    } else if (selectedAxis === Axis.XY) {

                        translation2.copy(translation);
                        translation.projectOnVector(transform.worldRight).multiply(1 / parentScale.x);
                        const length = translation.length;
                        let dir = Math.sign(translation.dot(transform.worldRight));

                        translation.copy(transform.right).multiply(length * dir);
                        snap(initialPosition, translation);

                        translation2.projectOnVector(transform.worldUp).multiply(1 / parentScale.y);
                        const length2 = translation2.length;
                        dir = Math.sign(translation2.dot(transform.worldUp));

                        translation2.copy(transform.up).multiply(length2 * dir);
                        snap(transform.position, translation2);

                    } else if (selectedAxis === Axis.XZ) {

                        translation2.copy(translation);
                        translation.projectOnVector(transform.worldRight).multiply(1 / parentScale.x);
                        const length = translation.length;
                        let dir = Math.sign(translation.dot(transform.worldRight));
                        translation.copy(transform.right).multiply(length * dir);
                        snap(initialPosition, translation);

                        translation2.projectOnVector(transform.worldForward).multiply(1 / parentScale.z);
                        const length2 = translation2.length;
                        dir = Math.sign(translation2.dot(transform.worldForward));
                        translation2.copy(transform.forward).multiply(length2 * dir);
                        snap(transform.position, translation2);

                    } else if (selectedAxis === Axis.ZY) {

                        translation2.copy(translation);
                        translation.projectOnVector(transform.worldForward).multiply(1 / parentScale.z);
                        const length = translation.length;
                        let dir = Math.sign(translation.dot(transform.worldForward));
                        translation.copy(transform.forward).multiply(length * dir);
                        snap(initialPosition, translation);

                        translation2.projectOnVector(transform.worldUp).multiply(1 / parentScale.y);
                        const length2 = translation2.length;
                        dir = Math.sign(translation2.dot(transform.worldUp));
                        translation2.copy(transform.up).multiply(length2 * dir);
                        snap(transform.position, translation2);
                    }

                    // Rotation
                } else if (controlMode === ControlMode.Rotate) {

                    currentIntersection.substract(transform.worldPosition).normalize();
                    const angle = Math.acos(initialIntersection.dot(currentIntersection));
                    if (Math.abs(angle) > 0.001) {
                        const snapped = Snapping.snap(angle, State.instance.angleStep * MathEx.degreesToRadians);
                        const rotation = Quaternion.fromPool();
                        const cross = Vector3.fromPool().crossVectors(initialIntersection, currentIntersection);
                        if (selectedAxis === Axis.X) {
                            const dir = Math.sign(localRight.dot(cross));
                            rotation.setFromAxisAngle(localRight, snapped * dir);
                        } else if (selectedAxis === Axis.Y) {
                            const dir = Math.sign(localUp.dot(cross));
                            rotation.setFromAxisAngle(localUp, snapped * dir);
                        } else if (selectedAxis === Axis.Z) {
                            const dir = Math.sign(localForward.dot(cross));
                            rotation.setFromAxisAngle(localForward, snapped * dir);
                        }
                        transform.rotation.multiplyQuaternions(initialRotation, rotation);
                    } else {
                        // skip entityTransformChanged event
                        return true;
                    }
                }                

                Events.transformChanged.post(selectedEntity);
                return true;
            }
        } else {
            const { transform } = selectedEntity;
            if (!transform) {
                return false;
            }

            const pickingRay = camera.getWorldRay(localX, localY);
            if (!pickingRay) {
                return false;
            }

            // Take world transform into account, but ignore scale because axis size is independent of scale
            const worldNoScale = Matrix44.fromPool();
            const invWorldNoScale = Matrix44.fromPool();
            const position = Vector3.fromPool();
            const rotation = Quaternion.fromPool();
            const scale = Vector3.fromPool();
            transform.worldMatrix.decompose(position, rotation, scale);
            Private.makeCenteredPos(selectedEntity, position);
            worldNoScale.compose(position, rotation, Vector3.one);
            invWorldNoScale.getInverse(worldNoScale);
            localPickingRay.copy(pickingRay).transform(invWorldNoScale);

            if (controlMode === ControlMode.Hybrid) {
                // update the axis bounding boxes                
                let t = Private.boxExtentFactor;                
                Private.xPosAxisAABB.min.set(Private.axisLength - t, -t, -t);
                Private.xPosAxisAABB.max.set(Private.axisLength + t, t, t);
                Private.xNegAxisAABB.min.set(-Private.axisLength - t, -t, -t);
                Private.xNegAxisAABB.max.set(-Private.axisLength + t, t, t);

                Private.yPosAxisAABB.min.set(-t, Private.axisLength - t, -t);
                Private.yPosAxisAABB.max.set(t, Private.axisLength + t, t);
                Private.yNegAxisAABB.min.set(-t, -Private.axisLength - t, -t);
                Private.yNegAxisAABB.max.set(t, -Private.axisLength + t, t);

                Private.zPosAxisAABB.min.set(-t, -t, Private.axisLength - t);
                Private.zPosAxisAABB.max.set(t, t, Private.axisLength + t);                
                Private.zNegAxisAABB.min.set(-t, -t, -Private.axisLength - t);
                Private.zNegAxisAABB.max.set(t, t, -Private.axisLength + t);                
                t = axisLength * Private.xyzLengthFactor;
                const localCameraPos = transform.worldToLocal(
                    camera.entity.transform.worldPosition,
                    Vector3.fromPool()
                );
                const dirX = Math.sign(localCameraPos.x) || 1;
                const dirY = Math.sign(localCameraPos.y) || 1;
                const dirZ = Math.sign(localCameraPos.z) || 1;
                // convert from [-1, 1] to [[-t, 0], [0, t]]
                const minX = t * (((dirX + 1) / 2) - 1);
                const maxX = t * (dirX + 1) / 2;
                const minY = t * (((dirY + 1) / 2) - 1);
                const maxY = t * (dirY + 1) / 2;
                const minZ = t * (((dirZ + 1) / 2) - 1);
                const maxZ = t * (dirZ + 1) / 2;
                Private.xyAABB.min.set(minX, minY, 0);
                Private.xyAABB.max.set(maxX, maxY, 0);
                Private.xzAABB.min.set(minX, 0, minZ);
                Private.xzAABB.max.set(maxX, 0, maxZ);
                Private.zyAABB.min.set(0, minY, minZ);
                Private.zyAABB.max.set(0, maxY, maxZ);

                if (localPickingRay.castOnAABB(Private.xyAABB)) {
                    Private.selectedAxis = Axis.XY;
                } else if (localPickingRay.castOnAABB(Private.xzAABB)) {
                    Private.selectedAxis = Axis.XZ;
                } else if (localPickingRay.castOnAABB(Private.zyAABB)) {
                    Private.selectedAxis = Axis.ZY;
                } else if (localPickingRay.castOnAABB(Private.xPosAxisAABB)) {
                    Private.selectedAxis = Axis.XPos;                    
                } else if (localPickingRay.castOnAABB(Private.yPosAxisAABB)) {
                    Private.selectedAxis = Axis.YPos;
                } else if (localPickingRay.castOnAABB(Private.zPosAxisAABB)) {
                    Private.selectedAxis = Axis.ZPos;
                } else if (localPickingRay.castOnAABB(Private.xNegAxisAABB)) {
                    Private.selectedAxis = Axis.XNeg;                    
                } else if (localPickingRay.castOnAABB(Private.yNegAxisAABB)) {
                    Private.selectedAxis = Axis.YNeg;
                } else if (localPickingRay.castOnAABB(Private.zNegAxisAABB)) {
                    Private.selectedAxis = Axis.ZNeg;
                } else {
                    Private.selectedAxis = Axis.None;
                }
            } else if (controlMode === ControlMode.Rotate) {
                const t = axisLength * Private.xyzBoxThickness;
                Private.xRotationAABB.min.set(-t, -axisLength, -axisLength);
                Private.xRotationAABB.max.set(t, axisLength, axisLength);
                Private.yRotationAABB.min.set(-axisLength, -t, -axisLength);
                Private.yRotationAABB.max.set(axisLength, t, axisLength);
                Private.zRotationAABB.min.set(-axisLength, -axisLength, -t);
                Private.zRotationAABB.max.set(axisLength, axisLength, t);
                Private.selectedAxis = Axis.None;
                let minDist = Number.MAX_VALUE;
                const toCamera = Vector3.fromPool().copy(camera.entity.transform.worldPosition)
                    .substract(transform.worldPosition).normalize();
                const midPlane = Plane.fromPool().setFromPoint(toCamera, transform.worldPosition);
                const toObject = Vector3.fromPool().copy(toCamera).normalize();
                let collision = localPickingRay.castOnAABB(Private.xRotationAABB);
                if (collision) {
                    const dotX = Math.abs(toObject.dot(transform.worldRight));
                    if (dotX < axisInclinationFactor
                        || collision.intersection1.length > axisLength * Private.rotationCollisionRadius) {
                        collision.intersection1.transform(worldNoScale);
                        const result = midPlane.classifyPoint(collision.intersection1);
                        if (result === PlaneClassification.Front) {
                            Private.selectedAxis = Axis.X;
                            _intersection.copy(collision.intersection1);
                            minDist = Vector3.distanceSq(
                                camera.entity.transform.worldPosition,
                                _intersection
                            );
                        }
                    }
                }

                collision = localPickingRay.castOnAABB(Private.yRotationAABB);
                if (collision) {
                    const dotY = Math.abs(toObject.dot(transform.worldUp));
                    if (dotY < axisInclinationFactor
                        || collision.intersection1.length > axisLength * Private.rotationCollisionRadius) {
                        collision.intersection1.transform(worldNoScale);
                        const result = midPlane.classifyPoint(collision.intersection1);
                        if (result === PlaneClassification.Front) {
                            const dist = Vector3.distanceSq(
                                camera.entity.transform.worldPosition,
                                collision.intersection1
                            );
                            if (dist < minDist) {
                                Private.selectedAxis = Axis.Y;
                                _intersection.copy(collision.intersection1);
                                minDist = dist;
                            }
                        }
                    }
                }

                collision = localPickingRay.castOnAABB(Private.zRotationAABB);
                if (collision) {
                    const dotZ = Math.abs(toObject.dot(transform.worldForward));
                    if (dotZ < axisInclinationFactor
                        || collision.intersection1.length > axisLength * Private.rotationCollisionRadius) {
                        collision.intersection1.transform(worldNoScale);
                        const result = midPlane.classifyPoint(collision.intersection1);
                        if (result === PlaneClassification.Front) {
                            const dist = Vector3.distanceSq(
                                camera.entity.transform.worldPosition,
                                collision.intersection1
                            );
                            if (dist < minDist) {
                                Private.selectedAxis = Axis.Z;
                                _intersection.copy(collision.intersection1);
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    public static onMouseUp() {
        if (!Private.transformStarted) {
            return false;
        }

        // TODO multiple selection
        const selected = State.instance.selection[0];
        const transform = selected.getComponent(Transform);
        if (transform) {
            const { controlMode } = State.instance;
            if (controlMode === ControlMode.Rotate) {
                // GlobalUndoRedo.recordPropertyChange(
                //     transform, 
                //     TransformInternal.rotationKey, 
                //     initialRotation, 
                //     transform.rotation
                // );
            } else if (controlMode === ControlMode.Hybrid) {
                // GlobalUndoRedo.recordPropertyChange(
                //     transform, 
                //     TransformInternal.positionKey, 
                //     initialPosition,
                //     transform.position
                // );
            }
        }
        Private.transformStarted = false;
        return true;
    }

    public static render(camera: Camera) {
        Private.visible = false;
        const selectedEntities = State.instance.selection;
        // TODO handle multi selection
        const selectedEntity = selectedEntities.length > 0 ? selectedEntities[0] : null;
        if (!selectedEntity) {            
            return;
        }

        const gl = WebGL.context;
        gl.disable(gl.DEPTH_TEST);
        const { transform } = selectedEntity;
        if (!transform) {
            return;
        }

        Private.visible = true;
        const {
            axisLengthFactor,
            selectedAxis,
            coneRadiusFactor,
            coneLengthFactor,
            xyzLengthFactor,
            xyzPoint1,
            xyzPoint2,
            xyzPoint3,
            xyzPoint4,
            xyControllerColor,
            zyControllerColor,
            xzControllerColor,
            ringColor
        } = Private;

        const position = Vector3.fromPool();
        const rotation = Quaternion.fromPool();
        const scale = Vector3.fromPool();
        const { controlMode } = State.instance;
        transform.worldMatrix.decompose(position, rotation, scale);
        Private.makeCenteredPos(selectedEntity, position);
        const distFromCamera = position.distFrom(camera.entity.transform.worldPosition);
        const axisLength = distFromCamera * axisLengthFactor;
        Private.axisLength = axisLength;
        Private.boxExtentFactor = distFromCamera * .01;
        const worldMatrix = Matrix44.fromPool()
            .compose(position, rotation, scale.copy(Vector3.one)
                .multiply(axisLength));
        const localCameraPos = transform.worldToLocal(camera.entity.transform.worldPosition, Vector3.fromPool());
        if (controlMode === ControlMode.Hybrid) {

            const xyzMatrix = Matrix44.fromPool();
            xyzMatrix.compose(
                position,
                rotation,
                scale.copy(Vector3.one).multiply(axisLength * xyzLengthFactor)
            );
            Private.xPlaneDir = Math.sign(localCameraPos.x) || 1;
            Private.yPlaneDir = Math.sign(localCameraPos.y) || 1;
            Private.zPlaneDir = Math.sign(localCameraPos.z) || 1;
            GeometryRenderer.drawQuad(
                xyzPoint1.set(0, Private.yPlaneDir, 0),
                xyzPoint2.set(Private.xPlaneDir, Private.yPlaneDir, 0),
                xyzPoint3.set(0, 0, 0),
                xyzPoint4.set(Private.xPlaneDir, 0, 0),
                selectedAxis === Axis.XY ? Color.yellow : xyControllerColor,
                xyzMatrix
            );

            GeometryRenderer.drawQuad(
                xyzPoint1.set(0, Private.yPlaneDir, 0),
                xyzPoint2.set(0, Private.yPlaneDir, Private.zPlaneDir),
                xyzPoint3.set(0, 0, 0),
                xyzPoint4.set(0, 0, Private.zPlaneDir),
                selectedAxis === Axis.ZY ? Color.yellow : zyControllerColor,
                xyzMatrix
            );

            GeometryRenderer.drawQuad(
                xyzPoint1.set(0, 0, Private.zPlaneDir),
                xyzPoint2.set(Private.xPlaneDir, 0, Private.zPlaneDir),
                xyzPoint3.set(0, 0, 0),
                xyzPoint4.set(Private.xPlaneDir, 0, 0),
                selectedAxis === Axis.XZ ? Color.yellow : xzControllerColor,
                xyzMatrix
            );

            const xPosColor = selectedAxis === Axis.XPos ? Color.yellow : Color.red;
            const xNegColor = selectedAxis === Axis.XNeg ? Color.yellow : Color.red;
            const yPosColor = selectedAxis === Axis.YPos ? Color.yellow : Color.green;
            const yNegColor = selectedAxis === Axis.YNeg ? Color.yellow : Color.green;
            const zPosColor = selectedAxis === Axis.ZPos ? Color.yellow : Color.blue;
            const zNegColor = selectedAxis === Axis.ZNeg ? Color.yellow : Color.blue;
            const extent = Vector3.fromPool().copy(Vector3.one).multiply(Private.boxExtentFactor);
            const xPos = Vector3.fromPool().copy(Vector3.right).multiply(axisLength);
            const yPos = Vector3.fromPool().copy(Vector3.up).multiply(axisLength);
            const zPos = Vector3.fromPool().copy(Vector3.forward).multiply(axisLength);
            const matrixNoScale = Matrix44.fromPool().compose(position, rotation, Vector3.one);
            GeometryRenderer.drawBox(xPos, extent, xPosColor, matrixNoScale);
            GeometryRenderer.drawBox(xPos.flip(), extent, xNegColor, matrixNoScale);            
            GeometryRenderer.drawBox(yPos, extent, yPosColor, matrixNoScale);
            GeometryRenderer.drawBox(yPos.flip(), extent, yNegColor, matrixNoScale);
            GeometryRenderer.drawBox(zPos, extent, zPosColor, matrixNoScale);
            GeometryRenderer.drawBox(zPos.flip(), extent, zNegColor, matrixNoScale);

        } else if (controlMode === ControlMode.Rotate) {
            const _scale = Vector3.fromPool().copy(Vector3.one).multiply(axisLength);
            const lookAt = Matrix44.fromPool();
            const toCamera = Vector3.fromPool()
                .copy(camera.entity.transform.worldPosition)
                .substract(position);
            if (toCamera.lengthSq > 0) {
                toCamera.normalize();
                lookAt.makeLookAt(toCamera, camera.entity.transform.worldUp)
                    .transpose()
                    .scale(_scale)
                    .setPosition(position);
                GeometryRenderer.drawCircle(ringColor, lookAt);

                // mask     
                gl.enable(gl.DEPTH_TEST);
                gl.depthMask(true);
                gl.clear(gl.DEPTH_BUFFER_BIT);
                gl.colorMask(false, false, false, false);
                const maskPos = Vector3.fromPool().copy(position);
                const maskOffset = Vector3.fromPool().copy(toCamera).flip().multiply(0.01);
                GeometryRenderer.drawBillboard(
                    maskPos.add(maskOffset),
                    axisLength * 1.5,
                    toCamera,
                    Color.black,
                    camera
                );
                gl.depthMask(false);
                gl.colorMask(true, true, true, true);

                lookAt.makeLookAt(transform.worldForward, transform.worldUp)
                    .transpose()
                    .scale(_scale)
                    .setPosition(position);
                GeometryRenderer.drawCircle(selectedAxis === Axis.Z ? Color.yellow : Color.blue, lookAt);

                lookAt.makeLookAt(transform.worldRight, transform.worldUp)
                    .transpose()
                    .scale(_scale)
                    .setPosition(position);
                GeometryRenderer.drawCircle(selectedAxis === Axis.X ? Color.yellow : Color.red, lookAt);

                lookAt.makeLookAt(transform.worldUp, transform.worldForward)
                    .transpose()
                    .scale(_scale)
                    .setPosition(position);
                GeometryRenderer.drawCircle(selectedAxis === Axis.Y ? Color.yellow : Color.green, lookAt);
            }

            // if (selectedAxis !== Axis.None) {                        
            //     EditorRenderer.geometryRenderer().drawAABB(aabb, Color.red, worldMatrix);
            // }
            // EditorRenderer.geometryRenderer().drawCross(_intersection, Color.green);
        }
    }
}
