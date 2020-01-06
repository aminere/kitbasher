
import { IKitAsset } from "./Types";

enum EditMode {
    None,
    Select,
    Insert
}

namespace Private {
    export let editMode = EditMode.None;
    export let selectedKit: IKitAsset | null = null;
}

export class State {   
    public static set editMode(mode: EditMode)  {
        Private.editMode = mode;
    }

    public static get editMode() { return Private.editMode; }

    public static set selectedKit(kit: IKitAsset | null) {
        Private.selectedKit = kit;
    }
    public static get selectedKit() { return Private.selectedKit; }
}
