
import * as React from "react";
import * as GoldenLayout from "golden-layout";
import { Button, FocusStyleManager } from "@blueprintjs/core";
import { NavBar } from "./NavBar";

import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";

// TODO move this to async container
import "../public/goldenlayout-base.css";
import "../public/goldenlayout-dark-theme.css";

export class App extends React.Component {
    
    private _layoutContainer!: HTMLDivElement;

    public componentDidMount() {
        FocusStyleManager.onlyShowFocusOnTabs();
    }

    public render() {

        const navbarWidth = "46px";
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "black"
                }}
            >
                <div
                    className="bp3-dark"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        overflow: "hidden"                      
                    }}
                >
                    <NavBar width={navbarWidth} />
                    <div 
                        ref={e => this._layoutContainer = e as HTMLDivElement}
                        style={{
                            width: `calc(100% - ${navbarWidth})`,
                            height: "100%",
                            float: "left",
                            zIndex: 0
                        }}
                    />
                </div>
            </div>
        );
    }

}
