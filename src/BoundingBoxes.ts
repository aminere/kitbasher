import { Entity } from "../../spider-engine/src/core/Entity";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { AABB } from "../../spider-engine/src/math/AABB";

export class BoundingBoxes {
    public static get(entity: Entity) {
        const bbox = entity.children[0].getComponent(Visual)?.geometry?.getBoundingBox();
        if (bbox) {
            return AABB.fromPool().copy(bbox).transform(entity.children[0].transform.worldMatrix);
        }
        return null;
    }
}
