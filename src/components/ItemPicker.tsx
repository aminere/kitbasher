
import * as React from "react";
import { LoadingIndicator } from "./LoadingIndicator";

interface IItemPickerProps {
    name: string;
}

export class ItemPicker extends React.Component<IItemPickerProps> {
    public render() {
        const {
            name
        } = this.props;

        return (
            <div>
                <div>
                    <button
                        type="button"
                        className={`pt-button pt-fill pt-minimal fr-popover-target`}
                        style={{
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textAlign: "left",
                            display: "inline"
                        }}
                        onClick={e => this.onPick(e)}
                    >
                        {name}
                    </button>
                </div>
            </div>
        );
    }

    private onPick(e: React.MouseEvent<HTMLElement>) {
        
    }
}
