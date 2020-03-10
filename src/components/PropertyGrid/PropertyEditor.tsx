
import * as React from "react";
import { NumberEditor } from "./NumberEditor";
import { Vector3 } from "../../../../spider-engine/src/math/Vector3";
import { QuaternionEditor } from "./QuaternionEditor";
import { Quaternion } from "../../../../spider-engine/src/math/Quaternion";
import { EnumLiterals } from "../../../../spider-engine/src/core/EnumLiterals";
import { EnumEditor } from "./EnumEditor";

interface IPropertyEditorProps {
    target: object;
    property: string;
    enumLiterals?: { [name: string]: string };
    // tslint:disable-next-line
    onChanged: (newValue: any) => void;
}

namespace Private {
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

export class PropertyEditor extends React.Component<IPropertyEditorProps> {
    public render() {
        const { target, property, onChanged } = this.props;

        const initialValue = Private.tryGetValueWithGetter(target, property);
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

        if (typeName === "Quaternion") {
            const v = initialValue as Quaternion;
            return (
                <QuaternionEditor
                    initialValue={v}
                    onChanged={newValue => onChanged(newValue)}
                />
            );
        }

        if (typeof (initialValue) === "number") {
            
            if (this.props.enumLiterals) {
                return (
                    <EnumEditor
                        initialValue={`${initialValue}`}
                        literals={this.props.enumLiterals}
                        onChanged={newValue => this.props.onChanged(parseInt(newValue, 10))}
                    />
                );
            } else {
                return (
                    <NumberEditor
                        initialValue={initialValue}
                        onChanged={newValue => this.props.onChanged(newValue)}
                    />
                );
            }

        }        

        return null;
    }
}
