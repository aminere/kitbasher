
import * as React from "react";
import { Texture2D } from "../../../../spider-engine/src/graphics/Texture2D";
import { Select } from "@blueprintjs/select";
import { Textures } from "../../Textures";
import { MenuItem } from "@blueprintjs/core";

interface ITexturePickerProps {
    initialTexture: Texture2D | null;
    name: string;
    onChange: (newTexture: Texture2D | null) => void;
}

interface IColorPickerState {
    texture: Texture2D | null;
}

export class TexturePicker extends React.Component<ITexturePickerProps, IColorPickerState> {

    constructor(props: ITexturePickerProps) {
        super(props);
        this.state = {
            texture: props.initialTexture
        };
    }

    public render() {

        const makeImage = (texture: Texture2D | null) => {
            const size = "30px";
            if (!texture) {
                return <div style={{ width: size, height: size }} />;
            }
            return (
                <img
                    src={texture.image.src}
                    width={size}
                    height={size}
                    style={{
                        borderRadius: 4
                    }}
                />
            );
        };

        return (
            <div
                style={{ 
                    padding: "0px 8px",
                    textAlign: "center"
                }}
            >
                <Select
                    items={[null, ...Textures.textures]}
                    itemRenderer={(item, { handleClick, modifiers }) => {
                        if (!modifiers.matchesPredicate) {
                            return null;
                        }
                        return (                            
                            <MenuItem
                                active={modifiers.active}
                                key={item ? item.id : 0}
                                onClick={handleClick}
                                text={item?.name ?? "None"}
                                labelElement={makeImage(item)}
                            />
                        );
                    }}
                    onItemSelect={newTexture => {
                        this.setState({ texture: newTexture });
                        this.props.onChange(newTexture);
                    }}
                    itemPredicate={(query, item, index, exactMatch) => {
                        const lower = query.toLowerCase();
                        if (lower.length === 0) {
                            return true;
                        }
                        const name = item?.name.toLowerCase();
                        return Boolean(name) && (name as string).indexOf(lower) >= 0;
                    }}
                    activeItem={this.state.texture}
                >
                    <div
                        style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: 4,
                            cursor: "pointer",
                            boxShadow: "0px 0px 0px 1px rgba(0, 0, 0, .70)",
                            margin: "0 auto"
                        }}
                    >
                        {makeImage(this.state.texture)}
                    </div>
                </Select>
                <div style={{ marginTop: "4px" }}>{this.props.name}</div>
            </div>
        );
    }
}
