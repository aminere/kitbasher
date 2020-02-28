
import * as React from "react";
import { Material } from "../../../spider-engine/src/graphics/Material";
import { PropertyGrid } from "./propertygrid/PropertyGrid";

interface IMaterialEditorProps {
    material: Material;
}

export class MaterialEditor extends React.Component<IMaterialEditorProps> {
    public render() {
        const { material } = this.props;
        return (
            <div>
                
            </div>
        );
    }
}
