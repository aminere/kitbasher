
import * as React from "react";
import { Button } from "@blueprintjs/core";
import { PaletteSlotView } from "./PaletteSlotView";
import { ColorSlot } from "../ColorSlot";
import { MaterialSlot } from "../MaterialSlot";
import { Events } from "../Events";
import { PaletteSlot } from "../PaletteSlot";
import { Persistence } from "../Persistence";
import { Interfaces } from "../../../spider-engine/src/core/Interfaces";
import { SerializedObject } from "../../../spider-engine/src/spider-engine";

namespace Private {
    export const path = "kitbasher-palette.json";
}

export class Palette extends React.Component {

    private _slots: PaletteSlot[] = [];

    public componentDidMount() {
        Events.engineReady.attach(() => {

            const loadSlots = (data: string) => {
                this._slots = (JSON.parse(data) as SerializedObject[]).map(json => {
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
            <div>
                <Button
                    icon="plus"
                    fill={true}
                    minimal={true}
                    intent="primary"
                >
                    Add Slot
                </Button>
                {
                    this._slots.map((s, i) => {
                        return <PaletteSlotView key={i} index={i} slot={s} />;
                    })
                }
            </div>
        );
    }
}
