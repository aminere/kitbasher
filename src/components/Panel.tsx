import * as React from "react";
import { Icon } from "@blueprintjs/core";

interface IPanelProps {
    title: string;
    content: JSX.Element;
    controls?: JSX.Element;
}

interface IPanelState {
    collapsed: boolean;
}

export class Panel extends React.Component<IPanelProps, IPanelState> {

    constructor(props: IPanelProps) {
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
                    <div
                        style={{
                            position: "absolute",
                            right: "0px",
                            top: "0px"
                        }}
                    >
                        {this.props.controls}
                    </div>
                </div>
                <div
                    style={{
                        display: this.state.collapsed ? "none" : "block",
                        padding: "4px"
                    }}
                >
                    {this.props.content}
                </div>
            </div>
        );
    }
}
