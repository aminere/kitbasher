
import * as React from "react";
import { NumberEditor } from "./NumberEditor";

interface IPropertyEditorProps {
    // tslint:disable-next-line
    initialValue: any;
    // tslint:disable-next-line
    onChanged: (newValue: any) => void;
}

export class PropertyEditor extends React.Component<IPropertyEditorProps> {
    public render() {
        const { initialValue } = this.props;
        const typeName = initialValue.constructor.name;

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
