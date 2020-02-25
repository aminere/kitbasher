import * as React from "react";

interface INavBarProps {
    width: string;
}

export class NavBar extends React.Component<INavBarProps> {

    public render() {
        return (
            <div
                style={{
                    backgroundColor: "#182026",
                    float: "left",
                    width: this.props.width,
                    height: "100%",
                    zIndex: 2,
                    position: "relative",
                    paddingTop: "15px"
                }}
            >
                <div className="pt-button-group pt-vertical">                    
                    
                </div>
            </div>
        );
    }
}
