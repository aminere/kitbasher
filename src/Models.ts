import { IKitAsset } from "./Types";
import { Manifest } from "./Manifest";
import { Assets } from "../../spider-engine/src/assets/Assets";
import { ModelMesh } from "../../spider-engine/src/assets/model/ModelMesh";
import { Palette } from "./palette/Palette";
import { SerializerUtilsInternal } from "../../spider-engine/src/serialization/SerializerUtils";
import { Interfaces } from "../../spider-engine/src/core/Interfaces";

namespace Private {
    export let models: IKitAsset[];
}

export class Models {
    public static get models() { return Private.models; }

    public static async load(assignMaterials: boolean) {
        const { models } = Manifest.getData();
        Private.models = (await Promise.all(models.map(([section, name]) => {
            return Assets.load(`Assets/Kits/${section}/${name}.ObjectDefinition`);
        }))) as unknown[] as IKitAsset[];
        await Promise.all(Private.models.map(a => a.thumbnail.loadTextureData()));

        if (assignMaterials) {
            SerializerUtilsInternal.serializeIdsAsPaths = true;
            await Promise.all(Private.models.map(model => {
                model.model.elements.data.forEach((elem, index) => {
                    // tslint:disable-next-line
                    console.assert(elem.instance);
                    (elem.instance as ModelMesh).material.asset = Palette.materials[index];
                });
                return Interfaces.file.write(
                    model.model.templatePath as string,
                    JSON.stringify(model.model.serialize())
                );
            }));
            SerializerUtilsInternal.serializeIdsAsPaths = false;
        }
    }
}
