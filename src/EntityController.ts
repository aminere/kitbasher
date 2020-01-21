import { Ray } from "../../spider-engine/src/math/Ray";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { Plane, PlaneClassification } from "../../spider-engine/src/math/Plane";
import { AABB } from "../../spider-engine/src/math/AABB";
import { Color } from "../../spider-engine/src/graphics/Color";
import { Quaternion } from "../../spider-engine/src/math/Quaternion";
import { Camera } from "../../spider-engine/src/graphics/Camera";
import { Vector2 } from "../../spider-engine/src/math/Vector2";
import { State, ControlMode } from "./State";
import { Axis } from "./Types";
import { Events } from "./Events";
import { Matrix44 } from "../../spider-engine/src/math/Matrix44";
import { Transform } from "../../spider-engine/src/core/Transform";
import { WebGL } from "../../spider-engine/src/graphics/WebGL";
import { GeometryRenderer } from "../../spider-engine/src/graphics/geometry/GeometryRenderer";
import { Snapping } from "./Snapping";
import { Settings } from "./Settings";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { Entity } from "../../spider-engine/src/core/Entity";

namespace Private {
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

    export const localPickingRay = new Ray();
    export const initialIntersection = new Vector3();
    export const currentIntersection = new Vector3();
    export const translation = new Vector3();
    export const translation2 = new Vector3();
    export const controlPlane = new Plane();

    // translation
    export const xAxisAABB = new AABB();
    export const yAxisAABB = new AABB();
    export const zAxisAABB = new AABB();
    export const xyAABB = new AABB();
    export const xzAABB = new AABB();
    export const zyAABB = new AABB();
    export const xyControllerColor = new Color().copy(Color.blue).setAlpha(0.6);
    export const xzControllerColor = new Color().copy(Color.green).setAlpha(0.6);
    export const zyControllerColor = new Color().copy(Color.red).setAlpha(0.6);
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
        const bbox = entity.children[0].getComponent(Visual)?.geometry?.getBoundingBox();
        if (bbox) {
            const transformedBbox = AABB.fromPool().copy(bbox)
                .transform(entity.children[0].transform.worldMatrix);
            position.x = (transformedBbox.min.x + transformedBbox.max.x) / 2;
            position.y = (transformedBbox.min.y + transformedBbox.max.y) / 2;
            position.z = (transformedBbox.min.z + transformedBbox.max.z) / 2;
        }
    }
}

