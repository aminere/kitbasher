
import * as React from "react";

import "./propertygrid.css";
import { Property } from "./Property";

interface IPropertyGridProps {
    target: object;
    // tslint:disable-next-line
    onPropertyChanged: (name: string, newValue: any) => void;
}

export class PropertyGrid extends React.Component<IPropertyGridProps> {
    public render() {        
        return (
            <div>
                {
                    Object.entries(this.props.target)
                        .map(([name, value]) => {
                            return (
                                <Property
                                    key={name}
                                    name={name}
                                    initialValue={value}
                                    onChanged={newValue => {
                                        // TODO
                                    }}
                                />
                            );
                        })
                }
            </div>
        );
    }
}
