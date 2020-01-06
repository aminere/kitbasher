import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";
import { StaticMeshAsset } from "../../spider-engine/src/assets/StaticMeshAsset";

export interface IKitAsset {
    id: string;
    thumbnail: Texture2D;
    mesh: StaticMeshAsset;
}
