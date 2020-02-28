
import * as React from "react";
import { MaterialSlot } from "../../palette/MaterialSlot";
import { ColorPicker } from "./ColorPicker";
import { TexturePicker } from "./TexturePicker";
import { Utils } from "../../Utils";

interface IMaterialSlotViewProps {
    slot: MaterialSlot;
    onChanged: () => void;
}

export class MaterialSlotView extends React.Component<IMaterialSlotViewProps> {
    public render() {

        const makePicker = (name: string) => {
            return (
                <ColorPicker
                    initialColor={this.props.slot[name]}
                    name={Utils.capitalize(name)}
                    onChange={newColor => {
                        this.props.slot[name].copy(newColor);
                        this.props.onChanged();
                    }}
                />
            );
        };

        return (
            <div 
                className="slot-editor"
                style={{
                    display: "flex",
                    justifyContent: "center"
                }}
            >
                <TexturePicker
                    initialTexture={this.props.slot.diffuseMap.asset}
                    name="Diffuse Map"
                    onChange={newTexture => {
                        this.props.slot.diffuseMap.asset = newTexture;
                        this.props.onChanged();
                    }}
                />
                {makePicker("diffuse")}
                {makePicker("ambient")}
                {makePicker("emissive")}                
            </div>
        );
    }
}
