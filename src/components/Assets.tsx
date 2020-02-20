
import * as React from "react";
import { Assets as SpiderAssets } from "../../../spider-engine/src/assets/Assets";
import { KitItem, IKitItemProps } from "./KitItem";
import { Events } from "../Events";
import { IKitAsset } from "../Types";
import { State } from "../State";

interface IAssetsState {
    items: IKitItemProps[];
}

export class Assets extends React.Component {

    // This is done because goldenlayout saves the React state
    // and this is not wanted in this case (state has references to Image elements)
    private _mockState: IAssetsState = {
        items: []
    };

    private _kits!: IKitAsset[];

    public componentDidMount() {
        Events.engineReady.attach(() => this.populate());

        Events.insertClicked.attach(() => {
            if (!State.instance.selectedKit) {
                State.instance.selectedKit = State.instance.lastUsedKit || this._kits[0];
            }
        });

        State.selectedKitChanged.attach(kit => this.forceUpdate());
    }

    public render() {
        return (
            <div
                className="fill-parent"
                onClick={() => {
                    State.instance.selectedKit = null;
                    this.forceUpdate();
                }}
            >
                {this._mockState.items.map(i => (
                    <KitItem 
                        key={i.id}                         
                        {...i}
                    />
                ))}
            </div>
        );
    }

    private async populate() {
        const kits: Array<[string, string]> = [
            ["Primitives", "cube"],
            ["Primitives", "sphere"],
            ["Interior", "ground"],
            ["Interior", "roof"],
            ["Interior", "wall"],
            ["Interior", "wall-door"],
            ["Interior", "wall-window"],
            ["Props", "table"],
            ["Props", "monitor"]
        ];

        this._kits = (await Promise.all(kits.map(([section, name]) => {
            return SpiderAssets.load(`Assets/Kits/${section}/${name}.ObjectDefinition`);
        }))) as unknown[] as IKitAsset[];
        const textures = await Promise.all(this._kits.map(a => a.thumbnail.loadTextureData()));

        Object.assign(this._mockState, {
            items: textures.reduce(
                (prev, cur, index) => {
                    return prev.concat({
                        id: this._kits[index].id,
                        name: kits[index][1],
                        image: cur,
                        isSelected: () => State.instance.selectedKit === this._kits[index],
                        onClicked: () => State.instance.selectedKit = this._kits[index]
                    });
                },
                [] as IKitItemProps[]
            )
        });
        this.forceUpdate();
        Events.assetBrowserReady.post();
    }
}
