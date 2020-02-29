import { IKitAsset } from "./Types";
import { Manifest } from "./Manifest";
import { Assets } from "../../spider-engine/src/assets/Assets";

namespace Private {
    export let models: IKitAsset[];
}

export class Models {
    public static get models() { return Private.models; }

    public static async load() {
        const { models } = Manifest.getData();
        Private.models = (await Promise.all(models.map(([section, name]) => {
            return Assets.load(`Assets/Kits/${section}/${name}.ObjectDefinition`);
        }))) as unknown[] as IKitAsset[];
        await Promise.all(Private.models.map(a => a.thumbnail.loadTextureData()));
    }
}
