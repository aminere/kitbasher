
import * as React from "react";
import { ChromePicker, RGBColor, ColorResult } from "react-color";

interface IChromePickerWrapperProps {
    initialColor: RGBColor;
    onChange: (newColor: ColorResult) => void;
}

interface IChromePickerWrapperState {
    color: RGBColor;
}

export class ChromePickerWrapper extends React.Component<
    IChromePickerWrapperProps,
    IChromePickerWrapperState
    > {

    constructor(props: IChromePickerWrapperProps) {
        super(props);
        this.state = {
            color: props.initialColor
        };
    }

    public render() {

        const onChange = (color: ColorResult) => {
            this.setState({ color: color.rgb });
            this.props.onChange(color);
        };

        return (
            <ChromePicker
                color={this.state.color}
                onChange={onChange}
                onChangeComplete={onChange}
            />
        );
    }
}
