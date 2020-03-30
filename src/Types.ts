import { Model } from "../../spider-engine/src/assets/model/Model";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Texture2D } from "../../spider-engine/src/graphics/texture/Texture2D";

export enum Plane {
    X,
    Y,
    Z
}

export type PlaneType = "x" | "y" | "z";
export type TilingType = "texture" | "geometry" | "none";
type KitType = "block" | "prop";

export type ContentItemType = IKitAsset | Texture2D | Material;

export interface IKitAsset {
    id: string;
    thumbnail: Texture2D;
    model: Model;
    plane: PlaneType;
    type: KitType;
    tiling: TilingType;
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
