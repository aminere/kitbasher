
import * as React from "react";

export class LoadingIndicator extends React.Component {
    render() {
        return (
            <div
                style={{
                    width: "32px",
                    height: "32px",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    margin: "-16px 0 0 -16px"
                }}
                className="fr-loader"
            />
        );
    }
}
