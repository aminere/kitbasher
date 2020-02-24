
import * as React from "react";
import { ContentItem, IContentItemProps } from "./ContentItem";

interface IItemContainerProps {
    items: IContentItemProps[];
    onClick: () => void;
}

export class ItemContainer extends React.Component<IItemContainerProps, {}> {
    public render() {
        return (
            <div
                className="fill-parent"
                style={{ overflow: "auto " }}
                onClick={() => this.props.onClick()}
            >
                {this.props.items.map(i => (
                    <ContentItem
                        key={i.id}
                        {...i}
                    />
                ))}
            </div>
        );
    }
}
