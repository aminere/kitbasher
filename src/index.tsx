
import * as ReactDOM from "react-dom";
import * as React from "react";
import { App } from "./App";

// Hack to make goldenlayout work
// It probably is no longer compatible with the latest version of React
Object.assign(window, { ReactDOM, React });

ReactDOM.render(<App />, document.getElementById("root"));
