
import { IFile } from "../../spider-engine/src/io/File/IFile";
import { FileIndexedDb } from "../../spider-engine/src/io/File/FileIndexedDb";

namespace Private {

    export const primary = (() => {
        if (process.env.PLATFORM === "web") {            
            return new FileIndexedDb();
        } else {
            const ctor = require("../../spider-engine/src/io/File/FileStandaloneElectron").FileStandaloneElectron;
            return new ctor();
        }
    })();

    export const fallback: IFile = (() => {
        if (process.env.PLATFORM === "web") {
            const ctor = require("../../spider-engine/src/io/File/FileStandaloneWeb").FileStandaloneWeb;
            return new ctor();
        } else {
            return primary;
        }
    })();

    export function getFallback(func: (f: IFile) => void) {
        if (fallback !== primary) {
            return func(fallback);
        } else {
            return Promise.reject();
        }
    }
}

export class FileInterface implements IFile {
    public async read(path: string) {
        return Private.primary.read(path)
            .catch(async () => {
                if (Private.fallback !== Private.primary) {
                    const data = await Private.fallback.read(path);
                    await Private.primary.write(path, data);
                    return data;
                } else {
                    return Promise.reject();
                }
            });
    }
    // tslint:disable-next-line
    public write(path: string, data: any) {
        return Private.primary.write(path, data)
            .catch(() => Private.getFallback(f => f.write(path, data)));
    }
    public delete(path: string) {
        return Private.primary.delete(path)
            .catch(() => Private.getFallback(f => f.delete(path)));
    }
    public renameFile(oldPath: string, newPath: string) {
        return Private.primary.renameFile(oldPath, newPath)
            .catch(() => Private.getFallback(f => f.renameFile(oldPath, newPath)));
    }
    public renameFolder(oldPath: string, newPath: string) {
        return Private.primary.renameFolder(oldPath, newPath)
            .catch(() => Private.getFallback(f => f.renameFolder(oldPath, newPath)));
    }
    public clearAllFiles() {
        return Private.primary.clearAllFiles()
            .catch(() => Private.getFallback(f => f.clearAllFiles()));
    }
}
