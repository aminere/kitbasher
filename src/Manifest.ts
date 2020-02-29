
import { Interfaces } from "../../spider-engine/src/spider-engine";

interface IManifest {
    models: Array<[string, string]>;
    textures: string[];
}

namespace Private {
    export const path = "kitbasher-manifest.json";
    export let data: IManifest;
}

export class Manifest {
    public static load() {
        return Interfaces.file.read(Private.path)
            .then(data => {
                Private.data = JSON.parse(data);
                if (process.env.PLATFORM === "web") {
                    Manifest.save();
                }
            });
    }

    public static save() {
        Interfaces.file.write(Private.path, JSON.stringify(Private.data));
    }

    public static getData() {
        return Private.data;
    }
}
