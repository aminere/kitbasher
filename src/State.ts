
import { IKitAsset, ControlMode, Grid } from "./Types";
import { Entity } from "../../spider-engine/src/core/Entity";
import { Events } from "./Events";
import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";

namespace Private {
    export const path = "kitbasher-state.json";
}

export class State {    

    public static get instance() {
        if (!Private.instance) {
            Private.instance = new State();
        }
        return Private.instance;
    }    
    
    private _selectedKit: IKitAsset | null = null;
    private _selectedKitInstance: Entity | null = null;
    private _lastUsedKit: IKitAsset | null = null;
    private _selection: Entity[] = [];
    private _controlMode = ControlMode.Translate;
    private _grid = Grid.Y;
    private _gridStep = 1;
    private _angleStep = 45;

    public get selectedKit() { return this._selectedKit; }
    public set selectedKit(kit: IKitAsset | null) {
        if (kit === this._selectedKit) {
            return;
        }
        this._selectedKit = kit;
        if (kit) {
            this._lastUsedKit = kit;
        }

        if (this._selection.length) {
            this.clearSelection();
        }

        Events.selectedKitChanged.post(kit);
    }

    public get selectedKitInstance() { return this._selectedKitInstance; }
    public set selectedKitInstance(e: Entity | null) {
        this._selectedKitInstance = e;
    }

    public get lastUsedKit() { return this._lastUsedKit; }

    public get selection() { return this._selection; }

    public get controlMode() { return this._controlMode; }
    public set controlMode(mode: ControlMode) {
        this._controlMode = mode;
    }

    public get grid() { return this._grid; }
    public set grid(grid: Grid) {
        this._grid = grid;
        this.save();
        Events.gridChanged.post();
    }

    public get gridStep() { return this._gridStep; }
    public set gridStep(step: number) {
        this._gridStep = step;
        this.save();
        Events.gridChanged.post();        
    }

    public get angleStep() { return this._angleStep; }
    public set angleStep(step: Grid) {
        this._angleStep = step;
        this.save();
    }

    public setSelection(entity: Entity) {
        this._selection = [entity];
        Events.selectedEntityChanged.post(this._selection);
    }

    public addToSelection(entity: Entity) {
        this._selection.push(entity);
        Events.selectedEntityChanged.post(this._selection);
    }

    public removeFromSelection(entity: Entity) {
        const index = this._selection.findIndex(e => e === entity);
        if (index >= 0) {
            this._selection.splice(index, 1);
            Events.selectedEntityChanged.post(this._selection);
        }
    }

    public clearSelection() {
        if (this._selection.length === 0) {
            return;
        }
        this._selection.length = 0;
        Events.selectedEntityChanged.post(this._selection);
    }

    public load() {
        return new Promise(resolve => {
            IndexedDb.read("files", Private.path)
            .then(data => {
                Object.entries(JSON.parse(data)).forEach(([name, value]) => {
                    Object.assign(this, { [name]: value });
                });
                resolve();
            })
            .catch(resolve);
        });
    }
    
    public save() {
        const data = JSON.stringify(
            [
                "_grid",
                "_gridStep",
                "_angleStep"
            ].reduce((prev, cur) => {
                return { ...prev, ...{ [cur]: this[cur] } };
            }, {}),
            null,
            2
        );
        return IndexedDb.write("files", Private.path, data);
    }
}

namespace Private {
    export let instance: State;
}
