import { PaletteSlot } from "./PaletteSlot";
import { SerializedObject, SerializableObject } from "../../../spider-engine/src/core/SerializableObject";
import { Interfaces } from "../../../spider-engine/src/core/Interfaces";
import { Material } from "../../../spider-engine/src/graphics/Material";
import { Assets } from "../../../spider-engine/src/assets/Assets";
import { SerializerUtilsInternal } from "../../../spider-engine/src/serialization/SerializerUtils";

namespace Private {
    export const path = "kitbasher-palette.json";
    export let defaultMaterial: Material;
    export let slots: PaletteSlot[] = [];
    export let materials: Material[] = [];

    export function updateMaterial(m: Material, slot: PaletteSlot) {
        const makeParams = (params: object) => {
            return Object.entries(params).reduce((prev, cur) => {
                const [key, value] = cur;
                if (value.constructor.name === "AssetReference") {
                    if (value.asset) {
                        return { ...prev, ...{ [key]: value.asset } };
                    } else {
                        return prev;
                    }                
                } else {
                    return { ...prev, ...{ [key]: value } };
                }
            }, {});
        };
        const newParams = makeParams(slot);
        const existingParams = makeParams(m.shaderParams);
        m.shaderParams = { ...existingParams, ...newParams } as unknown as SerializableObject;
    }

    export function makeMaterial(slot: PaletteSlot) {
        const material = defaultMaterial.copy() as Material;
        updateMaterial(material, slot);
        return material;
    }

    export function savePalette() {
        Interfaces.file.write(path, JSON.stringify(slots.map(s => s.serialize())));
    }

    export async function saveMaterial(index: number) {
        SerializerUtilsInternal.serializeIdsAsPaths = true;
        await Interfaces.file.write(
            `Assets/Materials/${index}.Material`,
            JSON.stringify(Private.materials[index].serialize())
        );
        SerializerUtilsInternal.serializeIdsAsPaths = false;
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
        };

        return Interfaces.file.read(Private.path)
            .then(data => {
                loadSlots(data);
                if (process.env.PLATFORM === "web") {
                    return Interfaces.file.write(Private.path, data);
                }               
            })
            .then(() => {
                return Promise.resolve()
                    .then(() => Assets.load("Assets/Materials/Default.Material"))
                    .then(defaultMaterial => {
                        Private.defaultMaterial = defaultMaterial as Material;
                    })
                    .then(() => Assets.load("Assets/Materials/0.Material"))
                    .then(material0 => {
                        // Load all materials from storage
                        Promise.all(Array.from(new Array(Private.slots.length - 1)).map((a, i) => {
                            return Assets.load(`Assets/Materials/${i + 1}.Material`);
                        }))
                            .then(materials => {
                                Private.materials = [
                                    material0 as Material,
                                    ...(materials as Material[])
                                ];
                            });
                    })
                    .catch(() => {
                        // Create materials from slots and save them                        
                        Private.materials = Private.slots.map(s => {
                            return Private.makeMaterial(s);
                        });
                        return Promise.all(Private.materials.map((m, index) => {
                            return Interfaces.file.write(
                                        `Assets/Materials/${index}.Material`,
                                        JSON.stringify(m.serialize())
                                    );
                                }));                  
                    });
            });
    }

    public static addSlot(slot: PaletteSlot) {
        Private.slots.push(slot);
        const material = Private.makeMaterial(slot);
        Private.materials.push(material);
        Private.saveMaterial(Private.materials.length - 1)
            .then(() => Private.savePalette());
    }

    public static setSlot(index: number, slot: PaletteSlot) {
        const oldSlot = Private.slots[index];
        if (oldSlot !== slot) {
            Private.slots[index] = slot;
            Private.materials[index] = Private.makeMaterial(slot);
        } else {
            Private.updateMaterial(Private.materials[index], slot);
        }
        Private.saveMaterial(index)
            .then(() => Private.savePalette());
    }

    public static removeSlot(index: number) {
        Private.slots.splice(index, 1);
        Private.materials.splice(index, 1);
        Promise.all(Private.materials.map((m, i) => Private.saveMaterial(i)))
            .then(() => Interfaces.file.delete(`Assets/Materials/${Private.materials.length}.Material`))
            .then(() => Private.savePalette());
    }
}
