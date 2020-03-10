
import * as React from "react";
import { Select } from "@blueprintjs/select";
import { Button, MenuItem } from "@blueprintjs/core";

interface IEnumEditorProps {
    initialValue: string;
    literals: { [name: string]: string };
    onChanged: (newValue: string) => void;
}

interface IEnumEditorState {
    value: string;
}

export class EnumEditor extends React.Component<IEnumEditorProps, IEnumEditorState> {

    constructor(props: IEnumEditorProps) {
        super(props);
        this.state = {
            value: props.initialValue
        };
    }

    public render() {
        const { literals } = this.props;
        const entries = Object.entries(literals);
        return (
            <div
                className="select-fill"
                style={{ padding: "4px" }}
            >
                <Select
                    items={entries.map(([index, literal]) => index)}
                    itemRenderer={(item, { handleClick, modifiers }) => {
                        if (!modifiers.matchesPredicate) {
                            return null;
                        }
                        return (
                            <MenuItem
                                active={modifiers.active}
                                key={item}
                                onClick={handleClick}
                                text={literals[item]}
                            />
                        );
                    }}
                    onItemSelect={value => {
                        this.setState({ value });
                        this.props.onChanged(value);
                    }}
                    filterable={false}
                    activeItem={this.state.value}
                >
                    <Button
                        fill={true}
                        minimal={true}
                        text={literals[this.state.value]}
                    />
                </Select>
            </div>

        );
    }
}
