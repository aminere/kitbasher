import { PaletteSlot } from "./PaletteSlot";
import { Color } from "../../../spider-engine/src/graphics/Color";
import { AssetReference } from "../../../spider-engine/src/serialization/AssetReference";
import { Texture2D } from "../../../spider-engine/src/graphics/texture/Texture2D";

export class MaterialSlot extends PaletteSlot {
    public diffuse = new Color().copy(Color.white);
    public ambient = new Color().copy(Color.black);
    public emissive = new Color().copy(Color.black);
    public diffuseMap = new AssetReference(Texture2D);
}
