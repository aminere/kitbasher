
import * as React from "react";
import { Tooltip, Button, Position, Intent } from "@blueprintjs/core";
import { State } from "../State";
import { Grid } from "../Types";

export class PlaneSelector extends React.Component {
    public render() {
        const { grid } = State.instance;
        const selector = (name: string, value: Grid) => {
            return (
                <div style={{ padding: "4px" }}>
                    <Tooltip content={name} position={Position.BOTTOM}>
                        <Button
                            active={grid === value}
                            intent={grid === value ? Intent.PRIMARY : Intent.NONE}
                            onClick={() => {
                                State.instance.grid = value;
                                this.forceUpdate();
                            }}
                            onFocus={e => e.currentTarget.blur()}
                        >
                            {name}
                        </Button>
                    </Tooltip>
                </div>
            );
        };
        return (
            <div
                style={{
                    display: "flex"
                }}
            >
                {selector("X", Grid.X)}
                {selector("Y", Grid.Y)}
                {selector("Z", Grid.Z)}
            </div>
        );
    }
}
