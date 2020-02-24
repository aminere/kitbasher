
import { VoidAsyncEvent, AsyncEvent, SyncEvent } from "ts-events";
import { Entity } from "../../spider-engine/src/core/Entity";
import { IKitAsset, ContentItemType } from "./Types";

export class Events {
    public static canvasMounted = new AsyncEvent<HTMLCanvasElement>(); 
    public static engineReady = new VoidAsyncEvent();
    public static assetBrowserReady = new VoidAsyncEvent();
    
    public static transformChanged = new AsyncEvent<Entity>();    
    public static selectedItemChanged = new SyncEvent<ContentItemType | null>();
    public static selectedEntityChanged = new AsyncEvent<Entity[]>();
    public static gridChanged = new VoidAsyncEvent();

    public static insertClicked = new VoidAsyncEvent();
}
