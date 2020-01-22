import { Entities } from "../../spider-engine/src/core/Entities";
import { ScenesInternal } from "../../spider-engine/src/core/Scenes";
import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";
import { Config } from "./Config";

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
}
