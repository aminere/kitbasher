
import * as React from "react";
import { Menu, MenuItem } from "@blueprintjs/core";

interface IItemPickerProps<T> {
    selectionId: string;
    items: T[];
    getItemId: (item: T) => string;
    getItemName: (item: T) => string;
    onSelectionChanged: (item: T) => void;
}

export class ItemPicker<T> extends React.Component<IItemPickerProps<T>> {
    public render() {
        return (
            <div>
                <Menu>
                    {this.props.items.map(i => {
                        return (
                            <MenuItem
                                key={this.props.getItemId(i)}
                                text={this.props.getItemName(i)}
                                onClick={(e: React.MouseEvent<HTMLElement>) => {
                                    
                                }}
                            />
                        )
                    })}
                </Menu>
            </div>
        );
    }
}
