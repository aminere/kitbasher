
import * as React from "react";
import { PaletteSlot } from "../PaletteSlot";
import { ColorSlot } from "../ColorSlot";
import { MaterialSlot } from "../MaterialSlot";

interface IPaletteSlotViewProps {
    index: number;
    slot: PaletteSlot;
}

export class PaletteSlotView extends React.Component<IPaletteSlotViewProps> {
    public render() {
        const { index, slot } = this.props;
        return (
            <div
                style={{
                    display: "flex"
                }}
            >
                <div>
                    {index}
                </div>
                <div>
                    {(() => {
                        if (slot.isA(ColorSlot)) {
                            return <span>ColorSlot</span>;
                        } else if (slot.isA(MaterialSlot)) {
                            return <span>MaterialSlot</span>;
                        }
                    })()}
                </div>
            </div>
        );
    }
}
