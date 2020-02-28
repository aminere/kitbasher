
import * as React from "react";
import { Button } from "@blueprintjs/core";
import { PaletteSlotView } from "./PaletteSlotView";
import { Events } from "../../Events";
import { ColorSlot } from "../../palette/ColorSlot";
import { Palette } from "../../palette/Palette";

export class PaletteView extends React.Component {

    public componentDidMount() {
        Events.engineReady.attach(() => this.forceUpdate());
    }

    public render() {
        return (
            <div
                style={{
                    height: "100%"
                }}
            >
                <Button
                    icon="plus"
                    fill={true}
                    minimal={true}
                    intent="primary"
                    onClick={() => {
                        Palette.addSlot(new ColorSlot());
                        this.forceUpdate();
                    }}
                >
                    Add Slot
                </Button>
                <div
                    style={{
                        height: "calc(100% - 30px)",
                        overflow: "auto"
                    }}
                >
                    {Palette.slots.map((s, i) => {
                        return (
                            <div key={i}>
                                <PaletteSlotView
                                    index={i}
                                    initialSlot={s}
                                    onChange={newSlot => {
                                        Palette.setSlot(i, newSlot);
                                    }}
                                    onDelete={(() => {
                                        if (Palette.slots.length === 1 && i === 0) {
                                            return undefined;
                                        }
                                        return () => {
                                            Palette.removeSlot(i);
                                            this.forceUpdate();
                                        };
                                    })()}
                                />
                                {
                                    (i !== Palette.slots.length)
                                    &&
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "1px",
                                            backgroundColor: "rgba(84, 99, 111, 0.5)"
                                        }}
                                    />
                                }
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}
