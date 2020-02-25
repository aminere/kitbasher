import { IndexedDb } from "../../spider-engine/src/io/IndexedDb";
import { Interfaces } from "../../spider-engine/src/core/Interfaces";

export class Persistence {
    public static read(path: string) {
        if (process.env.PLATFORM === "web") {
            return IndexedDb.read("files", path);
        } else if (process.env.PLATFORM === "electron") {
            return Interfaces.file.read(path);
        } else {
            // tslint:disable-next-line
            console.assert(false);
            return Promise.reject();
        }
    }

    // tslint:disable-next-line
    public static write(path: string, data: any) {
        if (process.env.PLATFORM === "web") {
            return IndexedDb.write("files", path, data);
        } else if (process.env.PLATFORM === "electron") {
            return Interfaces.file.write(path, data);
        } else {
            // tslint:disable-next-line
            console.assert(false);
            return Promise.reject();
        }
    }

    public static delete(path: string) {
        if (process.env.PLATFORM === "web") {
            return IndexedDb.delete("files", path);
        } else if (process.env.PLATFORM === "electron") {
            return Interfaces.file.delete(path);
        } else {
            // tslint:disable-next-line
            console.assert(false);
            return Promise.reject();
        }
    }

    public static rename(oldPath: string, newPath: string) {
        if (process.env.PLATFORM === "web") {
            return Persistence.read(oldPath)
                .then(data => Persistence.write(newPath, data))
                .then(() => Persistence.delete(oldPath));
        } else if (process.env.PLATFORM === "electron") {
            return Interfaces.file.renameFile(oldPath, newPath);
        } else {
            // tslint:disable-next-line
            console.assert(false);
            return Promise.reject();
        }
    }
}
