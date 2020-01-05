
import * as React from "react";
import { Events } from "../Events";
import { Controller } from "../Controller";

export class Canvas extends React.Component {

    private _canvas!: HTMLCanvasElement;

    public componentDidMount() {
        Events.canvasMounted.post(this._canvas);
    }

    public render() {
        return (
            <div
                className="fill-parent"
                style={{
                    position: "relative",
                    backgroundColor: "rgb(30, 30, 30)"
                }}
            >
                <canvas
                    ref={e => this._canvas = e as HTMLCanvasElement}
                    className="fill-parent"
                    onMouseDown={e => Controller.onMouseDown(e)}
                    onMouseMove={e => this.handleMouseMove(e)}
                    onMouseUp={e => {
                        Controller.onMouseUp(
                            e,
                            e.clientX - e.currentTarget.getBoundingClientRect().left,
                            e.clientY - e.currentTarget.getBoundingClientRect().top
                        );
                    }}
                    onMouseLeave={e => {
                        Controller.onMouseLeave(
                            e,
                            e.clientX - e.currentTarget.getBoundingClientRect().left,
                            e.clientY - e.currentTarget.getBoundingClientRect().top
                        );
                    }}
                    onContextMenu={e => e.preventDefault()}
                />
            </div>
        );
    }

    private handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
        Controller.onMouseMove(
            e,
            e.clientX - this._canvas.getBoundingClientRect().left,
            e.clientY - this._canvas.getBoundingClientRect().top
        );
    }
}
