import { PaletteSlot } from "./PaletteSlot";
import { SerializedObject, SerializableObject } from "../../../spider-engine/src/core/SerializableObject";
import { Interfaces } from "../../../spider-engine/src/core/Interfaces";
import { Persistence } from "../Persistence";
import { Material } from "../../../spider-engine/src/graphics/Material";

namespace Private {
    export const path = "kitbasher-palette.json";
    export let slots: PaletteSlot[] = [];
    export let materials: Material[] = [];

    export function updateMaterial(m: Material, slot: PaletteSlot) {
        m.shaderParams = slot as unknown as SerializableObject;
    }

    export function makeMaterial(slot: PaletteSlot) {
        const m = new Material();
        updateMaterial(m, slot);
        return m;
    }

    export function savePalette() {
        Persistence.write(path, JSON.stringify(slots.map(s => s.serialize())));
    }
}

export class Palette {
    public static get slots() { return Private.slots; }
    public static get materials() { return Private.materials; }

    public static load() {
        const loadSlots = (data: string) => {
            Private.slots = (JSON.parse(data) as SerializedObject[]).map(json => {
                const o = Interfaces.factory.createObject(json.typeName as string);
                o?.deserialize(json);
                return o as PaletteSlot;
            });
            Private.materials = Private.slots.map(Private.makeMaterial);
        };
        return Persistence.read(Private.path)
            .then(data => loadSlots(data))
            .catch(() => {
                if (process.env.PLATFORM === "web") {
                    return Interfaces.file.read(Private.path)
                        .then(data => {
                            loadSlots(data);
                            return data;
                        })
                        .then(data => Persistence.write(Private.path, data));
                } else {
                    return Promise.reject(`Could not load '${Private.path}'`);
                }
            });
    }

    public static addSlot(slot: PaletteSlot) {
        Private.slots.push(slot);
        Private.materials.push(Private.makeMaterial(slot));
        Private.savePalette();
    }

    public static setSlot(index: number, slot: PaletteSlot) {
        const oldSlot = Private.slots[index];
        if (oldSlot !== slot) {
            Private.slots[index] = slot;
            Private.materials[index] = Private.makeMaterial(slot);
        } else {
            Private.updateMaterial(Private.materials[index], slot);
        }        
        Private.savePalette();
    }

    public static removeSlot(index: number) {
        Private.slots.splice(index, 1);
        Private.materials.splice(index, 1);
        Private.savePalette();
    }
}
