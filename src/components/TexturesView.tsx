
import * as React from "react";
import { IContentItemProps } from "./ContentItem";
import { State } from "../State";
import { Events } from "../Events";
import { ItemContainer } from "./ItemContainer";
import { Textures } from "../Textures";

interface ITexturesState {
    items: IContentItemProps[];
}

export class TexturesView extends React.Component<{}, ITexturesState> {

    private _mockState: ITexturesState = {
        items: []
    };

    public componentDidMount() {
        Events.engineReady.attach(() => {
            Object.assign(this._mockState, {
                items: Textures.images.reduce(
                    (prev, cur, index) => {
                        return prev.concat({
                            id: Textures.textures[index].id,
                            name: Textures.textures[index].name,
                            image: cur,
                            isSelected: () => State.instance.selectedTexture === Textures.textures[index],
                            onClicked: () => State.instance.selectedTexture = Textures.textures[index]
                        });
                    },
                    [] as IContentItemProps[]
                )
            });
            this.forceUpdate();
        });
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
}
