
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
import { ScenesInternal, Scenes } from "../../spider-engine/src/core/Scenes";
import { TimeInternal } from "../../spider-engine/src/core/Time";
import { IObjectManagerInternal } from "../../spider-engine/src/core/IObjectManager";
import { Entity } from "../../spider-engine/src/core/Entity";
import { Transform } from "../../spider-engine/src/core/Transform";
import { EditorSettings } from "./EditorSettings";
import { Interfaces } from "../../spider-engine/src/core/Interfaces";
import { ProjectUtils } from "./ProjectUtils";
import { Debug } from "../../spider-engine/src/io/Debug";
import { EngineError } from "../../spider-engine/src/core/EngineError";
import { SavedDataInternal } from "../../spider-engine/src/io/SavedData";
import { Screen } from "../../spider-engine/src/ui/Screen";

namespace Private {

    let canvasReady = false;
    export let canvasHasFocus = () => false;

    let editorSettings: EditorSettings;
    // tslint:disable-next-line
    let editorSettingsSaveTimer: any;    
    export const editorCamera = () => editorSettings.editorCameraEntity.getComponent(Camera) as Camera;

    let freshProjectImport = false;
    let sceneLoadingInProgress = false;

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

            if (sceneLoadingInProgress) {
                State.renderingActive = false;
                requestAnimationFrame(() => update());
                return;
            }

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
            Debug.logError(`Runtime Exception: ${e.message}`);
        }

        requestAnimationFrame(callback => update());
    }

    function saveEditorSettings(_immediate?: boolean) {
        const immediate = _immediate !== undefined ? _immediate : false;
        return Promise.resolve()
            .then(() => {
                if (!immediate) {
                    if (editorSettingsSaveTimer) {
                        clearTimeout(editorSettingsSaveTimer);
                    }
                    return new Promise<void>(resolve => {
                        editorSettingsSaveTimer = setTimeout(
                            () => {
                                resolve();
                                editorSettingsSaveTimer = null;
                            },
                            1000
                        );
                    });
                } else {
                    return Promise.resolve();
                }
            })
            .then(() => {
                return IObjectManagerInternal.instance.saveObjectAtPath(
                    editorSettings,
                    editorSettings.templatePath as string,                 
                    false
                );
            });
    }

    const editorSettingsNotFound = "editorSettingsNotFound";
    function loadEditorSettings() {
        return new Promise((resolve, reject) => {
            IObjectManagerInternal.instance.loadObject(EditorSettings.path)
                .then(([_settings]) => {
                    const settings = _settings as EditorSettings;
                    editorSettings = settings as EditorSettings;
                    const finished = () => {
                        // Apply some project settings to the engine
                        Interfaces.renderer.showWireFrame = editorSettings.showWireFrame;
                        Interfaces.renderer.showShadowCascades = editorSettings.showShadowCascades;
                        resolve();
                    };
                    if (editorSettings.requiresDefaultAssetsUpgrade) {
                        ProjectUtils.upgradeDefaultAssets(editorSettings)
                            .then(() => {
                                return saveEditorSettings(true);
                            })
                            .then(() => finished())
                            .catch(() => {
                                Debug.logError("Failed to save editor settings");
                                finished();
                            });
                    } else {
                        finished();
                    }
                })
                .catch(() => reject(editorSettingsNotFound));
        });
    }

    function openScene(sceneId: string) {
        sceneLoadingInProgress = true;
        const currentScene = ScenesInternal.list()[0];
        const isSameScene = currentScene !== undefined && currentScene.id === sceneId;
        return Scenes.loadById(sceneId)
            .then(newScene => {
                if (newScene.id !== editorSettings.lastEditedSceneId) {
                    editorSettings.lastEditedSceneId = newScene.id;
                    return saveEditorSettings(true);
                } else {
                    return Promise.resolve();
                }
            })
            .then(() => {
                // EditorEvents.sceneLoaded.post(isSameScene);
                sceneLoadingInProgress = false;
                // Make sure the first engine update has valid widget size information
                // Components.ofType(Screen).forEach(screen => screen.updateTransforms());
                return Promise.resolve();
            });
    }

    function initEditor() { 
        State.engineReady = true;
        update();
        // return EditorRenderer.init()
        //     .then(() => {                
        //         EntityController2D.init();
        //         EditorState.setEngineReady(true);
        //         // Start the update loop!
        //         EditorController.update();
        //     });
    }

    function onProjectImportFinished() {
        loadEditorSettings()
            .then(() => {
                // EditorCommands.populateAssetBrowser.post();
                return EngineInternal.reload();
            })
            .then(() => openScene(editorSettings.lastEditedSceneId))
            .then(() => SavedDataInternal.preload())
            .then(() => {
                if (freshProjectImport) {
                    return initEditor();
                } else {
                    return Promise.resolve();
                    // return EditorRenderer.reload();
                }
            })
            .then(() => {
                // EditorEvents.projectSettingsReloaded.post();                
                // EditorCommands.disableEditor.post(false);
            })
            .catch(() => {
                // EditorCommands.disableEditor.post(false);
            });       
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
        .then(() => loadEditorSettings())        
        .then(() => DefaultAssetsInternal.load())
        .then(() => {
            State.engineReady = true;
            update();
        })
        .catch(error => {
            if ([
                editorSettingsNotFound, 
                EngineError.EngineSettingsLoadFailed,
                EngineError.AssetIdsLoadFailed
            ].some(e => e === error)) {
                // Launching the editor on a fresh slate, try to import a project
                // TODO - if there is a project to import, import it instead of the default project!
                ProjectUtils.loadDefaultProject()
                    .then(() => {
                        freshProjectImport = true;
                        onProjectImportFinished();
                    });
            } else {
                // tslint:disable-next-line
                console.error(error);
            }
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
