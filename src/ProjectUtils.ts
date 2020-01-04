import { EditorSettings } from "./EditorSettings";
import { Folder } from "../../spider-engine/src/io/Folder";
import { FoldersInternal } from "../../spider-engine/src/io/Folders";
import { AssetIdDatabaseInternal } from "../../spider-engine/src/assets/AssetIdDatabase";
import { WebUtils } from "../../spider-engine/src/common/WebUtils";
import { AsyncUtils } from "../../spider-engine/src/core/AsyncUtils";
import { Interfaces } from "../../spider-engine/src/core/Interfaces";
import { Debug } from "../../spider-engine/src/io/Debug";
import { EngineSettingsInternal } from "../../spider-engine/src/core/EngineSettings";
import { IObjectManagerInternal } from "../../spider-engine/src/core/IObjectManager";

// tslint:disable-next-line
const JSZip = require("jszip");

namespace Private {

    function _importProjectFromBlob(blob: Blob, success: (hasErrors: boolean) => void, error: () => void) {
        const finished = (succeeded: boolean, withErrors?: boolean) => {
            if (succeeded) {
                success(withErrors || false);
            } else {
                error();
            }
        };
        const newZip = new JSZip();
        newZip.loadAsync(blob)
            .then(
                // tslint:disable-next-line
                (zip: any) => {
                    if (process.env.PLATFORM === "web") {
                        const extractedFiles = {};
                        const paths = Object.keys(zip.files);
                        AsyncUtils.processBatch(
                            paths,
                            (path, extractSuccess, extractError) => {
                                const zipFile = zip.file(path);
                                if (zipFile) {
                                    zipFile.async("string").then(
                                        (fileData: string) => {
                                            // upgrade editor settings
                                            if ([
                                                "Assets/DefaultAssets/Editor/ProjectSettings",
                                                "Assets/EditorSettings.json"
                                            ].some(p => p === path)) {
                                                path = EditorSettings.path;
                                                fileData = fileData.replace(/ProjectSettings/g, "EditorSettings");
                                            } else if (["Assets/EngineSettings.json"].some(p => p === path)) {
                                                path = EngineSettingsInternal.path;
                                            } else if (["idDatabase"].some(p => p === path)) {
                                                path = AssetIdDatabaseInternal.path;
                                            } else if (["folderDatabase"].some(p => p === path)) {
                                                path = FoldersInternal.foldersPath;
                                            }
                                            extractedFiles[path] = fileData;
                                            extractSuccess();
                                        },
                                        extractError
                                    );
                                } else {
                                    extractSuccess();
                                }
                            },
                            extractionError => {
                                const { file } = Interfaces;
                                file.clearAllFiles()
                                    .then(() => {
                                        const filePaths = Object.keys(extractedFiles);
                                        AsyncUtils.processBatch(
                                            filePaths,
                                            (filePath, writeSuccess, writeError) => {
                                                const fileData = extractedFiles[filePath];
                                                file.write(filePath, fileData)
                                                    .then(() => writeSuccess())
                                                    .catch(() => writeError());
                                            },
                                            hasErrors => {                                                
                                                // Import complete!
                                                IObjectManagerInternal.instance.clearCache();
                                                AssetIdDatabaseInternal.reload()
                                                    .then(() => FoldersInternal.load())
                                                    .then(() => finished(true, hasErrors))
                                                    .then(() => AssetIdDatabaseInternal.loadExternalIds());
                                            }
                                        );
                                    })                                    
                                    .catch(() => finished(false));
                            }
                        );
                    } else {
                        // TODO electron
                    }
                },
                () => finished(false)
            )
            .catch(() => finished(false));
    }

    export function importProjectFromBlob(blob: Blob) {
        // EditorCommands.disableEditor.post(true);
        // EditorEvents.downloadStarted.post({
        //     requestId: undefined,
        //     message: "Importing Project",
        //     onCancelled: () => {
        //         EditorEvents.downloadCancelled.post();
        //         EditorCommands.disableEditor.post(false);
        //     }
        // });
        return new Promise((resolve, reject) => {
            _importProjectFromBlob(
                blob,
                hasErrors => {
                    if (hasErrors) {
                        Debug.logWarning("Project Import Completed, but with Errors.");
                        // EditorCommands.showToaster.post({
                        //     message: "Project Import Completed, but with Errors.",
                        //     intent: Intent.WARNING
                        // });
                    } else {
                        Debug.log("Project Imported Successfully.");
                        // EditorCommands.showToaster.post({ 
                        //     message: "Project Imported Successfully.", 
                        //     intent: Intent.PRIMARY 
                        // });
                    }
                    // Private.updateProjectLocalStorageInfo(projectId);
                    resolve();
                },
                () => {
                    // EditorEvents.downloadCancelled.post();
                    // EditorEvents.projectImportCancelled.post();
                    // EditorCommands.showToaster.post({ 
                    //     message: "Invalid Project Format :(", 
                    //     intent: Intent.WARNING 
                    // });
                    Debug.logError("Project Import Failed.");
                    reject();
                }
            );
        });
    }
}

