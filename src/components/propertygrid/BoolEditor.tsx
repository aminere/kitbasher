
import * as React from "react";
import { Switch } from "@blueprintjs/core";

interface IBoolEditorProps {
    initialValue: boolean;
    onChanged: (newValue: boolean) => void;
}

interface IBoolEditorState {
    value: boolean;
}

export class BoolEditor extends React.Component<IBoolEditorProps, IBoolEditorState> {
    
    constructor(props: IBoolEditorProps) {
        super(props);
        this.state = {
            value: props.initialValue
        };
    }

    public render() {        
        return (
            <div
                style={{
                    marginTop: "12px",
                    marginLeft: "4px"
                }}
            >
                <Switch
                    checked={this.state.value}
                    large={true}
                    onChange={() => {
                        const newValue = !this.state.value;
                        this.setState({ value: newValue });
                        this.props.onChanged(newValue);
                    }}
                />
            </div>
        );
    }
}
