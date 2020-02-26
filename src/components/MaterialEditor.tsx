
import * as React from "react";
import { Material } from "../../../spider-engine/src/graphics/Material";
import { PropertyGrid } from "./PropertyGrid/PropertyGrid";

interface IMaterialEditorProps {
    material: Material;
}

export class MaterialEditor extends React.Component<IMaterialEditorProps> {
    public render() {
        const { material } = this.props;
        return (
            <div>
                <PropertyGrid
                    target={{
                        material
                    }}
                    onPropertyChanged={(name, value) => {
                        
                    }}
                />
                <PropertyGrid
                    target={{
                        // tslint:disable-next-line
                        texture: material["diffuseMap"],
                        // tslint:disable-next-line
                        color: material["diffuse"]
                    }}
                    onPropertyChanged={(name, value) => {
                        
                    }}
                />
            </div>
        );
    }
}
