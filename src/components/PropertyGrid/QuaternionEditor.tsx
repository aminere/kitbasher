import * as React from "react";

import { NumberEditor } from "./NumberEditor";
import { Quaternion } from "../../../../spider-engine/src/math/Quaternion";
import { Vector3 } from "../../../../spider-engine/src/math/Vector3";
import { MathEx } from "../../../../spider-engine/src/math/MathEx";

interface IQuaternionEditorProps {
    initialValue: Quaternion;
    onChanged: (newValue: Quaternion) => void;
}

interface IQuaternionEditorState {
    euler: Vector3;
}

export class QuaternionEditor extends React.Component<IQuaternionEditorProps, IQuaternionEditorState> {

    constructor(props: IQuaternionEditorProps) {
        super(props);
        this.state = {
            euler: props.initialValue.toEuler(new Vector3())
        };
    }

    public UNSAFE_componentWillReceiveProps(nextProps: IQuaternionEditorProps) {
        const euler = nextProps.initialValue.toEuler(new Vector3());
        this.setState({ euler });
    }

    render() {
        return [
            <NumberEditor 
                key="x"
                initialValue={MathEx.toDegrees(this.state.euler.x)}
                onChanged={e => {
                    this.state.euler.x = MathEx.toRadians(e);
                    this.onChanged();
                }}
            />,
            <NumberEditor 
                key="y"
                initialValue={MathEx.toDegrees(this.state.euler.y)}
                onChanged={e => {
                    this.state.euler.y = MathEx.toRadians(e);
                    this.onChanged();
                }}
            />,
            <NumberEditor 
                key="z"
                initialValue={MathEx.toDegrees(this.state.euler.z)}
                onChanged={e => {
                    this.state.euler.z = MathEx.toRadians(e);
                    this.onChanged();
                }}
            />
        ];
    }

    onChanged() {
        this.props.onChanged(new Quaternion().setFromEulerVector(this.state.euler));
    }
}
