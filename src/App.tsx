
import * as React from "react";
import { Button } from "@blueprintjs/core";

import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";

export class App extends React.Component {
    public render() {
        return (
            <div>
                <Button intent="primary" text="Hello World" />
            </div>
        );
    }
}
