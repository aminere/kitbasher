import { Events } from "./Events";

namespace Private {
    export let renderingActive = false;
}

export class State {
    static get renderingActive() { return Private.renderingActive; }
    static set renderingActive(active: boolean) {
        if (active !== Private.renderingActive) {
            Events.renderingActivated.post(active);
        }
        Private.renderingActive = active;
    }
}
