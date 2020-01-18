import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";
import { Model } from "../../spider-engine/src/assets/model/Model";

export interface IKitAsset {
    id: string;
    thumbnail: Texture2D;
    model: Model;
}

export enum Axis {
    None,
    X,
    Y,
    Z,
    XY,
    XZ,
    ZY
}
