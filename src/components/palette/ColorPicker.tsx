
import * as React from "react";
import { RGBColor } from "react-color";
import { Color } from "../../../../spider-engine/src/graphics/Color";
import { Commands } from "../../Commands";
import { ChromePickerWrapper } from "./ChromePickerWrapper";

interface IColorPickerProps {
    initialColor: Color;
    name?: string;
    onChange: (newColor: Color) => void;
}

interface IColorPickerState {
    color: RGBColor;
}

export class ColorPicker extends React.Component<IColorPickerProps, IColorPickerState> {

    constructor(props: IColorPickerProps) {
        super(props);
        this.state = {
            color: props.initialColor.toChromeColor()
        };
    }

    public render() {
        const c = this.state.color;
        const { name } = this.props;
        return (
            <div
                style={{ padding: "0px 8px" }}
            >
                <div
                    style={{
                        width: "30px",
                        height: "30px",
                        backgroundColor: `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`,
                        borderRadius: 4,
                        cursor: "pointer",
                        boxShadow: "0px 0px 0px 1px rgba(0, 0, 0, 1)",
                        margin: "0 auto"
                    }}
                    onClick={e => {
                        Commands.showPopover.post({
                            clientX: e.clientX,
                            clientY: e.clientY,
                            targetRect: e.currentTarget.getBoundingClientRect(),
                            content: (
                                <div onKeyUp={_e => _e.stopPropagation()}>
                                    <ChromePickerWrapper
                                        initialColor={this.state.color}
                                        onChange={newColor => {
                                            this.setState({ color: newColor.rgb });
                                            const { r, g, b, a } = newColor.rgb;
                                            this.props.onChange(new Color().setFromChromeColor(r, g, b, a ?? 1));
                                        }}
                                    />
                                </div>
                            )
                        });
                    }}
                />
                {
                    name
                    &&
                    <div style={{ marginTop: "4px" }}>{name}</div>
                }
            </div>

        );
    }
}
