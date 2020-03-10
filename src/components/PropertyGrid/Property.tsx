
import * as React from "react";
import { PropertyEditor } from "./PropertyEditor";

interface IPropertyProps {
    name: string;
    customEditor?: JSX.Element;
    showName?: boolean;
    target: object;
    property: string;
    enumLiterals?: { [name: string]: string };
    // tslint:disable-next-line
    onChanged: (newValue: any) => void;
}

export class Property extends React.Component<IPropertyProps> {
    public render() {
        const { customEditor, showName } = this.props;
        return (
            <div className="property-root">
                {(() => {
                    const editor = customEditor || (
                        <PropertyEditor
                            target={this.props.target}
                            property={this.props.property}
                            enumLiterals={this.props.enumLiterals}
                            onChanged={newValue => this.props.onChanged(newValue)}
                        />
                    );
                    if (showName === false) {
                        return <div className="property-editor-container">{editor}</div>;
                    } else {
                        return [
                            (
                                <div key="name" className="property-name" style={{ width: "25%" }}>
                                    {this.props.name}
                                </div>
                            ),
                            (
                                <div key="editor" className="property-editor-container" style={{ width: "75%" }}>
                                    {editor}
                                </div>
                            )
                        ];
                    }
                })()}
            </div>
        );
    }
}
