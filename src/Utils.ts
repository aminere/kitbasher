import { Entities } from "../../spider-engine/src/core/Entities";
import { ScenesInternal } from "../../spider-engine/src/core/Scenes";
import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";
import { Config } from "./Config";
import { ContentItemType } from "./Types";
import { Entity } from "../../spider-engine/src/core/Entity";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { StaticMeshAsset } from "../../spider-engine/src/assets/StaticMeshAsset";
import { StaticMesh } from "../../spider-engine/src/graphics/geometry/StaticMesh";

export class Utils {
    public static capitalize(str: string) {
        const firstChar = String(str).charAt(0);
        return firstChar.toUpperCase() + String(str).slice(1);
    }

    public static saveCurrentScene() {
        const engineHud = Entities.find("EngineHud");
        if (engineHud) {
            engineHud.destroy();
        }
        const scene = ScenesInternal.list()[0];
        const data = JSON.stringify(scene.serialize(), null, 2);
        return IndexedDb.write("files", Config.currentScenePath, data);
    }

    public static isModel(item: ContentItemType) {
        return item.constructor.name === "ObjectDefinition";
    }

    public static hasTiling(entity: Entity) {
        const child = entity.children[0];
        const v = child.getComponent(Visual) as Visual;
        const mesh = (v.geometry as StaticMesh).mesh as StaticMeshAsset;
        return mesh.templatePath?.includes("_Tiled_");
    }

    public static makeEnumLiterals(enumObject: object) {
        const literals: { [property: string]: string } = {};
        const entries = Object.entries(enumObject);
        // tslint:disable-next-line
        console.assert(entries.length % 2 === 0);
        for (let i = entries.length / 2; i < entries.length; ++i) {
            const [literal, value] = entries[i];
            Object.assign(literals, { [value]: literal });
        }
        return literals;
    }
}
