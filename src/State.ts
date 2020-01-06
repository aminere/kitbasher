
import { IKitAsset } from "./Types";

enum EditMode {
    None,
    Select,
    Insert
}

export class State {    
    public static get instance() {
        if (!Private.instance) {
            Private.instance = new State();
        }
        return Private.instance;
    }   

    public editMode = EditMode.None;
    public selectedKit: IKitAsset | null = null;    
}

namespace Private {
    export let instance: State;
}
