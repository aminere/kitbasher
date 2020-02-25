import { Persistence } from "./Persistence";
import { Interfaces } from "../../spider-engine/src/spider-engine";

interface IManifest {
    models: Array<[string, string]>;
    materials: string[];
    textures: string[];
}

namespace Private {
    export const path = "kitbasher-manifest.json";
    export let data: IManifest;
}

export class Manifest {
    public static load() {
        return Persistence.read(Private.path)
            .then(data => {
                Private.data = JSON.parse(data);
            })
            .catch(() => {
                if (process.env.PLATFORM === "web") {
                    return Interfaces.file.read(Private.path)
                        .then(data => {
                            Private.data = JSON.parse(data);
                            return data;
                        })
                        .then(data => Persistence.write(Private.path, data));
                } else {
                    return Promise.reject(`Could not load '${Private.path}'`);
                }
            });
    }

    public static save() {
        Persistence.write(Private.path, Private.data);
    }

    public static getData() {
        return Private.data;
    }
}