export class EntityController {
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
                    if (controlMode === ControlMode.Translate
                        || controlMode === ControlMode.Scale) {
                        if (selectedAxis === Axis.X) {
                            const dotZ = Math.abs(toObject.dot(transform.worldForward));
                            const dotY = Math.abs(toObject.dot(transform.worldUp));
                            if (dotZ > dotY) {
                                controlPlane.setFromPoint(transform.worldForward, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(transform.worldUp, transform.worldPosition);
                            }
                        } else if (selectedAxis === Axis.Y) {
                            const dotX = Math.abs(toObject.dot(transform.worldRight));
                            const dotZ = Math.abs(toObject.dot(transform.worldForward));
                            if (dotX > dotZ) {
                                controlPlane.setFromPoint(transform.worldRight, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(transform.worldForward, transform.worldPosition);
                            }
                        } else if (selectedAxis === Axis.Z) {
                            const dotX = Math.abs(toObject.dot(transform.worldRight));
                            const dotY = Math.abs(toObject.dot(transform.worldUp));
                            if (dotX > dotY) {
                                controlPlane.setFromPoint(transform.worldRight, transform.worldPosition);
                            } else {
                                controlPlane.setFromPoint(transform.worldUp, transform.worldPosition);
                            }
                        } else if (selectedAxis === Axis.XY) {
                            controlPlane.setFromPoint(transform.worldForward, transform.worldPosition);
                        } else if (selectedAxis === Axis.XZ) {
                            controlPlane.setFromPoint(transform.worldUp, transform.worldPosition);
                        } else if (selectedAxis === Axis.ZY) {
                            controlPlane.setFromPoint(transform.worldRight, transform.worldPosition);
                        }
                        const pickingRay = camera.getWorldRay(clickStart.x, clickStart.y);
                        if (pickingRay) {
                            initialIntersection.copy(pickingRay.castOnPlane(controlPlane).intersection as Vector3);
                            if (controlMode === ControlMode.Translate) {
                                initialPosition.copy(transform.position);
                            } else {
                                initialScale.copy(transform.scale);
                            }
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
                if (controlMode === ControlMode.Translate) {
                    translation.substractVectors(currentIntersection, initialIntersection);
                    const parentScale = (transform.parent && transform.parent.transform)
                        ? transform.parent.transform.worldScale
                        : Vector3.one;

                    const snap = (a: Vector3, b: Vector3) => {
                        transform.position.x = Snapping.snap(a.x + b.x, Settings.gridSize);
                        transform.position.y = Snapping.snap(a.y + b.y, Settings.gridSize);
                        transform.position.z = Snapping.snap(a.z + b.z, Settings.gridSize);                
                    };

                    if (selectedAxis === Axis.X) {

                        translation.projectOnVector(transform.worldRight).multiply(1 / parentScale.x);
                        const length = translation.length;
                        const dir = Math.sign(translation.dot(transform.worldRight));

                        translation.copy(transform.right).multiply(length * dir);
                        snap(initialPosition, translation);

                    } else if (selectedAxis === Axis.Y) {

                        translation.projectOnVector(transform.worldUp).multiply(1 / parentScale.y);
                        const length = translation.length;
                        const dir = Math.sign(translation.dot(transform.worldUp));

                        translation.copy(transform.up).multiply(length * dir);
                        snap(initialPosition, translation);
                    } else if (selectedAxis === Axis.Z) {

                        translation.projectOnVector(transform.worldForward).multiply(1 / parentScale.z);
                        const length = translation.length;
                        const dir = Math.sign(translation.dot(transform.worldForward));

                        translation.copy(transform.forward).multiply(length * dir);
                        snap(initialPosition, translation);
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
                        const snapped = Snapping.snap(angle, Settings.angleSnap);
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
                } else {

                    // Scale
                    translation.substractVectors(currentIntersection, initialIntersection);
                    const parentScale = (transform.parent && transform.parent.transform)
                        ? transform.parent.transform.worldScale
                        : Vector3.one;

                    const snap = (
                        prop: "x" | "y" | "z",
                        offset: Vector3,
                        axis: Vector3,
                        factor?: number
                    ) => {
                        const dir = Math.sign(offset.dot(axis));
                        transform.scale[prop] = Snapping.snap(
                            initialScale[prop] + offset.length * (factor ?? 1) * dir, 
                            Settings.gridSize
                        );
                    };

                    if (selectedAxis === Axis.X) {

                        translation.projectOnVector(Vector3.right).multiply(1 / parentScale.x);
                        snap("x", translation, transform.worldRight);

                    } else if (selectedAxis === Axis.Y) {

                        translation.projectOnVector(transform.worldUp).multiply(1 / parentScale.x);
                        snap("y", translation, transform.worldUp);

                    } else if (selectedAxis === Axis.Z) {

                        translation.projectOnVector(transform.worldForward).multiply(1 / parentScale.x);
                        snap("z", translation, transform.worldForward);

                    } else if (selectedAxis === Axis.XY) {

                        translation2.copy(translation);
                        translation.projectOnVector(transform.worldRight).multiply(1 / parentScale.x);
                        snap("x", translation, transform.worldRight, Private.xPlaneDir);

                        translation2.projectOnVector(transform.worldUp).multiply(1 / parentScale.x);
                        snap("y", translation2, transform.worldUp, Private.yPlaneDir);

                    } else if (selectedAxis === Axis.XZ) {

                        translation2.copy(translation);
                        translation.projectOnVector(transform.worldRight).multiply(1 / parentScale.x);
                        snap("x", translation, transform.worldRight, Private.xPlaneDir);

                        translation2.projectOnVector(transform.worldForward).multiply(1 / parentScale.x);
                        snap("z", translation2, transform.worldForward, Private.zPlaneDir);

                    } else if (selectedAxis === Axis.ZY) {

                        translation2.copy(translation);
                        translation.projectOnVector(transform.worldForward).multiply(1 / parentScale.x);
                        snap("z", translation, transform.worldForward, Private.zPlaneDir);

                        translation2.projectOnVector(transform.worldUp).multiply(1 / parentScale.x);
                        snap("y", translation2, transform.worldUp, Private.yPlaneDir);
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

            if (controlMode === ControlMode.Translate
                || controlMode === ControlMode.Scale) {
                // update the axis bounding boxes          
                let t = axisLength * Private.axisThicknessFactor;
                Private.xAxisAABB.min.set(0, -t, -t);
                Private.xAxisAABB.max.set(axisLength, t, t);
                Private.yAxisAABB.min.set(-t, 0, -t);
                Private.yAxisAABB.max.set(t, axisLength, t);
                Private.zAxisAABB.min.set(-t, -t, 0);
                Private.zAxisAABB.max.set(t, t, axisLength);
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
                } else if (localPickingRay.castOnAABB(Private.xAxisAABB)) {
                    Private.selectedAxis = Axis.X;
                } else if (localPickingRay.castOnAABB(Private.yAxisAABB)) {
                    Private.selectedAxis = Axis.Y;
                } else if (localPickingRay.castOnAABB(Private.zAxisAABB)) {
                    Private.selectedAxis = Axis.Z;
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
            } else if (controlMode === ControlMode.Translate) {
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
        const worldMatrix = Matrix44.fromPool()
            .compose(position, rotation, scale.copy(Vector3.one)
                .multiply(axisLength));
        const localCameraPos = transform.worldToLocal(camera.entity.transform.worldPosition, Vector3.fromPool());
        if (
            controlMode === ControlMode.Translate
            || controlMode === ControlMode.Scale
        ) {
            const xColor = selectedAxis === Axis.X ? Color.yellow : Color.red;
            const yColor = selectedAxis === Axis.Y ? Color.yellow : Color.green;
            const zColor = selectedAxis === Axis.Z ? Color.yellow : Color.blue;
            GeometryRenderer.drawLine(Vector3.zero, Vector3.right, xColor, worldMatrix);
            GeometryRenderer.drawLine(Vector3.zero, Vector3.up, yColor, worldMatrix);
            GeometryRenderer.drawLine(Vector3.zero, Vector3.forward, zColor, worldMatrix);

            if (controlMode === ControlMode.Translate) {
                const coneRadius = distFromCamera * coneRadiusFactor;
                const coneLength = distFromCamera * coneLengthFactor;
                GeometryRenderer.drawCone(
                    coneRadius,
                    coneLength,
                    axisLength,
                    transform.worldRight,
                    transform.worldUp,
                    xColor,
                    position
                );
                GeometryRenderer.drawCone(
                    coneRadius,
                    coneLength,
                    axisLength,
                    transform.worldUp,
                    transform.worldRight,
                    yColor,
                    position
                );
                GeometryRenderer.drawCone(
                    coneRadius,
                    coneLength,
                    axisLength,
                    transform.worldForward,
                    transform.worldUp,
                    zColor,
                    position
                );
            } else {
                const extentFactor = distFromCamera * .01;
                const extent = Vector3.fromPool().copy(Vector3.one).multiply(extentFactor);
                const xPos = Vector3.fromPool().copy(Vector3.right).multiply(axisLength);
                const yPos = Vector3.fromPool().copy(Vector3.up).multiply(axisLength);
                const zPos = Vector3.fromPool().copy(Vector3.forward).multiply(axisLength);
                const matrixNoScale = Matrix44.fromPool().compose(position, rotation, Vector3.one);
                GeometryRenderer.drawBox(xPos, extent, xColor, matrixNoScale);
                GeometryRenderer.drawBox(yPos, extent, yColor, matrixNoScale);
                GeometryRenderer.drawBox(zPos, extent, zColor, matrixNoScale);
            }

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
