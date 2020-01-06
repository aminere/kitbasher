
import { Events } from "./Events";
import { Engine, EngineHandlersInternal } from "../../spider-engine/src/core/Engine";
import { Scenes } from "../../spider-engine/src/core/Scenes";
import { Assets } from "../../spider-engine/src/assets/Assets";
import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";
import { StaticMeshAsset } from "../../spider-engine/src/assets/StaticMeshAsset";
import { Entities } from "../../spider-engine/src/core/Entities";
import { Transform } from "../../spider-engine/src/core/Transform";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Color } from "../../spider-engine/src/graphics/Color";
import { StaticMesh, defaultAssets } from "../../spider-engine/src/spider-engine";

interface IKit {
    thumbnail: Texture2D;
    mesh: StaticMeshAsset;
}

namespace Private {

    export let canvasHasFocus: () => boolean;
    function checkCanvasStatus() {
        if (!canvasHasFocus()) {
            requestAnimationFrame(checkCanvasStatus);
            return;
        }

        EngineHandlersInternal.onWindowResized();
        // This is done here because loadGraphicObjects() fails if canvas doesn't have the focus
        Scenes.load("Assets/Startup.Scene");
        // .then(() => Assets.load("Assets/Kits/cube.ObjectDefinition"))
        // .then((_kit: unknown) => {
        //     const kit = _kit as IKit;
        //     // console.log(kit.thumbnail);
        //     // console.log(kit.mesh);
        //     Entities.create()
        //         .setComponent(Transform)
        //         .setComponent(Visual, {
        //             geometry: new StaticMesh({ mesh: kit.mesh }),
        //             material: new Material({
        //                 shader: defaultAssets.shaders.phong,
        //                 shaderParams: {
        //                     diffuse: Color.white,
        //                     ambient: new Color(.1, .1, .2)
        //                 }
        //             })
        //         });
        // });
    }

    Events.canvasMounted.attach(canvas => {
        Engine.create({
            container: canvas,
            customTypes: [
            ]
        })
            .then(() => {
                Events.engineReady.post();
                checkCanvasStatus();
            })
            .catch(error => {
                // tslint:disable-next-line
                console.error(error);
            });
    });
}

export class Controller {

    public static set canvasFocusGetter(hasFocus: () => boolean) {
        Private.canvasHasFocus = hasFocus;
    }

    public static onResize() {
        EngineHandlersInternal.onWindowResized();
    }

    public static onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {

    }

    public static onMouseMove(e: React.MouseEvent<HTMLElement>, localX: number, localY: number) {

    }

    public static onMouseUp(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {

    }

    public static onMouseLeave(e: React.MouseEvent<HTMLCanvasElement>, localX: number, localY: number) {

    }
}
