
import { VoidAsyncEvent, AsyncEvent } from "ts-events";

export class Events {
    public static canvasMounted = new AsyncEvent<HTMLCanvasElement>(); 
    public static engineReady = new VoidAsyncEvent();
    public static assetBrowserReady = new VoidAsyncEvent();

    public static onInsertClicked = new VoidAsyncEvent();
}
