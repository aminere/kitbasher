import { Events } from "./Events";

namespace Private {    
    export let engineReady = false;
    export let renderingActive = false;
}

export class State {

    static get engineReady() { return Private.engineReady; }
    static set engineReady(ready: boolean) {        
        if (ready) {
            Events.engineReady.post();
        }
        Private.engineReady = ready;
    }

    static get renderingActive() { return Private.renderingActive; }
    static set renderingActive(active: boolean) {
        if (active !== Private.renderingActive) {
            Events.renderingActivated.post(active);
        }
        Private.renderingActive = active;
    }
}
