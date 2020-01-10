
import * as React from "react";
import { InputGroup } from "@blueprintjs/core";

interface INumberEditorProps {
    initialValue: number;
    onChanged: (newValue: number) => void;
}

interface INumberEditorState {
    valueAsString: string;
    valueAsNumber?: number;
}

namespace Private {
    export function toString(value: number, decimals?: number) {
        return `${Number(value.toFixed(decimals ?? 3)).valueOf()}`;
    }
}

export class NumberEditor extends React.Component<INumberEditorProps, INumberEditorState> {

    constructor(props: INumberEditorProps) {
        super(props);
        this.state = {
            valueAsString: Private.toString(props.initialValue),
            valueAsNumber: props.initialValue
        };
    }

    public render() {
        return (
            <InputGroup
                className="bp3-fill"
                value={this.state.valueAsString}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    this.setState({
                        valueAsString: e.target.value
                    });
                }}
            />
        );
    }
}
