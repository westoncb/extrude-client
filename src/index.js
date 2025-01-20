import React from "react";
import ReactDOM from "react-dom/client"; // Note the change in import path
import "./index.css";
import App from "./App";
// If you no longer use service workers, you can remove this import entirely
import * as serviceWorker from "./serviceWorker";

// Create a root for rendering
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
