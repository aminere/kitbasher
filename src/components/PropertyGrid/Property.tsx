
import * as React from "react";
import { PropertyEditor } from "./PropertyEditor";

interface IPropertyProps {
    name: string;
    // tslint:disable-next-line
    initialValue: any;
    // tslint:disable-next-line
    onChanged: (newValue: any) => void;
}

export class Property extends React.Component<IPropertyProps> {
    public render() {
        return (
            <div className="property-root">
                <div className="property-name">
                    {this.props.name}
                </div>
                <div className="property-editor">
                    <PropertyEditor 
                        initialValue={this.props.initialValue}
                        onChanged={newValue => this.props.onChanged(newValue)}
                    />
                </div>
            </div>
        );
    }
}
