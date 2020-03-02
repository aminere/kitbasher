
import * as React from "react";
import { Select } from "@blueprintjs/select";
import { MenuItem, Button } from "@blueprintjs/core";
import { Palette } from "../../palette/Palette";

interface IPaletteSlotSetterProps {
    materialIndex: number;
    initialPaletteSlot: number;
    onChange: (newSlotIndex: number) => void;
}

interface IPaletteSlotSetterState {
    paletteSlot: number;
}

export class PaletteSlotSetter extends React.Component<IPaletteSlotSetterProps, IPaletteSlotSetterState> {

    constructor(props: IPaletteSlotSetterProps) {
        super(props);
        this.state = {
            paletteSlot: props.initialPaletteSlot
        };
    }

    public UNSAFE_componentWillReceiveProps(nextProps: IPaletteSlotSetterProps) {
        if (nextProps.initialPaletteSlot !== this.state.paletteSlot) {
            this.setState({
                paletteSlot: nextProps.initialPaletteSlot
            });
        }
    }

    public render() {
        const { materialIndex, onChange } = this.props;
        const { paletteSlot } = this.state;
        return (
            <div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0px 8px"
                        }}
                    >
                        {materialIndex}
                    </div>
                    <div
                        className="select-fill"
                        style={{
                            flexGrow: 1
                        }}
                    >
                        <Select
                            items={Palette.materials.map((a, i) => i)}
                            itemRenderer={(item, { handleClick, modifiers }) => {
                                if (!modifiers.matchesPredicate) {
                                    return null;
                                }
                                return (
                                    <MenuItem
                                        active={modifiers.active}
                                        key={item}
                                        onClick={handleClick}
                                        text={`Slot ${item}`}
                                    />
                                );
                            }}
                            onItemSelect={newSlotIndex => {
                                this.setState({ paletteSlot: newSlotIndex });
                                this.props.onChange(newSlotIndex);
                            }}
                            filterable={false}
                            activeItem={paletteSlot}
                        >
                            <Button
                                fill={true}
                                minimal={true}
                                rightIcon="caret-down"
                                text={`Slot ${paletteSlot}`}
                            />
                        </Select>
                    </div>                    
                </div>
                {/* {PaletteSlotViewFactory.create(slot, () => this.props.onChange(slot))} */}
            </div>
        );
    }
}
