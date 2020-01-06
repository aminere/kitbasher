
import * as React from "react";
import { Utils } from "../Utils";

export interface IKitItemProps {
    id: string;
    name: string;
    image: HTMLImageElement;
    isSelected: () => boolean;
    onClicked: () => void;
}

export class KitItem extends React.Component<IKitItemProps, {}> {

    private _canvas!: HTMLCanvasElement;

    public componentDidMount() {
        const { image } = this.props;
        const scale = this._canvas.width / image.width;
        const context = this._canvas.getContext("2d") as CanvasRenderingContext2D;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        const yPos = Math.max((this._canvas.height - (image.height * scale)) / 2, 0);
        context.drawImage(image, 0, yPos, image.width * scale, image.height * scale);
    }

    public render() {
        return (
            <div
                style={{
                    float: "left",
                    textAlign: "center",
                    width: "64px",
                    height: "80px",
                    position: "relative"
                }}
            >
                <canvas
                    ref={e => this._canvas = e as HTMLCanvasElement}
                    width={64}
                    height={64}
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
