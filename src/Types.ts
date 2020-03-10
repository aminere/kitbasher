import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";
import { Model } from "../../spider-engine/src/assets/model/Model";
import { Material } from "../../spider-engine/src/graphics/Material";

export enum Plane {
    X,
    Y,
    Z
}

export type PlaneType = "x" | "y" | "z";
type KitType = "block" | "prop";

export type ContentItemType = IKitAsset | Texture2D | Material;

export interface IKitAsset {
    id: string;
    thumbnail: Texture2D;
    model: Model;
    plane: PlaneType;
    type: KitType;
}

export enum ControlMode {
    Hybrid,
    Rotate    
}

export enum ScalingMode {
    Stretch,
    Tile
}

export enum Axis {
    None,
    X,
    Y,
    Z,
    XY,
    XZ,
    ZY,
    XNeg,
    XPos,
    YNeg,
    YPos,
    ZNeg,
    ZPos
}
