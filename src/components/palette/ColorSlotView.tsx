
import * as React from "react";
import { ColorSlot } from "../../palette/ColorSlot";
import { ColorPicker } from "./ColorPicker";

interface IColorSlotViewProps {
    slot: ColorSlot;
    onChanged: () => void;
}

export class ColorSlotView extends React.Component<IColorSlotViewProps> {
    public render() {
        return (
            <div className="slot-editor">
                <ColorPicker
                    initialColor={this.props.slot.diffuse}
                    onChange={newColor => {
                        this.props.slot.diffuse.copy(newColor);
                        this.props.onChanged();
                    }}
                />
            </div>
        );
    }
}
