
import * as React from "react";
import { NumberEditor } from "./NumberEditor";
import { Vector3 } from "../../../../spider-engine/src/math/Vector3";

interface IPropertyEditorProps {
    // tslint:disable-next-line
    initialValue: any;
    // tslint:disable-next-line
    onChanged: (newValue: any) => void;
}

export class PropertyEditor extends React.Component<IPropertyEditorProps> {
    public render() {
        const { initialValue, onChanged } = this.props;
        const typeName = initialValue.constructor.name;

        if (typeName === "Vector3") {
            const v = initialValue as Vector3;
            return [
                <NumberEditor 
                    key="x"
                    initialValue={v.x}
                    onChanged={e => onChanged(new Vector3(e, v.y, v.z))}
                />,
                <NumberEditor 
                    key="y"
                    initialValue={v.y}
                    onChanged={e => onChanged(new Vector3(v.x, e, v.z))}
                />,
                <NumberEditor 
                    key="z"
                    initialValue={v.z}
                    onChanged={e => onChanged(new Vector3(v.x, v.y, e))}
                />
            ];
        }

        if (typeof (initialValue) === "number") {
            return (
                <NumberEditor 
                    initialValue={initialValue}
                    onChanged={newValue => this.props.onChanged(newValue)}
                />
            );
        }

        return null;
    }
}
