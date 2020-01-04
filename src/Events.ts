
import { SyncEvent, VoidAsyncEvent, AsyncEvent } from "ts-events";

export class Events {
    public static canvasMounted = new SyncEvent<HTMLCanvasElement>(); 
    public static editorReady = new VoidAsyncEvent();
    public static renderingActivated = new AsyncEvent<boolean>();
}
