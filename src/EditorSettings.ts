import { UniqueObject } from "../../spider-engine/src/core/UniqueObject";
import { Entity } from "../../spider-engine/src/core/Entity";
import { Color } from "../../spider-engine/src/graphics/Color";
import { Transform } from "../../spider-engine/src/core/Transform";
import { Camera } from "../../spider-engine/src/graphics/Camera";
import { SerializedObject } from "../../spider-engine/src/core/SerializableObject";
import * as Attributes from "../../spider-engine/src/core/Attributes";

export class EditorSettings extends UniqueObject {

    public static path = "spider-editor.json";

    @Attributes.unserializable()
    public  get version() { return 20; }
    
    public lastEditedSceneId = "";
    public useEditorCameraInPlayMode = false;
    public showGrid = true;
    public showWireFrame = false;
    public showShadowCascades = false;
    public showIcons = true;
    public showCollisionShapes = false;
    public showCameraFrustums = true;
    public showLightGizmos = true;

    public editorCameraEntity: Entity;    
    public htmlBackgroundColor = new Color();
    public forcePow2TexturesOnImport = false;

    public get requiresDefaultAssetsUpgrade() { return this._requiresDefaultAssetsUpgrade; }

    @Attributes.unserializable()
    private _requiresDefaultAssetsUpgrade = false;
    
    public constructor() {
        super();
        this.editorCameraEntity = new Entity();
        this.editorCameraEntity.setComponent(Transform);
        this.editorCameraEntity.setComponent(Camera);
        this.editorCameraEntity.name = "EditorCamera";
        this.editorCameraEntity.setTag("editor");
        this.editorCameraEntity.transform.position.set(0, 0, 10);
    }

    public upgrade(json: SerializedObject, previousVersion: number) {
        if (previousVersion === 1) {
            delete json.properties.editorCamera;
        } else if (previousVersion === 2) {
            delete json.properties.lastEditedScenePath;
        } else if (previousVersion === 3) {
            Object.assign(json.properties, { renderDebugShapes: json.properties.showBoundingShapes });
            delete json.properties.showBoundingShapes;
        } else if (previousVersion >= 4 && previousVersion < this.version) {
            this._requiresDefaultAssetsUpgrade = true;
        }
        return json;
    }
}
