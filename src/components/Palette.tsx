
import * as React from "react";
import { Button } from "@blueprintjs/core";
import { PaletteSlotView } from "./PaletteSlotView";
import { Events } from "../Events";
import { PaletteSlot } from "../PaletteSlot";
import { Persistence } from "../Persistence";
import { Interfaces } from "../../../spider-engine/src/core/Interfaces";
import { SerializedObject } from "../../../spider-engine/src/spider-engine";
import { ColorSlot } from "../ColorSlot";

namespace Private {
    export const path = "kitbasher-palette.json";
    export let slots: PaletteSlot[] = [];
    export function savePalette() {
        Persistence.write(path, JSON.stringify(slots.map(s => s.serialize())));
    }
}

export class Palette extends React.Component {

    public componentDidMount() {
        Events.engineReady.attach(() => {

            const loadSlots = (data: string) => {
                Private.slots = (JSON.parse(data) as SerializedObject[]).map(json => {
                    const o = Interfaces.factory.createObject(json.typeName as string);
                    o?.deserialize(json);
                    return o as PaletteSlot;
                });
                this.forceUpdate();
            };

            Persistence.read(Private.path)
                .then(data => loadSlots(data))
                .catch(() => {
                    if (process.env.PLATFORM === "web") {
                        return Interfaces.file.read(Private.path)
                            .then(data => {
                                loadSlots(data);
                                return data;
                            })
                            .then(data => Persistence.write(Private.path, data));
                    } else {
                        return Promise.reject(`Could not load '${Private.path}'`);
                    }
                });
        });
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
                        Private.slots.push(new ColorSlot());
                        Private.savePalette();
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
                    {Private.slots.map((s, i) => {
                        return (
                            <PaletteSlotView
                                key={i}
                                index={i}
                                initialSlot={s}
                                onChange={newSlot => {
                                    Private.slots[i] = newSlot;
                                    Private.savePalette();
                                }}
                                onDelete={(() => {
                                    if (Private.slots.length === 1 && i === 0) {
                                        return undefined;
                                    }
                                    return () => {
                                        Private.slots.splice(i, 1);
                                        Private.savePalette();
                                        this.forceUpdate();
                                    };
                                })()}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }
}
