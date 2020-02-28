
import * as React from "react";
import { Utils } from "../Utils";

export interface IContentItemProps {
    id: string;
    name: string;
    image: HTMLImageElement;
    rounded?: boolean;
    isSelected: () => boolean;
    onClicked: () => void;
}

export class ContentItem extends React.Component<IContentItemProps> {
    public render() {
        return (
            <div
                style={{
                    float: "left",
                    textAlign: "center",
                    width: "60px",
                    height: "76px",
                    position: "relative",
                    margin: "4px"
                }}
            >
                <img 
                    style={{
                        width: "60px",
                        height: "60px"
                    }}
                    src={this.props.image.src} 
                />
                <div
                    className="hoverable"
                    style={{
                        position: "absolute",
                        left: "0px",
                        top: "0px",
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        backgroundColor: this.props.isSelected() ? "#137cbd" : undefined,
                        opacity: .5
                    }}
                    onClick={e => {
                        e.stopPropagation();
                        this.props.onClicked();
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        pointerEvents: "none"
                    }}
                >
                    {Utils.capitalize(this.props.name)}
                </div>
            </div>
        );
    }
}
