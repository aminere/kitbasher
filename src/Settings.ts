import { MathEx } from "../../spider-engine/src/math/MathEx";

export class Settings {
    public static get gridSize() { return 1; }
    public static get angleSnap() { return 45 * MathEx.degreesToRadians; }
}
