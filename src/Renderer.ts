import { Camera } from "../../spider-engine/src/graphics/Camera";
import { Assets } from "../../spider-engine/src/assets/Assets";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Asset } from "../../spider-engine/src/assets/Asset";
import { VertexBuffer } from "../../spider-engine/src/graphics/VertexBuffer";
import { Vector3 } from "../../spider-engine/src/math/Vector3";
import { WebGL } from "../../spider-engine/src/graphics/WebGL";
import { GraphicUtils } from "../../spider-engine/src/graphics/GraphicUtils";
import { Color } from "../../spider-engine/src/graphics/Color";
import { GeometryRenderer } from "../../spider-engine/src/graphics/geometry/GeometryRenderer";
import { EntityController } from "./EntityController";
import { Events } from "./Events";
import { State } from "./State";
import { Plane } from "./Types";

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

    let grid: VertexBuffer | null = null;
    export function invalidateGrid() {
        if (grid) {
            grid.unload(WebGL.context);
        }
        grid = null;
    }

    export const getGrid = () => {
        if (!grid) {
            grid = new VertexBuffer();
            const gridVertices: number[] = [];
            const gridSize = 100;
            const { grid: gridType, gridStep } = State.instance;
            const horizGridMask = new Vector3(1, 1, 1);
            const vertGridMask = new Vector3(1, 1, 1);
            const lineStartHoriz = (() => {
                if (gridType === Plane.X) {
                    horizGridMask.set(0, 1, 0);
                    vertGridMask.set(0, 0, 1);
                    return new Vector3(0, -gridSize, -gridSize);
                } else if (gridType === Plane.Y) {
                    horizGridMask.set(1, 0, 0);
                    vertGridMask.set(0, 0, 1);
                    return new Vector3(-gridSize, 0, -gridSize);
                } else {
                    horizGridMask.set(1, 0, 0);
                    vertGridMask.set(0, 1, 0);
                    return new Vector3(-gridSize, -gridSize, 0);
                }
            })();
            const lineStartVert = new Vector3().copy(lineStartHoriz);            
            for (let i = 0; i <= gridSize * 2; i += gridStep) {
                gridVertices.push(lineStartHoriz.x); 
                gridVertices.push(lineStartHoriz.y); 
                gridVertices.push(lineStartHoriz.z);

                gridVertices.push(lineStartHoriz.x + (gridSize * 2) * horizGridMask.x);
                gridVertices.push(lineStartHoriz.y + (gridSize * 2) * horizGridMask.y); 
                gridVertices.push(lineStartHoriz.z + (gridSize * 2) * horizGridMask.z);

                gridVertices.push(lineStartVert.x); 
                gridVertices.push(lineStartVert.y); 
                gridVertices.push(lineStartVert.z);

                gridVertices.push(lineStartVert.x + (gridSize * 2) * vertGridMask.x); 
                gridVertices.push(lineStartVert.y + (gridSize * 2) * vertGridMask.y); 
                gridVertices.push(lineStartVert.z + (gridSize * 2) * vertGridMask.z);

                lineStartHoriz.set(
                    lineStartHoriz.x + vertGridMask.x * gridStep,
                    lineStartHoriz.y + vertGridMask.y * gridStep,
                    lineStartHoriz.z + vertGridMask.z * gridStep,
                );
                lineStartVert.set(
                    lineStartVert.x + horizGridMask.x * gridStep,
                    lineStartVert.y + horizGridMask.y * gridStep,
                    lineStartVert.z + horizGridMask.z * gridStep,
                );
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
        )
        .then(() => GeometryRenderer.init())
        .then(() => {
            Events.gridChanged.attach(() => {
                Private.invalidateGrid();
            });
        });
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

    public static postRender(camera: Camera) {
        if (!GeometryRenderer.begin()) {
            return;
        }

        GeometryRenderer.applyProjectionMatrix(camera.getProjectionMatrix());
        GeometryRenderer.setViewMatrix(camera.getViewMatrix());

        EntityController.render(camera);
    }
}
