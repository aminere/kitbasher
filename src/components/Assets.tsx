
import * as React from "react";
import { Assets as SpiderAssets } from "../../../spider-engine/src/assets/Assets";
import { KitItem, IKitItemProps } from "./KitItem";
import { Events } from "../Events";
import { IKitAsset } from "../Types";
import { State, EditMode } from "../State";

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

        State.editModeChanged.attach(mode => {
            if (mode === EditMode.Insert) {
                if (!State.instance.selectedKit) {
                    State.instance.selectedKit = this._kits[0];
                }
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
        const kitNames = [
            "cube",
            "sphere"
        ];

        this._kits = (await Promise.all(kitNames.map(k => {
            return SpiderAssets.load(`Assets/Kits/${k}.ObjectDefinition`);
        }))) as unknown[] as IKitAsset[];
        const textures = await Promise.all(this._kits.map(a => a.thumbnail.loadTextureData()));

        Object.assign(this._mockState, {
            items: textures.reduce(
                (prev, cur, index) => {
                    return prev.concat({
                        id: this._kits[index].id,
                        name: kitNames[index],
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
