import React = require("react");
import { InputGroup } from "@blueprintjs/core";

interface INumberEditorProps {
    initialValue: number;
    onChanged: (newValue: number) => void;
}

interface INumberEditorState {
    valueAsString: string;
    valueAsNumber: number;
}

namespace Private {
    export function toString(value: number, decimals?: number) {
        return `${Number(value.toFixed(decimals ?? 3)).valueOf()}`;
    }
}

export class NumberEditor extends React.PureComponent<INumberEditorProps, INumberEditorState> {

    private _previousKeyCode?: number;
    private _input!: HTMLInputElement;

    constructor(props: INumberEditorProps) {
        super(props);
        this.state = {
            valueAsString: Private.toString(props.initialValue),
            valueAsNumber: props.initialValue
        };
    }

    public UNSAFE_componentWillReceiveProps(nextProps: INumberEditorProps) {
        const newValueAsString = Private.toString(nextProps.initialValue);
        if (newValueAsString !== this.state.valueAsString) {
            this.setState({
                valueAsString: newValueAsString,
                valueAsNumber: nextProps.initialValue
            });
        }
    }

    public render() {
        return (
            <InputGroup                
                className="bp3-fill property-editor"
                inputRef={e => this._input = e as HTMLInputElement}
                value={this.state.valueAsString}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    this.setState({
                        valueAsString: e.target.value
                    });
                }}
                onBlur={e => this.onFocusLost(e)}
                onKeyUp={e => this.onKeyUp(e)}
            />
        );
    }

    private onFocusLost(e: React.FocusEvent<HTMLInputElement>) {
        if (this._previousKeyCode && (this._previousKeyCode === 27 || this._previousKeyCode === 13)) {
            return; // Do nothing in case we lost the focus because of a valid key
        }
        this.validateInput();
    }

    private onKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
        this._previousKeyCode = e.keyCode;
        if (e.keyCode === 13) {
            this.validateInput();
            if (this._input) {
                this._input.blur();
            }            
        } else if (e.keyCode === 27) {
            this.cancelInput();
            if (this._input) {
                this._input.blur();
            }            
        }
        e.stopPropagation();
    }

    private validateInput() {
        const { valueAsString } = this.state;
        const parsed = valueAsString.length > 0 ? Number(valueAsString).valueOf() : Number.NaN;
        if (parsed === this.state.valueAsNumber) {            
            return;
        }
        
        if (isNaN(parsed)) {
            this.cancelInput();
            return;
        }
        
        this.setState({ valueAsNumber: parsed });
        this.props.onChanged(parsed);
    }

    private cancelInput() {
        this.setState({ valueAsString: Private.toString(this.state.valueAsNumber) });
    }
}
