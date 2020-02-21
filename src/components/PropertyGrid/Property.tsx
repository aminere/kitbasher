
import * as React from "react";
import { PropertyEditor } from "./PropertyEditor";

interface IPropertyProps {
    name: string;
    customEditor?: JSX.Element;
    // tslint:disable-next-line
    initialValue: any;
    // tslint:disable-next-line
    onChanged: (newValue: any) => void;
}

export class Property extends React.Component<IPropertyProps> {
    public render() {
        const { customEditor } = this.props;
        return (
            <div className="property-root">
                <div className="property-name">
                    {this.props.name}
                </div>
                <div className="property-editor-container">
                    {(() => {
                        if (customEditor) {
                            return customEditor;
                        } else {
                            return (
                                <PropertyEditor
                                    initialValue={this.props.initialValue}
                                    onChanged={newValue => this.props.onChanged(newValue)}
                                />
                            );
                        }
                    })()}
                </div>
            </div>
        );
    }
}
