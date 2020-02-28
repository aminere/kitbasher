
import * as React from "react";
import { PaletteSlot } from "../../palette/PaletteSlot";
import { ColorSlotView } from "./ColorSlotView";
import { ColorSlot } from "../../palette/ColorSlot";
import { MaterialSlotView } from "./MaterialSlotView";
import { MaterialSlot } from "../../palette/MaterialSlot";

export class PaletteSlotViewFactory {
    public static create(slot: PaletteSlot, onChanged: () => void) {
        return {
            ColorSlot: (
                <ColorSlotView
                    slot={slot as ColorSlot}
                    onChanged={onChanged}
                />
            ),
            MaterialSlot: (
                <MaterialSlotView
                    slot={slot as MaterialSlot}
                    onChanged={onChanged}
                />
            ),
        }[slot.constructor.name];
    }
}
