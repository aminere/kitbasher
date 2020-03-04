import { State } from "./State";
import { MathEx } from "../../spider-engine/src/math/MathEx";

export class Snapping {
    public static snap(i: number, size: number) {
        if (!State.instance.snapping) {
            return i;
        }
        if (Math.abs(size) < .01) {
            return i;
        }
        const ratio = i / size;
        const ratioInt = Math.floor(ratio);
        const ratioFract = ratio - ratioInt;
        return size * (ratioInt + Math.round(ratioFract));
    }
}
