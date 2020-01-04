
import { Events } from "./Events";
import { Engine, EngineInternal, EngineHandlersInternal } from "../../spider-engine/src/core/Engine";
import { DefaultAssetsInternal } from "../../spider-engine/src/assets/DefaultAssets";
import { State } from "./State";
import { UpdateInternal } from "../../spider-engine/src/core/Update";
import { Components } from "../../spider-engine/src/core/Components";
import { Camera } from "../../spider-engine/src/graphics/Camera";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { Light } from "../../spider-engine/src/graphics/lighting/Light";
import { AssetsInternal } from "../../spider-engine/src/assets/Assets";
import { ScenesInternal } from "../../spider-engine/src/core/Scenes";
import { TimeInternal } from "../../spider-engine/src/core/Time";
import { IObjectManagerInternal } from "../../spider-engine/src/core/IObjectManager";
import { Entity } from "../../spider-engine/src/core/Entity";
import { Transform } from "../../spider-engine/src/core/Transform";

namespace Private {

    let canvasReady = false;
    export let canvasHasFocus = () => false;

    let editorCameraEntity: Entity;
    export const editorCamera = () => editorCameraEntity.getComponent(Camera) as Camera;

    function update() {
        try {
            if (!State.engineReady) {
                State.renderingActive = false;
                return;
            }

            AssetsInternal.updateLoading();

            if (!DefaultAssetsInternal.isLoaded()) { 
                State.renderingActive = false;
                requestAnimationFrame(() => update());
                return;
            }

            ScenesInternal.updateTransition();
            TimeInternal.updateDeltaTime();
            EngineInternal.flushPools();

            // if (editorDisabled) {
            //     EditorState.setRenderingActive(false);
            //     requestAnimationFrame(() => this.update());
            //     return;
            // }

            // if (sceneLoadingInProgress) {
            //     EditorState.setRenderingActive(false);
            //     checkCodeBlockErrors();
            //     requestAnimationFrame(() => this.update());
            //     return;
            // }

            if (!ScenesInternal.list().every(s => s.isLoaded())) {
                State.renderingActive = false;
                requestAnimationFrame(() => update());
                return;
            }

            if (!canvasReady) {
                if (!canvasHasFocus()) {
                    State.renderingActive = false;
                    requestAnimationFrame(() => update());
                    return;
                }

                IObjectManagerInternal.instance.loadGraphicObjects();
                EngineHandlersInternal.onWindowResized();
                canvasReady = true;
            }

            State.renderingActive = true;            
            UpdateInternal.update(); 

            const renderables = Components.ofTypes([
                Visual,
                Light,
                Camera
            ]);
            const sceneCameras = renderables.Camera as Camera[];
            sceneCameras.sort((a, b) => a.priority - b.priority);

            // if (editorCameraProcessPending) {                    
            //     if (engineStatus === EngineStatus.Paused) {
            //         const firstMainCamera = sceneCameras.find(c => !Boolean(c.renderTarget));
            //         if (firstMainCamera) {
            //             if (!editorCameraTransformBackup) {
            //                 editorCameraTransformBackup = editorCamera().entity.transform.copy() as Transform;
            //             }
            //             const { worldPosition, worldRotation, worldScale } = firstMainCamera.entity.transform;
            //             editorCamera().entity.transform.position = worldPosition;
            //             editorCamera().entity.transform.rotation = worldRotation;
            //             editorCamera().entity.transform.scale = worldScale;
            //         }
            //     } else if (engineStatus === EngineStatus.Stopped) {
            //         if (editorCameraTransformBackup) {
            //             const { position, rotation, scale } = editorCameraTransformBackup;
            //             editorCamera().entity.transform.position = position;
            //             editorCamera().entity.transform.rotation = rotation;
            //             editorCamera().entity.transform.scale = scale;
            //             editorCameraTransformBackup = null;
            //         }
            //     }
            //     editorCameraProcessPending = false;
            // }

            // include scene cameras that have a render target, so that they get updated
            const camerasForRendering = sceneCameras.filter(c => Boolean(c.renderTarget));
            camerasForRendering.push(editorCamera());
            EngineInternal.render(
                camerasForRendering,
                renderables,
                // camera => EditorRenderer.preRender(camera),
                // camera => EditorRenderer.postRender(camera),
                // EditorRenderer.uiPostRender
            );

        } catch (e) {
            // TODO show toaster
            // Debug.logError(`Runtime Exception: ${e.message}`);
        }

        requestAnimationFrame(callback => update());
    }

    Events.canvasMounted.attach(canvas => {
        Engine.create({
            container: canvas,
            // customTypes: [
            //     [Folder, UniqueObject],
            //     [Folders, UniqueObject],                
            //     [EditorSettings, UniqueObject]
            // ]
        })
        .then(() => {
            editorCameraEntity = new Entity();
            editorCameraEntity.setComponent(Transform);
            editorCameraEntity.setComponent(Camera);
            editorCameraEntity.name = "EditorCamera";
            editorCameraEntity.setTag("editor");
            editorCameraEntity.transform.position.set(0, 0, 10);
        })
        .then(() => DefaultAssetsInternal.load())
        .then(() => {
            State.engineReady = true;
            update();
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

    public static onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {

    }

    public static onMouseMove(e: React.MouseEvent<HTMLElement>, localX: number, localY: number) {
        
    }

    public static onMouseUp(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {

    }    

    public static onMouseLeave(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {

    }
}
