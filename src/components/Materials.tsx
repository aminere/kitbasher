
import * as React from "react";
import { IContentItemProps } from "./ContentItem";
import { Material } from "../../../spider-engine/src/graphics/Material";
import { Events } from "../Events";
import { ItemContainer } from "./ItemContainer";
import { State } from "../State";
import { Assets } from "../../../spider-engine/src/assets/Assets";
import { Texture2D } from "../../../spider-engine/src/graphics/Texture2D";
import { Manifest } from "../Manifest";

interface IMaterialsState {
    items: IContentItemProps[];
}

export class Materials extends React.Component {
    private _mockState: IMaterialsState = {
        items: []
    };

    private _items!: Material[];

    public componentDidMount() {
        Events.engineReady.attach(() => this.populate());
        Events.selectedItemChanged.attach(() => this.forceUpdate());
    }

    public render() {
        return (
            <ItemContainer
                items={this._mockState.items}
                onClick={() => {
                    State.instance.selectedTexture = null;
                    this.forceUpdate();
                }}
            />
        );
    }

    private async populate() {
        const items = Manifest.getData().materials;
        this._items = (await Promise.all(items.map(name => {
            return Assets.load(`Assets/Materials/${name}.Material`);
        }))) as Material[];
        
        const thumbnails = await Promise.all(this._items.map(m => {
            // tslint:disable-next-line
            const diffuse = m["diffuseMap"] as Texture2D;
            return diffuse.loadTextureData();
        }));

        Object.assign(this._mockState, {
            items: thumbnails.reduce(
                (prev, cur, index) => {
                    return prev.concat({
                        id: this._items[index].id,
                        name: items[index],
                        image: cur,
                        rounded: true,
                        isSelected: () => State.instance.selectedMaterial === this._items[index],
                        onClicked: () => State.instance.selectedMaterial = this._items[index]
                    });
                },
                [] as IContentItemProps[]
            )
        });
        this.forceUpdate();
    }
}
