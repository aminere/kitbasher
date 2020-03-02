
import * as React from "react";
import { IContentItemProps } from "./ContentItem";
import { Events } from "../Events";
import { State } from "../State";
import { ItemContainer } from "./ItemContainer";
import { Models } from "../Models";
import { IKitAsset } from "../Types";

interface IModelsState {
    items: IContentItemProps[];
}

export class ModelsView extends React.Component {

    // This is done because goldenlayout saves the React state
    // and this is not wanted in this case (state has references to Image elements)
    private _mockState: IModelsState = {
        items: []
    };

    private _lastUsedKit: IKitAsset | null = null;

    public componentDidMount() {
        Events.engineReady.attach(() => {
            Object.assign(this._mockState, {
                items: Models.models.reduce(
                    (prev, cur, index) => {
                        return prev.concat({
                            id: Models.models[index].id,
                            name: Models.models[index].model.name,
                            image: cur.thumbnail.image,
                            isSelected: () => State.instance.selectedKit === Models.models[index],
                            onClicked: () => {
                                const selected = Models.models[index];
                                State.instance.selectedKit = selected;
                                this._lastUsedKit = selected;
                            }
                        });
                    },
                    [] as IContentItemProps[]
                )
            });
            this.forceUpdate();
            Events.assetBrowserReady.post();
        });

        Events.insertClicked.attach(() => {
            if (!State.instance.selectedKit) {
                State.instance.selectedKit = this._lastUsedKit ?? Models.models[0];
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
}
