
import { Events } from "./Events";
import { Engine, EngineHandlersInternal } from "../../spider-engine/src/core/Engine";
namespace Private {

    export let canvasHasFocus: () => boolean;
    function checkCanvasStatus () {
        if (canvasHasFocus()) {
            EngineHandlersInternal.onWindowResized();
            // TODO load first scene!
            return;
        }
        requestAnimationFrame(checkCanvasStatus);
    }

    Events.canvasMounted.attach(canvas => {
        Engine.create({
            container: canvas,
            customTypes: [
            ]
        })
        .then(() => {
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
