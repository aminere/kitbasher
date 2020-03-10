
import "./propertygrid.css";
import { Property } from "./Property";
import React = require("react");

interface IPropertyGridProps {
    target: object;
    metadata?: {
        [property: string]: {
            action?: JSX.Element;
            customEditor?: boolean;
            showName?: boolean;
            enumLiterals?: { [name: string]: string };
        }
    };
    enabled?: boolean;
    // tslint:disable-next-line
    onPropertyChanged: (name: string, newValue: any) => void;
}

namespace Private {

    function prettify(str: string) {
        if (str.length > 0) {
            const firstChar = String(str).charAt(0);
            if (firstChar === "_") {
                if (str.length > 1) {
                    return String(str).charAt(1) + String(str).slice(2);
                }
            }
        }
        return str;
    }

    function capitalize(str: string) {
        const _str = prettify(str);
        if (_str.length > 0) {
            const firstChar = String(_str).charAt(0);
            return firstChar.toUpperCase() + String(_str).slice(1);
        }
        return _str;
    }

    export function getDislayName(target: object, property: string) {
        const displayName = Reflect.getMetadata("displayName", target, property);
        return displayName || capitalize(property);
    }
}

export class PropertyGrid extends React.Component<IPropertyGridProps> {
    public render() {
        const { target, metadata, enabled } = this.props;
        return (
            <div
                className={enabled === false ? "disabled" : ""}
            >
                {
                    Object.entries(target)
                        .filter(([name, value]) => {
                            const hidden = Reflect.getMetadata("hidden", target, name);
                            const unserializable = Reflect.getMetadata("unserializable", target, name);
                            if (hidden || unserializable || value === null || value === undefined) {
                                return false;
                            }
                            return true;
                        })
                        .map(([name, value]) => {
                            const {
                                action,
                                customEditor,
                                showName,
                                enumLiterals
                            } = (metadata && name in metadata) ? metadata[name] : {
                                action: undefined,
                                customEditor: undefined,
                                showName: undefined,
                                enumLiterals: undefined
                            };
                            return (
                                <div
                                    key={name}
                                    style={{
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    {
                                        action
                                        &&
                                        (
                                            <div
                                                style={{
                                                    margin: "0px 2px 0px 4px"
                                                }}
                                            >
                                                {action}
                                            </div>
                                        )
                                    }
                                    <Property
                                        name={Private.getDislayName(target, name)}
                                        target={target}
                                        property={name}
                                        onChanged={newValue => this.props.onPropertyChanged(name, newValue)}
                                        customEditor={(customEditor === true) ? target[name] : undefined}
                                        showName={showName}
                                        enumLiterals={enumLiterals}
                                    />
                                </div>
                            );
                        })
                }
            </div>
        );
    }
}
