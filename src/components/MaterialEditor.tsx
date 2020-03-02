
import * as React from "react";
import { Material } from "../../../spider-engine/src/graphics/Material";
import { PaletteSlotSetter } from "./palette/PaletteSlotSetter";
import { Palette } from "../palette/Palette";
import { Events } from "../Events";

interface IMaterialEditorProps {
    materials: Material[];
    onChanged: (materialIndex: number, slotIndex: number) => void;
}

export class MaterialEditor extends React.Component<IMaterialEditorProps> {

    public componentDidMount() {
        this.onPaletteChanged = this.onPaletteChanged.bind(this);
        Events.paletteChanged.attach(this.onPaletteChanged);
    }

    public componentWillUnmount() {
        Events.paletteChanged.detach(this.onPaletteChanged);
    }

    public render() {
        return (
            <div>
                {this.props.materials.map((m, index) => {
                    return (
                        <PaletteSlotSetter
                            key={index}
                            materialIndex={index}
                            initialPaletteSlot={Palette.materials.indexOf(m)}
                            onChange={newSlot => {
                                this.props.onChanged(index, newSlot);
                            }}
                        />
                    );
                })}
            </div>
        );
    }

    private onPaletteChanged() {
        this.forceUpdate();
    }
}
