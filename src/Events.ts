
import { VoidAsyncEvent, AsyncEvent } from "ts-events";
import { Entity } from "../../spider-engine/src/core/Entity";

export class Events {
    public static canvasMounted = new AsyncEvent<HTMLCanvasElement>(); 
    public static engineReady = new VoidAsyncEvent();
    public static assetBrowserReady = new VoidAsyncEvent();
    public static transformChanged = new AsyncEvent<Entity>();

    public static insertClicked = new VoidAsyncEvent();
    public static gridChanged = new VoidAsyncEvent();
}
