
import { StaticMeshAsset } from "../../spider-engine/src/assets/StaticMeshAsset";
import { Transform, Visual, StaticMesh, Interfaces, Assets, Vector3 } from "../../spider-engine/src/spider-engine";
import { Entity } from "../../spider-engine/src/core/Entity";
import { BoundingBoxes } from "./BoundingBoxes";
import { AABB } from "../../spider-engine/src/math/AABB";

export class Tiling {

    public static hasTiling(entity: Entity) {
        const child = entity.children[0];
        const v = child.getComponent(Visual) as Visual;
        const mesh = (v.geometry as StaticMesh).mesh as StaticMeshAsset;
        return mesh.templatePath?.includes("_Tiled_");
    }

    public static getOriginalMesh(tiled: StaticMeshAsset): Promise<StaticMeshAsset> {
        const path = tiled.templatePath as string;
        const i = path.indexOf("_Tiled_");
        const originalPath = `${path.slice(0, i)}.StaticMeshAsset`;
        const obj =  Interfaces.objectManager.getObject(originalPath) as StaticMeshAsset;
        if (obj) {
            return Promise.resolve(obj);
        }
        return Assets.load(originalPath).then(o => o as StaticMeshAsset);
    }

    public static tiledCoord(coord: number) {
        return Math.max(1, Math.round(Math.abs(coord)));
    }

    public static async applyTiling(entity: Entity) {
        const meshEntity = entity.children[0];
        const mesh = meshEntity.getComponent(Visual)?.geometry as StaticMesh;
        const asset = mesh.mesh as StaticMeshAsset;
        const original = await Tiling.getOriginalMesh(asset);
        const { vertexBuffer } = original;
        const { worldScale } = entity.transform;
        const boundingBox = BoundingBoxes.getLocal(entity) as AABB;        
        const [x, y, z] = worldScale.asArray().map(Tiling.tiledCoord);
        const size = Vector3.fromPool().substractVectors(boundingBox.max, boundingBox.min);
        const tiledVB = vertexBuffer.copy();
        const position = vertexBuffer.attributes.position as number[];
        const uv = vertexBuffer.attributes.uv as number[];
        const normal = vertexBuffer.attributes.normal as number[];
        const positions: number[] = [];
        let uvs: number[] = [];
        let normals: number[] = [];
        // const offset = new Vector3();
        const xOffset = Vector3.fromPool();
        const yOffset = Vector3.fromPool();
        const zOffset = Vector3.fromPool();
        const dummy = Vector3.fromPool();
        for (let i = 0; i < y; ++i) {            
            for (let j = 0; j < z; ++j) {
                for (let k = 0; k < x; ++k) {
                    
                    for (let l = 0; l < position.length; l += 3) {
                        xOffset.copy(meshEntity.transform.right).multiply(k * size.x);
                        yOffset.copy(meshEntity.transform.up).multiply(i * size.y);
                        zOffset.copy(meshEntity.transform.forward).multiply(j * size.z);
                        dummy
                            .set(position[l + 0], position[l + 1], position[l + 2])
                            .add(xOffset)
                            .add(yOffset)
                            .add(zOffset);
                        
                        positions.push(dummy.x / x);
                        positions.push(dummy.y / y);
                        positions.push(dummy.z / z);
                    }
                    uvs = uvs.concat(uv);
                    normals = normals.concat(normal);
                    // offset.x += size.x;                    
                }
                // offset.x = 0;
                // offset.z += size.z;
            }
            // offset.x = 0;
            // offset.y += size.y;
            // offset.z = 0;
        }
        tiledVB.setAttribute("position", positions);
        tiledVB.setAttribute("uv", uvs);
        tiledVB.setAttribute("normal", normals);
        asset.vertexBuffer = tiledVB;
    }
}
