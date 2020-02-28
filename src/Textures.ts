import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";
import { Manifest } from "./Manifest";
import { Assets } from "../../spider-engine/src/assets/Assets";

namespace Private {
    export let textures: Texture2D[] = [];
}
export class Textures {

    public static get textures() { return Private.textures; }
    public static get images() { return Private.textures.map(t => t.image); }

    public static async load() {
        const { textures } = Manifest.getData();
        Private.textures = (await Promise.all(textures.map(name => {
            return Assets.load(`Assets/Textures/${name}.Texture2D`);
        }))) as Texture2D[];
        await Promise.all(Private.textures.map(t => t.loadTextureData()));
    }
}
