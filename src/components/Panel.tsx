import * as React from "react";
import { Icon } from "@blueprintjs/core";

interface IPanelProps {
    title: string;
    content: JSX.Element;
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
        return (
            <div
                style={{
                    margin: "4px",
                    backgroundColor: "rgba(32, 43, 51, .9)"
                }}
            >
                <div
                    className="unselectable"
                    style={{
                        height: "26px",
                        padding: "4px"
                    }}
                    onClick={() => {
                        this.setState({ collapsed: !this.state.collapsed });
                    }}
                >
                    <Icon icon={this.state.collapsed ? "chevron-right" : "chevron-down"} />
                    <span>{this.props.title}</span>
                </div>
                <div
                    style={{
                        display: this.state.collapsed ? "none" : "block"
                    }}
                >
                    {this.props.content}
                </div>
            </div>
        );
    }
}
