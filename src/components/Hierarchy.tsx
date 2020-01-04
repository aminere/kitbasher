
import * as React from "react";
import { Events } from "../Events";
import { State } from "../State";

export class Hierarchy extends React.Component {
    public componentDidMount() {
        if (State.engineReady) {
            this.onEngineReady();
        } else {
            this.onEngineReady = this.onEngineReady.bind(this);
            Events.engineReady.attach(this.onEngineReady);
        }
    }

    public render() {
        return (
            <div>
                Hierarchy
            </div>
        );
    }

    private onEngineReady() {
        // TODO populate
    }
}
