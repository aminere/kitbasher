
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

    public componentDidMount() {
        Events.engineReady.attach(() => this.populate());
    }

    public render() {
        return (
            <div
                className="fill-parent"
                onClick={() => {
                    State.selectedKit = null;
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

        const assets = (await Promise.all(kitNames.map(k => {
            return SpiderAssets.load(`Assets/Kits/${k}.ObjectDefinition`);
        }))) as unknown[] as IKitAsset[];
        const textures = await Promise.all(assets.map(a => a.thumbnail.loadTextureData()));

        Object.assign(this._mockState, {
            items: textures.reduce(
                (prev, cur, index) => {
                    return prev.concat({
                        id: assets[index].id,
                        name: kitNames[index],
                        image: cur,
                        isSelected: () => State.selectedKit === assets[index],
                        onClicked: () => {
                            State.selectedKit = assets[index];
                            this.forceUpdate();
                        }
                    });
                },
                [] as IKitItemProps[]
            )
        });
        this.forceUpdate();
    }
}
