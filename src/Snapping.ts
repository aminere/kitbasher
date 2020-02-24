import { State } from "./State";

export class Snapping {
    public static snap(i: number, size: number) {
        if (!State.instance.snapping) {
            return i;
        }
        const ratio = i / size;
        const ratioInt = Math.floor(ratio);
        const ratioFract = ratio - ratioInt;
        return size * (ratioInt + Math.round(ratioFract));
    }
}
