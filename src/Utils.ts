import { Entities } from "../../spider-engine/src/core/Entities";
import { ScenesInternal } from "../../spider-engine/src/core/Scenes";
import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";
import { Config } from "./Config";
import { ContentItemType } from "./Types";

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
