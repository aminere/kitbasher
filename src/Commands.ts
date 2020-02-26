
import { VoidAsyncEvent, AsyncEvent } from "ts-events";
import { PopoverPosition } from "@blueprintjs/core";

export interface IPopoverConfig {
    clientX: number;
    clientY: number;
    targetRect?: DOMRect | ClientRect;
    content: JSX.Element;
    placement?: PopoverPosition | "vertical";
}

export class Commands {
    public static saveScene = new VoidAsyncEvent();
    public static showPopover = new AsyncEvent<IPopoverConfig>();
    public static closePopover = new VoidAsyncEvent();
}