export class ProjectUtils {

    public static loadDefaultProject() {
        return new Promise((resolve, reject) => {
            WebUtils.request(
                "GET",
                "/public/EmptyProject.zip",
                response => {
                    Private.importProjectFromBlob(response)
                        .then(resolve)
                        .catch(reject);
                },
                error => {
                    Debug.logError("Faild to load default project");                    
                    // EditorCommands.showToaster.post({
                    //     message: `Failed to load default project '${url}'`,
                    //     intent: Intent.WARNING
                    // });
                    reject();
                },
                undefined,
                "blob"
            );
        });        
    }

    public static upgradeDefaultAssets(settings: EditorSettings) {        
        const url = `https://spiderengine-io.appspot.com.storage.googleapis.com/default_assets/DefaultAssets${settings.version}.zip`;
        return new Promise((resolve, reject) => {
            const finished = (error: boolean, folderDbData?: string, idDbData?: string) => {
                if (error || !folderDbData || !idDbData) {
                    reject();
                } else {
                    const json = JSON.parse(folderDbData);
                    const folderDb = new Folder();                    
                    folderDb.deserialize(json.properties.assets);
                    folderDb.assignParentNodes();
                    const newDefaultAssets = folderDb.findFolder("DefaultAssets") as Folder;
                    const oldDefaultAssets = FoldersInternal.folders.assets.findFolder("DefaultAssets") as Folder;
                    const newIdDatabase = JSON.parse(idDbData);                    

                    const extractIds = (folder: Folder, ids: string[]) => {
                        for (const id of folder.ids.data) {
                            ids.push(id.valueOf());
                        }
                        for (const subFolder of folder.folders.data) {
                            extractIds(subFolder, ids);
                        }
                    };

                    // Update ID database
                    const oldDefaultIds: string[] = [];
                    const newDefaultIds: string[] = [];
                    extractIds(oldDefaultAssets, oldDefaultIds);
                    extractIds(newDefaultAssets, newDefaultIds);
                    AssetIdDatabaseInternal.deleteIds(oldDefaultIds, false);
                    const newPaths: { [id: string]: string } = {};
                    for (const _newId of newDefaultIds) {
                        const newId = _newId.valueOf();
                        const newPath = newIdDatabase[newId];
                        if (newPath) {
                            newPaths[newId] = newPath;
                        } else {
                            // tslint:disable-next-line
                            console.assert(false);
                        }
                    }
                    AssetIdDatabaseInternal.setPaths(newPaths, false);
                    AssetIdDatabaseInternal.save();

                    // Update folder database
                    const defaultAssetsIndex = FoldersInternal.folders.assets.folders.data.indexOf(oldDefaultAssets);
                    if (defaultAssetsIndex >= 0) {
                        newDefaultAssets.parent = oldDefaultAssets.parent;
                        FoldersInternal.folders.assets.folders.data[defaultAssetsIndex] = newDefaultAssets;
                        FoldersInternal.save(false);
                    } else {
                        // tslint:disable-next-line
                        console.assert(false);
                    }
                    
                    resolve();
                }
            };
            WebUtils.request(
                "GET",
                url,
                response => {
                    const container = new JSZip();
                    container.loadAsync(response)
                        .then(
                            // tslint:disable-next-line
                            (zip: any) => {
                                const paths = Object.keys(zip.files);
                                const extractedFiles: { [path: string]: string } = {};
                                AsyncUtils.processBatch(
                                    paths,
                                    (path, success, error) => {
                                        const zipFile = zip.file(path);
                                        if (zipFile) {
                                            zipFile.async("string").then(
                                                (fileData: string) => {
                                                    extractedFiles[path] = fileData;
                                                    success();
                                                },
                                                error
                                            );
                                        } else {
                                            success();
                                        }
                                    },
                                    hasErrors => {
                                        const _paths = Object.keys(extractedFiles);
                                        let folderDb: string;
                                        let idDb: string;
                                        AsyncUtils.processBatch(
                                            _paths,
                                            (path, success, error) => {
                                                const fileData = extractedFiles[path];
                                                if (path === FoldersInternal.foldersPath) {
                                                    folderDb = fileData;
                                                    success();
                                                } else if (path === AssetIdDatabaseInternal.path) {
                                                    idDb = fileData;
                                                    success();
                                                } else {
                                                    if (path === EditorSettings.path) {
                                                        // ignore editor settings from default asset pack
                                                        success();
                                                    } else {                                                        
                                                        Interfaces.file.write(path, fileData)
                                                            .then(() => success())
                                                            .catch(() => error());
                                                    }
                                                }                                                
                                            },
                                            _hasErrors => finished(_hasErrors, folderDb, idDb)
                                        );
                                    }
                                );
                            },
                            () => finished(true)
                        );
                },
                () => finished(true),
                undefined,
                "blob"
            );
        });        
    }
}
