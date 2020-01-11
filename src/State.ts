
import { IKitAsset } from "./Types";
import { AsyncEvent } from "ts-events";
import { Entity } from "../../spider-engine/src/core/Entity";

export enum ControlMode {
    Translate,
    Rotate,
    Scale
}

export class State {    

    public static get instance() {
        if (!Private.instance) {
            Private.instance = new State();
        }
        return Private.instance;
    }   
    
    public static selectedKitChanged = new AsyncEvent<IKitAsset | null>();
    public static entitySelectionChanged = new AsyncEvent<Entity[]>();

    private _selectedKit: IKitAsset | null = null;
    private _lastUsedKit: IKitAsset | null = null;
    private _selection: Entity[] = [];
    private _controlMode = ControlMode.Translate;

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

    public get selection() { return this._selection; }
    public get controlMode() { return this._controlMode; }

    public setSelection(entity: Entity) {
        this._selection = [entity];
        State.entitySelectionChanged.post(this._selection);
    }

    public addToSelection(entity: Entity) {
        this._selection.push(entity);
        State.entitySelectionChanged.post(this._selection);
    }

    public removeFromSelection(entity: Entity) {
        const index = this._selection.findIndex(e => e === entity);
        if (index >= 0) {
            this._selection.splice(index, 1);
            State.entitySelectionChanged.post(this._selection);
        }
    }

    public clearSelection() {
        if (this._selection.length === 0) {
            return;
        }
        this._selection.length = 0;
        State.entitySelectionChanged.post(this._selection);
    }
}

namespace Private {
    export let instance: State;
}
