
export class Utils {
    public static capitalize(str: string) {
        const firstChar = String(str).charAt(0);
        return firstChar.toUpperCase() + String(str).slice(1);
    }
}
