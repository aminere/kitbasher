
import * as React from "react";
import { Material } from "../../../spider-engine/src/graphics/Material";

interface IMaterialEditorProps {
    material: Material;
}

export class MaterialEditor extends React.Component<IMaterialEditorProps> {
    public render() {
        const { material } = this.props;
        return (
            <div>
                 {/* const entity = this._mockState.selection[0].children[0];
                                                    const visual = entity.getComponent(Visual) as Visual;
                                                    return visual.material as Material;
													
													
													const elem = State.instance.selectedKit?.model.elements.data[0].instance;
                                                const material = (elem as ModelMesh).material.asset;
                                                return material as Material; */}
            </div>
        );
    }
}
