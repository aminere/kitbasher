import { Component, Vector3 } from "../../../spider-engine/src/spider-engine";

export class Tiling extends Component {
    public set geometric(geometric: boolean) { this._geometric = geometric; }
    public get geometric() { return this._geometric; }

    public get size() { return this._size; }
    public set size(size: Vector3) { this._size.copy(size); }

    private _geometric = false;
    private _size = new Vector3(1, 1, 1);
}
