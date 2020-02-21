import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";
import { Model } from "../../spider-engine/src/assets/model/Model";

export enum Plane {
    X,
    Y,
    Z
}

export interface IKitAsset {
    id: string;
    thumbnail: Texture2D;
    model: Model;
    plane: string;
}

export enum ControlMode {
    Translate,
    Rotate,
    Scale
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
