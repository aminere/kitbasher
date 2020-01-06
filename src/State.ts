
import { IKitAsset } from "./Types";
import { AsyncEvent } from "ts-events";

export enum EditMode {
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

    public static editModeChanged = new AsyncEvent<EditMode>();
    public static selectedKitChanged = new AsyncEvent<IKitAsset | null>();

    public get editMode() { return this._editMode; }
    public set editMode(mode: EditMode) {
        this._editMode = mode;
        if (mode === EditMode.None) {
            if (this.selectedKit) {
                this.selectedKit = null;
            }
        }
        State.editModeChanged.post(mode);
    }

    public get selectedKit() { return this._selectedKit; }
    public set selectedKit(kit: IKitAsset | null) {
        this._selectedKit = kit;
        if (kit) {
            if (this.editMode !== EditMode.Insert) {
                this.editMode = EditMode.Insert;
            }
        } else {
            if (this.editMode === EditMode.Insert) {
                this.editMode = EditMode.None;
            }
        }
        State.selectedKitChanged.post(kit);
    }

    private _editMode = EditMode.None;
    private _selectedKit: IKitAsset | null = null;
}

namespace Private {
    export let instance: State;
}
