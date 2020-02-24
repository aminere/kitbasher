
import * as React from "react";
import { Assets } from "../../../spider-engine/src/assets/Assets";
import { Texture2D } from "../../../spider-engine/src/graphics/Texture2D";
import { IContentItemProps, ContentItem } from "./ContentItem";
import { State } from "../State";
import { Events } from "../Events";

interface ITexturesState {
    items: IContentItemProps[];
}

export class Textures extends React.Component<{}, ITexturesState> {

    private _mockState: ITexturesState = {
        items: []
    };

    private _textures!: Texture2D[];

    public componentDidMount() {
        Events.engineReady.attach(() => this.populate());
        // Events.selectedKitChanged.attach(kit => this.forceUpdate());
    }

    public render() {
        return (
            <div
                className="fill-parent"
                onClick={() => {
                    State.instance.selectedTexture = null;
                    this.forceUpdate();
                }}
            >
                {this._mockState.items.map(i => (
                    <ContentItem
                        key={i.id}
                        {...i}
                    />
                ))}
            </div>
        );
    }

    private async populate() {
        const textures = [
            "brick",
            "wood"
        ];

        this._textures = (await Promise.all(textures.map(name => {
            return Assets.load(`Assets/Textures/${name}.Texture2D`);
        }))) as Texture2D[];
        const thumbnails = await Promise.all(this._textures.map(t => t.loadTextureData()));

        Object.assign(this._mockState, {
            items: thumbnails.reduce(
                (prev, cur, index) => {
                    return prev.concat({
                        id: this._textures[index].id,
                        name: textures[index],
                        image: cur,
                        isSelected: () => State.instance.selectedTexture === this._textures[index],
                        onClicked: () => State.instance.selectedTexture = this._textures[index]
                    });
                },
                [] as IContentItemProps[]
            )
        });
        this.forceUpdate();
    }
}