
export class Snapping {
    public static snap(i: number, size: number) {
        const ratio = i / size;
        const ratioInt = Math.floor(ratio);
        const ratioFract = ratio - ratioInt;
        return size * (ratioInt + Math.round(ratioFract));
    }
}
