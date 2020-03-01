import { PaletteSlot } from "./PaletteSlot";
import { Color } from "../../../spider-engine/src/graphics/Color";

export class ColorSlot extends PaletteSlot {
    public diffuse = new Color().copy(Color.white);
}
