import * as React from "react";
import { Commands } from "../Commands";
import { ItemPicker } from "./ItemPicker";

interface IItemSelectorProps<T> {
    selected: T;
    items: T[];
    getItemId: (item: T) => string;
    getItemName: (item: T) => string;
    onSelectionChanged: (item: T) => void;
}

export class ItemSelector<T> extends React.Component<IItemSelectorProps<T>> {
    public render() {
        return (
            <div>
                <button
                    type="button"
                    className={`pt-button pt-fill pt-minimal fr-popover-target`}
                    style={{
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                        display: "inline"
                    }}
                    onClick={e => this.onPick(e)}
                >
                    {this.props.getItemName(this.props.selected)}
                </button>
            </div>
        );
    }

    private onPick(e: React.MouseEvent<HTMLElement>) {
        Commands.showPopover.post({
            clientX: e.clientX,
            clientY: e.clientY,
            targetRect: e.currentTarget.getBoundingClientRect(),
            content: (
                <div />
                // <ItemPicker
                //     selectedId={this.selectedAssetId}
                //     items={function () {
                //         return db.findAssets(undefined, true, assetPath => {
                //             const assetTypeName = db.getAssetTypeName(assetPath) as string;
                //             const isOfType = rtti.isObjectOfType(assetTypeName, typeName);
                //             if (!isOfType) {
                //                 return false;
                //             }
                //             // Exclude certain assets on purpose
                //             if (typeName === "Scene") {
                //                 return assetPath !== defaultAssets.transitionScene.templatePath;
                //             }
                //             return true;
                //         });
                //     }()}
                //     getItemName={item => db.getAssetName(item.path) as string}
                //     getItemId={item => item.id}
                //     onSelectionChanged={item => onChange(item.id)}
                // />
            )
        });
    }
}
