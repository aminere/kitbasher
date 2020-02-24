
import { IKitAsset, ControlMode, Plane, SelectedItemType } from "./Types";
import { Entity } from "../../spider-engine/src/core/Entity";
import { Events } from "./Events";
import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";
import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";

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
    
    private _selectedItem: SelectedItemType | null = null;

    private _lastUsedKit: IKitAsset | null = null;
    private _selection: Entity[] = [];
    private _controlMode = ControlMode.Translate;
    private _altPressed = false;
    private _grid = Plane.Y;
    private _gridStep = 1;
    private _angleStep = 45;
    private _snapping = true;

    public get selectedKit() {
        if (this._selectedItem && this._selectedItem.constructor.name === "ObjectDefinition") {
            return this._selectedItem as IKitAsset;
        }
        return null;
    }
    public set selectedKit(kit: IKitAsset | null) {
        if (kit === this._selectedItem) {
            return;
        }
        this._selectedItem = kit;
        if (kit) {
            this._lastUsedKit = kit;
        }

        if (this._selection.length) {
            this.clearSelection();
        }

        Events.selectedKitChanged.post(kit);
    }

    public get selectedTexture() {
        if (this._selectedItem && this._selectedItem.constructor.name === "Texture2D") {
            return this._selectedItem as Texture2D;
        }
        return null;
    }
    public set selectedTexture(texture: Texture2D | null) {
        if (texture === this._selectedItem) {
            return;
        }
        this._selectedItem = texture;
    }

    public get lastUsedKit() { return this._lastUsedKit; }

    public get selection() { return this._selection; }

    public get controlMode() { return this._controlMode; }
    public set controlMode(mode: ControlMode) { this._controlMode = mode; }

    public get altPressed() { return this._altPressed; }
    public set altPressed(pressed: boolean) { this._altPressed = pressed; }

    public get grid() { return this._grid; }
    public set grid(grid: Plane) {
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
    public set angleStep(step: number) {
        this._angleStep = step;
        this.save();
    }

    public get snapping() { return this._snapping; }
    public set snapping(snapping: boolean) { 
        this._snapping = snapping;
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
                "_angleStep",
                "_snapping"
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
