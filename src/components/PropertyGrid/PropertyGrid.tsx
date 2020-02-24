
import * as React from "react";

import "./propertygrid.css";
import { Property } from "./Property";

interface IPropertyGridProps {
    target: object;
    metadata?: {
        [property: string]: {
            action?: JSX.Element;
            customEditor?: boolean;
            showName?: boolean;
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

    export function tryGetValueWithGetter(obj: object, property: string) {
        if (property.startsWith("_")) {
            // if getter exists, use it!
            const propertyKey = property.slice(1);
            const propertyValue = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), propertyKey);
            if (propertyValue && propertyValue.get) {
                return propertyValue.get.call(obj);
            }
        }
        return obj[property];
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
                            const v = Private.tryGetValueWithGetter(target, name);
                            const {
                                action,
                                customEditor,
                                showName
                            } = (metadata && name in metadata) ? metadata[name] : {
                                action: undefined,
                                customEditor: undefined,
                                showName: undefined
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
                                        initialValue={v}
                                        onChanged={newValue => this.props.onPropertyChanged(name, newValue)}
                                        customEditor={(customEditor === true) ? target[name] : undefined}
                                        showName={showName}
                                    />
                                </div>
                            );
                        })
                }
            </div>
        );
    }
}
