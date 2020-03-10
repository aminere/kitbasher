import * as React from "react";
import { Icon } from "@blueprintjs/core";

interface IMultiPanelProps {
    title: string;
}

interface IMultiPanelState {
    collapsed: boolean;
}

export class MultiPanel extends React.Component<IMultiPanelProps, IMultiPanelState> {

    constructor(props: IMultiPanelProps) {
        super(props);
        this.state = {
            collapsed: false
        };
    }

    public render() {
        const borderRadius = "8px";
        return (
            <div
                style={{
                    margin: "4px",
                    backgroundColor: "rgba(32, 43, 51, .9)",
                    borderRadius
                }}
            >
                <div
                    className="unselectable"
                    style={{
                        height: "38px",
                        backgroundColor: "rgba(84, 99, 111, 0.5)",
                        borderRadius,
                        textShadow: "black 1px 1px",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        position: "relative"
                    }}
                    onClick={() => {
                        this.setState({ collapsed: !this.state.collapsed });
                    }}
                >
                    <div style={{ padding: "4px" }}>
                        <Icon icon={this.state.collapsed ? "chevron-right" : "chevron-down"} />
                        <span>{this.props.title}</span>
                    </div>
                </div>
                <div
                    style={{
                        display: this.state.collapsed ? "none" : "block",
                    }}
                >
                    {this.props.children}
                </div>
            </div>
        );
    }
}
