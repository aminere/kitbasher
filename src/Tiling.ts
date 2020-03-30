
import { Transform, Visual, Vector3, Quaternion, StaticMesh, Interfaces } from "../../spider-engine/src/spider-engine";
import { Entity } from "../../spider-engine/src/core/Entity";
import { BoundingBoxes } from "./BoundingBoxes";
import { AABB } from "../../spider-engine/src/math/AABB";
import { StaticMeshAsset } from "../../spider-engine/src/assets/StaticMeshAsset";
import { TilingType } from "./Types";

export class Tiling {

    public static getTiling(entity: Entity): TilingType {
        const child = entity.children[0];
        const v = child.getComponent(Visual) as Visual;
        const mesh = (v.geometry as StaticMesh).mesh as StaticMeshAsset;
        const path = mesh.templatePath as string;
        const [m, tiling] = path.match(/_Tiling_([a-z]+)/) ?? ["none", "none"];
        return tiling as TilingType;
    }

    // public static hasTiling(entity: Entity) {
    //     // return entity.children[0].name.includes("_Tiles_");
    //     const child = entity.children[0];
    //     const v = child.getComponent(Visual) as Visual;
    //     const mesh = (v.geometry as StaticMesh).mesh as StaticMeshAsset;
    //     return mesh.templatePath?.includes("_Tiled_");
    // }

    // public static getOriginalMesh(tiled: StaticMeshAsset): Promise<StaticMeshAsset> {
    //     const path = tiled.templatePath as string;
    //     const i = path.indexOf("_Tiled_");
    //     const originalPath = `${path.slice(0, i)}.StaticMeshAsset`;
    //     const obj =  Interfaces.objectManager.getObject(originalPath) as StaticMeshAsset;
    //     if (obj) {
    //         return Promise.resolve(obj);
    //     }
    //     return Assets.load(originalPath).then(o => o as StaticMeshAsset);
    // }

    public static async createTiledMesh(entity: Entity, tiling: TilingType) {
        const child = entity.children[0];
        const v = child.getComponent(Visual) as Visual;
        const mesh = (v.geometry as StaticMesh).mesh as StaticMeshAsset;
        const unique = mesh.copy() as StaticMeshAsset;
        unique.isPersistent = true;
        const n = `${mesh.name}_Tiling_${tiling}_${child.id}`;
        unique.templatePath = unique.templatePath?.replace(mesh.name, n);
        await Interfaces.file.write(unique.templatePath as string, JSON.stringify(unique.serialize()));
        (v.geometry as StaticMesh).mesh = unique;
    }

    public static async tryDeleteTiledMesh(entity: Entity) {
        if (Tiling.getTiling(entity) === "none") {
            return null;
        }
        const mesh = ((entity.children[0].getComponent(Visual)?.geometry as StaticMesh).mesh as StaticMeshAsset);
        Interfaces.objectManager.deleteObject(mesh);
        const path = mesh.templatePath as string;
        await Interfaces.file.delete(path);
        const i = path.indexOf("_Tiling_");
        const originalPath = `${path.slice(0, i)}.StaticMeshAsset`; 
        return originalPath;
    }

    public static tiledCoord(coord: number) {
        return Math.max(1, Math.round(Math.abs(coord)));
    }

    public static applyTiling(entity: Entity) {
        const tiles = entity.children[0];
        const { scale } = entity.transform;
        tiles.transform.scale = new Vector3(1, 1, 1).divideVector(scale);
        const [x, y, z] = scale.asArray().map(Tiling.tiledCoord);
        const bbox = BoundingBoxes.getLocal(entity) as AABB;   
        const size = Vector3.fromPool().substractVectors(bbox.max, bbox.min);
        tiles.removeAllChildren();
        const offsetX = Vector3.fromPool();
        const offsetY = Vector3.fromPool();
        const offsetZ = Vector3.fromPool();
        const offset = Vector3.fromPool();
        for (let i = 0; i < y; ++i) {
            for (let j = 0; j < z; ++j) {
                for (let k = 0; k < x; ++k) {
                    offsetX.copy(Vector3.right).multiply(k * size.x);
                    offsetY.copy(Vector3.up).multiply(i * size.y);
                    offsetZ.copy(Vector3.forward).multiply(j * size.z);
                    const tile = tiles.copy();
                    tile.updateComponent(Visual, { active: true });
                    tile.updateComponent(Transform, {
                        scale: Vector3.one,
                        position: offset.copy(Vector3.zero)
                            .add(offsetX)
                            .add(offsetY)
                            .add(offsetZ),
                        rotation: Quaternion.identity
                    });
                    tiles.addChild(tile);
                }
            }
        }

        // const meshEntity = entity.children[0];
        // const mesh = meshEntity.getComponent(Visual)?.geometry as StaticMesh;
        // const asset = mesh.mesh as StaticMeshAsset;
        // const original = await Tiling.getOriginalMesh(asset);
        // const { vertexBuffer } = original;
        // const { worldScale } = entity.transform;
        // const boundingBox = BoundingBoxes.getLocal(entity) as AABB;        
        // const [x, y, z] = worldScale.asArray().map(Tiling.tiledCoord);
        // const size = Vector3.fromPool().substractVectors(boundingBox.max, boundingBox.min);
        // const tiledVB = vertexBuffer.copy();
        // const position = vertexBuffer.attributes.position as number[];
        // const uv = vertexBuffer.attributes.uv as number[];
        // const normal = vertexBuffer.attributes.normal as number[];
        // const positions: number[] = [];
        // let uvs: number[] = [];
        // let normals: number[] = [];
        // // const offset = new Vector3();
        // const xOffset = Vector3.fromPool();
        // const yOffset = Vector3.fromPool();
        // const zOffset = Vector3.fromPool();
        // const dummy = Vector3.fromPool();
        // for (let i = 0; i < y; ++i) {            
        //     for (let j = 0; j < z; ++j) {
        //         for (let k = 0; k < x; ++k) {
                    
        //             for (let l = 0; l < position.length; l += 3) {
        //                 xOffset.copy(meshEntity.transform.right).multiply(k * size.x);
        //                 yOffset.copy(meshEntity.transform.up).multiply(i * size.y);
        //                 zOffset.copy(meshEntity.transform.forward).multiply(j * size.z);
        //                 dummy
        //                     .set(position[l + 0], position[l + 1], position[l + 2])
        //                     .add(xOffset)
        //                     .add(yOffset)
        //                     .add(zOffset);
                        
        //                 positions.push(dummy.x / x);
        //                 positions.push(dummy.y / y);
        //                 positions.push(dummy.z / z);
        //             }
        //             uvs = uvs.concat(uv);
        //             normals = normals.concat(normal);
        //             // offset.x += size.x;                    
        //         }
        //         // offset.x = 0;
        //         // offset.z += size.z;
        //     }
        //     // offset.x = 0;
        //     // offset.y += size.y;
        //     // offset.z = 0;
        // }
        // tiledVB.setAttribute("position", positions);
        // tiledVB.setAttribute("uv", uvs);
        // tiledVB.setAttribute("normal", normals);
        // asset.vertexBuffer = tiledVB;
    }
}
