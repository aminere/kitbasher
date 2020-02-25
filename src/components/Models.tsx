
import * as React from "react";
import { Assets } from "../../../spider-engine/src/assets/Assets";
import { ContentItem, IContentItemProps } from "./ContentItem";
import { Events } from "../Events";
import { IKitAsset } from "../Types";
import { State } from "../State";
import { ItemContainer } from "./ItemContainer";
import { Manifest } from "../Manifest";

interface IModelsState {
    items: IContentItemProps[];
}

export class Models extends React.Component {

    // This is done because goldenlayout saves the React state
    // and this is not wanted in this case (state has references to Image elements)
    private _mockState: IModelsState = {
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

        Events.selectedItemChanged.attach(() => this.forceUpdate());
    }

    public render() {
        return (
            <ItemContainer
                items={this._mockState.items}
                onClick={() => {
                    State.instance.selectedKit = null;
                    this.forceUpdate();
                }}
            />
        );
    }

    private async populate() {
        const kits = Manifest.getData().models;
        this._kits = (await Promise.all(kits.map(([section, name]) => {
            return Assets.load(`Assets/Kits/${section}/${name}.ObjectDefinition`);
        }))) as unknown[] as IKitAsset[];
        const thumbnails = await Promise.all(this._kits.map(a => a.thumbnail.loadTextureData()));

        Object.assign(this._mockState, {
            items: thumbnails.reduce(
                (prev, cur, index) => {
                    return prev.concat({
                        id: this._kits[index].id,
                        name: kits[index][1],
                        image: cur,
                        isSelected: () => State.instance.selectedKit === this._kits[index],
                        onClicked: () => State.instance.selectedKit = this._kits[index]
                    });
                },
                [] as IContentItemProps[]
            )
        });
        this.forceUpdate();
        Events.assetBrowserReady.post();
    }
}
