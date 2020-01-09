
import { IKitAsset } from "./Types";
import { AsyncEvent } from "ts-events";
import { Entity } from "../../spider-engine/src/core/Entity";

export class State {    

    public static get instance() {
        if (!Private.instance) {
            Private.instance = new State();
        }
        return Private.instance;
    }   
    
    public static selectedKitChanged = new AsyncEvent<IKitAsset | null>();

    private _selectedKit: IKitAsset | null = null;
    private _lastUsedKit: IKitAsset | null = null;
    private _selection: Entity[] = [];

    public get selectedKit() { return this._selectedKit; }
    public set selectedKit(kit: IKitAsset | null) {
        if (kit === this._selectedKit) {
            return;
        }
        this._selectedKit = kit;
        if (kit) {
            this._lastUsedKit = kit;
        }
        State.selectedKitChanged.post(kit);
    }

    public get lastUsedKit() { return this._lastUsedKit; }

    public addToSelection(entity: Entity) {
        this._selection.push(entity);
    }

    public removeFromSelection(entity: Entity) {
        const index = this._selection.findIndex(e => e === entity);
        if (index >= 0) {
            this._selection.splice(index, 1);
        }
    }

    public clearSelection() {
        this._selection.length = 0;
    }
}

namespace Private {
    export let instance: State;
}
