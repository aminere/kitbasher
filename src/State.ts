
import { IKitAsset, ControlMode, Plane, ContentItemType } from "./Types";
import { Entity } from "../../spider-engine/src/core/Entity";
import { Events } from "./Events";
import { Texture2D } from "../../spider-engine/src/graphics/Texture2D";
import { Utils } from "./Utils";
import { Material } from "../../spider-engine/src/graphics/Material";
import { Interfaces } from "../../spider-engine/src/spider-engine";

interface IPersistentState {
    grid: Plane;
    gridStep: number;
    angleStep: number;
    snapping: boolean;
}

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
    
    private _selectedItem: ContentItemType | null = null;

    private _selection: Entity[] = [];
    private _controlMode = ControlMode.Hybrid;
    private _altPressed = false;

    private _data: IPersistentState = {
        grid: Plane.Y,
        gridStep: 1,
        angleStep: 45,
        snapping: true
    };

    public get selectedKit() {
        if (this._selectedItem && Utils.isModel(this._selectedItem)) {
            return this._selectedItem as IKitAsset;
        }
        return null;
    }
    public set selectedKit(item: IKitAsset | null) {
        if (item === this._selectedItem) {
            return;
        }
        this._selectedItem = item;
        if (this._selection.length) {
            this.clearSelection();
        }
        Events.selectedItemChanged.post(item);
    }

    public get selectedTexture() {
        if (this._selectedItem && this._selectedItem.constructor.name === "Texture2D") {
            return this._selectedItem as Texture2D;
        }
        return null;
    }
    public set selectedTexture(item: Texture2D | null) {
        if (item === this._selectedItem) {
            return;
        }
        this._selectedItem = item;
        Events.selectedItemChanged.post(item);
    }

    public get selectedMaterial() {
        if (this._selectedItem && this._selectedItem.constructor.name === "Material") {
            return this._selectedItem as Material;
        }
        return null;
    }
    public set selectedMaterial(item: Material | null) {
        if (item === this._selectedItem) {
            return;
        }
        this._selectedItem = item;
        Events.selectedItemChanged.post(item);
    }

    public get selection() { return this._selection; }

    public get controlMode() { return this._controlMode; }
    public set controlMode(mode: ControlMode) { this._controlMode = mode; }

    public get altPressed() { return this._altPressed; }
    public set altPressed(pressed: boolean) { this._altPressed = pressed; }

    public get grid() { return this._data.grid; }
    public set grid(grid: Plane) {
        this._data.grid = grid;
        this.save();
        Events.gridChanged.post();
    }

    public get gridStep() { return this._data.gridStep; }
    public set gridStep(step: number) {
        this._data.gridStep = step;
        this.save();
        Events.gridChanged.post();        
    }

    public get angleStep() { return this._data.angleStep; }
    public set angleStep(step: number) {
        this._data.angleStep = step;
        this.save();
    }

    public get snapping() { return this._data.snapping; }
    public set snapping(snapping: boolean) { 
        this._data.snapping = snapping;
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
        return Interfaces.file.read(Private.path)
            .then(data => {
                this._data = JSON.parse(data);
                if (process.env.PLATFORM === "web") {
                    this.save();
                }
            })
            .catch(() => this.save());
    }

    public save() {
        return Interfaces.file.write(Private.path, JSON.stringify(this._data));
    }
}

namespace Private {
    export let instance: State;
}
