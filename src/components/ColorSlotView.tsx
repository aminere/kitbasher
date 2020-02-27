
import * as React from "react";
import { ColorSlot } from "../ColorSlot";
import { ColorPicker } from "./ColorPicker";

interface IColorSlotViewProps {
    slot: ColorSlot;
    onChanged: () => void;
}

export class ColorSlotView extends React.Component<IColorSlotViewProps> {
    public render() {
        return (
            <div
                style={{
                    border: "2px 8px 4px 8px"
                }}
            >
                <ColorPicker
                    initialColor={this.props.slot.color}
                    onChange={newColor => {
                        this.props.slot.color.copy(newColor);
                        this.props.onChanged();
                    }}
                />
            </div>
        );
    }
}
