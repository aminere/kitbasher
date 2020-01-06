
import { SyncEvent, VoidAsyncEvent, AsyncEvent, VoidSyncEvent } from "ts-events";

export class Events {
    public static canvasMounted = new SyncEvent<HTMLCanvasElement>(); 
    public static engineReady = new VoidSyncEvent();
}
