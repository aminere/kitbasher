import { Entity } from "../../spider-engine/src/core/Entity";
import { Vector2 } from "../../spider-engine/src/math/Vector2";
import { Quaternion } from "../../spider-engine/src/math/Quaternion";
import { MathEx } from "../../spider-engine/src/math/MathEx";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { Camera } from "../../spider-engine/src/graphics/Camera";

namespace Private {
    export let camera: Entity;
    export let touchStartPos = new Vector2();
    export let previousTouchPos = new Vector2();
    export let cameraLookStarted = false;
    export let cameraStrafeStarted = false;

    const dummyVector3 = new Vector3();
    export function sanitizeCameraRotation() {
        camera.transform.rotation.toEuler(dummyVector3);
        const upFactor = camera.transform.worldUp.dot(Vector3.up);
        const expectedZRotation = upFactor > 0 ? 0 : Math.PI;
        if (!MathEx.isZero(dummyVector3.z - expectedZRotation)) {   
            // Debug.logWarning("Correcting camera rotation..");         
            camera.transform.rotation.setFromEulerAngles(dummyVector3.x, dummyVector3.y, expectedZRotation);
        }
    }
}

export class EditorCamera {
    public static set cameraEntity(camera: Entity) { Private.camera = camera; }
    public static get camera() { return Private.camera.getComponent(Camera) as Camera; }
    
    public static getWorldRay(x: number, y: number) {
        return (Private.camera.getComponent(Camera) as Camera).getWorldRay(x, y);
    }

    public static get transformStarted() { return Private.cameraLookStarted || Private.cameraStrafeStarted; }

    public static onMouseDown(x: number, y: number) {
        Private.touchStartPos.set(x, y);
        Private.previousTouchPos.copy(Private.touchStartPos);
    }

    public static onMouseMove(x: number, y: number, leftPress: boolean) {
        if (leftPress) {
            // Look
            if (Private.cameraLookStarted) {
                const deltaX = x - Private.previousTouchPos.x;
                const deltaY = y - Private.previousTouchPos.y;
                const cameraRotation = Quaternion.fromPool();
                const { camera } = Private;
                cameraRotation.setFromAxisAngle(camera.transform.worldRight, MathEx.toRadians(-deltaY) / 6);
                camera.transform.rotation.multiply(cameraRotation).normalize();
                const upFactor = Math.sign(camera.transform.worldUp.dot(Vector3.up));
                cameraRotation.setFromAxisAngle(Vector3.up, MathEx.toRadians(-deltaX * upFactor) / 6);
                camera.transform.rotation.multiply(cameraRotation).normalize();
                Private.previousTouchPos.set(x, y);
                return true;
            } else {
                const deltaX = x - Private.touchStartPos.x;
                const deltaY = y - Private.touchStartPos.y;
                if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                    Private.cameraLookStarted = true;
                    Private.previousTouchPos.set(x, y);
                }
            }
        } else {
            // Strafe
            if (Private.cameraStrafeStarted) {
                const deltaX = x - Private.previousTouchPos.x;
                const deltaY = y - Private.previousTouchPos.y;
                const { camera } = Private;
                const cameraTranslation = Vector3.fromPool();
                const cameraTranslationUp = Vector3.fromPool();
                cameraTranslation.copy(camera.transform.worldRight).multiply(-deltaX / 70);
                cameraTranslationUp.copy(camera.transform.worldUp).multiply(deltaY / 70);
                camera.transform.position.add(cameraTranslation.add(cameraTranslationUp));
                Private.previousTouchPos.set(x, y);
                return true;
            } else {
                const deltaX = x - Private.touchStartPos.x;
                const deltaY = y - Private.touchStartPos.y;
                if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                    Private.cameraStrafeStarted = true;
                    Private.previousTouchPos.set(x, y);
                }
            }
        }
        
        return false;
    }

    public static onMouseUp(x: number, y: number) {
        const { cameraLookStarted, cameraStrafeStarted } = Private;
        if (cameraLookStarted) {
            Private.sanitizeCameraRotation();
            Private.cameraLookStarted = false;
            return true;
        } else if (cameraStrafeStarted) {
            Private.cameraStrafeStarted = false;
            return true;
        }

        return false;
    }

    public static onMouseWheel(delta: number) {
        const cameraTranslation = Vector3.fromPool();
        cameraTranslation.copy(Private.camera.transform.worldForward).multiply(delta / 100);
        Private.camera.transform.position.add(cameraTranslation);
    }
}
