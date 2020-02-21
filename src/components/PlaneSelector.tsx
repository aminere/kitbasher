
import * as React from "react";
import { Tooltip, Button, Position, Intent } from "@blueprintjs/core";
import { State } from "../State";
import { Plane } from "../Types";

export class PlaneSelector extends React.Component {
    public render() {
        const { grid } = State.instance;
        const selector = (name: string, value: Plane) => {
            return (
                <div key={name} style={{ padding: "4px" }}>
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
        return [
            selector("X", Plane.X),
            selector("Y", Plane.Y),
            selector("Z", Plane.Z)
        ];
    }
}
