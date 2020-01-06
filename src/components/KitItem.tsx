
import * as React from "react";
import { Utils } from "../Utils";

export interface IKitItemProps {
    id: string;
    name: string;
    image: HTMLImageElement;
    isSelected: () => boolean;
    onClicked: () => void;
}

export interface IKitItemState {
    backgroundColor: string;
    hovered: boolean;
}

export class KitItem extends React.Component<IKitItemProps, IKitItemState> {

    private _canvas!: HTMLCanvasElement;

    constructor(props: IKitItemProps) {
        super(props);
        this.state = {
            backgroundColor: "transparent",
            hovered: false
        };
    }

    public componentDidMount() {
        const { image } = this.props;
        const scale = this._canvas.width / image.width;
        const context = this._canvas.getContext("2d") as CanvasRenderingContext2D;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        const yPos = Math.max((this._canvas.height - (image.height * scale)) / 2, 0);
        context.drawImage(image, 0, yPos, image.width * scale, image.height * scale);
    }

    public render() {

        const selected = this.props.isSelected();
        const { hovered } = this.state;
        // Chrome hack because css :hover state is not updated during a drag-and-drop!
        let backgroundColor = "transparent";        
        if (selected) {
            backgroundColor = "#137cbd";
        } else {
            if (this.state.hovered) {
                backgroundColor = "#273139";
            }
        }

        return (
            <div
                style={{
                    float: "left",
                    textAlign: "center",
                    width: "64px",
                    height: "80px",
                    cursor: "pointer",
                    position: "relative"
                }}
                onMouseEnter={e => {
                    if (!hovered) {
                        this.setState({ hovered: true });
                    }
                }}
                onMouseLeave={e => {
                    if (hovered) {
                        this.setState({ hovered: false });
                    }
                }}
                onClick={e => {
                    e.stopPropagation();
                    this.props.onClicked();
                }}
            >
                <canvas
                    ref={e => this._canvas = e as HTMLCanvasElement}
                    width={64}
                    height={64}
                />
                <div
                    key="2"
                    style={{
                        position: "absolute",
                        left: "0px",
                        top: "0px",
                        width: "100%",
                        height: "100%",
                        backgroundColor,
                        opacity: .5
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: "100%"
                    }}
                >
                    {Utils.capitalize(this.props.name)}
                </div>
            </div>
        );
    }
}
