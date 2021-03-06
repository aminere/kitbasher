
import * as React from "react";
import { PaletteSlot } from "../../palette/PaletteSlot";
import { Select } from "@blueprintjs/select";
import { RTTI } from "../../../../spider-engine/src/core/RTTI";
import { MenuItem, Button } from "@blueprintjs/core";
import { Interfaces } from "../../../../spider-engine/src/core/Interfaces";
import { PaletteSlotViewFactory } from "./PaletteSlotViewFactory";
import "./paletteslotview.css";

interface IPaletteSlotViewProps {
    index: number;
    initialSlot: PaletteSlot;
    onChange: (newSlot: PaletteSlot) => void;
    onDelete?: () => void;
}

interface IPaletteSlotViewState {
    slot: PaletteSlot;
}

namespace Private {
    export function formatSlotName(name: string) {
        return name.slice(0, -"Slot".length);
    }
}

export class PaletteSlotView extends React.Component<IPaletteSlotViewProps, IPaletteSlotViewState> {

    constructor(props: IPaletteSlotViewProps) {
        super(props);
        this.state = {
            slot: props.initialSlot
        };
    }

    public UNSAFE_componentWillReceiveProps(nextProps: IPaletteSlotViewProps) {
        if (nextProps.initialSlot !== this.state.slot) {
            this.setState({
                slot: nextProps.initialSlot
            });
        }
    }

    public render() {
        const { index, onDelete } = this.props;
        const { slot } = this.state;
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
                        {index}
                    </div>
                    <div
                        className="select-fill"
                        style={{
                            flexGrow: 1
                        }}
                    >
                        <Select
                            items={RTTI.getDerivedObjectTypes("PaletteSlot")}
                            itemRenderer={(item, { handleClick, modifiers }) => {
                                if (!modifiers.matchesPredicate) {
                                    return null;
                                }
                                return (
                                    <MenuItem
                                        active={modifiers.active}
                                        key={item}
                                        onClick={handleClick}
                                        text={Private.formatSlotName(item)}
                                    />
                                );
                            }}
                            onItemSelect={newType => {
                                const newSlot = Interfaces.factory.createObject(newType) as PaletteSlot;
                                this.setState({ slot: newSlot });
                                this.props.onChange(newSlot);
                            }}
                            filterable={false}
                            activeItem={slot.constructor.name}
                        >
                            <Button
                                fill={true}
                                minimal={true}
                                rightIcon="caret-down"
                                text={Private.formatSlotName(slot.constructor.name)}
                            />
                        </Select>
                    </div>
                    {
                        onDelete
                        &&
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <Button
                                icon="cross"
                                minimal={true}
                                onClick={() => {
                                    if (onDelete) {
                                        onDelete();
                                    }
                                }}
                            />
                        </div>
                    }
                </div>
                {PaletteSlotViewFactory.create(slot, () => this.props.onChange(slot))}
            </div>
        );
    }
}
