import { Camera } from "../../spider-engine/src/graphics/Camera";
import { Assets } from "../../spider-engine/src/assets/Assets";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Asset } from "../../spider-engine/src/assets/Asset";
import { VertexBuffer } from "../../spider-engine/src/graphics/VertexBuffer";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { WebGL } from "../../spider-engine/src/graphics/WebGL";
import { GraphicUtils } from "../../spider-engine/src/graphics/GraphicUtils";
import { Color } from "../../spider-engine/src/graphics/Color";

namespace Private {
    export let debugMaterial: Material;

    export const assets: Array<{
        path: string;
        set: (asset: Asset) => void
    }> = [
            {
                path: "Assets/Editor/DebugMaterial.Material",
                set: asset => debugMaterial = asset as Material
            }
        ];

    let grid: VertexBuffer;
    export const getGrid = () => {
        if (!grid) {
            grid = new VertexBuffer();
            const gridVertices: number[] = [];
            const gridSize = 15;
            const lineStartHoriz = new Vector3(-gridSize, 0, -gridSize);
            const lineStartVert = new Vector3().copy(lineStartHoriz);
            for (let i = 0; i <= gridSize * 2; ++i) {
                gridVertices.push(lineStartHoriz.x); 
                gridVertices.push(lineStartHoriz.y); 
                gridVertices.push(lineStartHoriz.z);

                gridVertices.push(lineStartHoriz.x + gridSize * 2); 
                gridVertices.push(lineStartHoriz.y); 
                gridVertices.push(lineStartHoriz.z);

                gridVertices.push(lineStartVert.x); 
                gridVertices.push(lineStartVert.y); 
                gridVertices.push(lineStartVert.z);

                gridVertices.push(lineStartVert.x); 
                gridVertices.push(lineStartVert.y); 
                gridVertices.push(lineStartVert.z + gridSize * 2);                
                lineStartHoriz.z++;
                lineStartVert.x++;
            }
            grid.setAttribute("position", gridVertices);
            grid.primitiveType = "LINES";
        }
        return grid;
    };
}

export class Renderer {

    public static load() {
        return Promise.all(
            Private.assets.map(a => {
                return Assets.load(a.path)
                    .then(asset => a.set(asset));
            })
        );
    }

    public static preRender(camera: Camera) {
        WebGL.context.depthMask(true);
        const { debugMaterial } = Private;
        debugMaterial.queueParameter("projectionMatrix", camera.getProjectionMatrix());
        debugMaterial.queueParameter("modelViewMatrix", camera.getViewMatrix());
        debugMaterial.queueParameter("ambient", Color.white);
        if (debugMaterial.begin() && debugMaterial.shader) {
            GraphicUtils.drawVertexBuffer(WebGL.context, Private.getGrid(), debugMaterial.shader);
        }
    }

    // tslint:disable-next-line
    public static postRender(camera: Camera) {}
}
