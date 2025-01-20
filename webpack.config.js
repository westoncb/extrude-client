const path = require("path");

module.exports = {
  mode: "development", // Use 'development' for better debugging
  entry: "./index.js", // The entry point of your app
  output: {
    path: path.resolve(__dirname, "dist"), // Output directory
    filename: "bundle.js", // Output file name
  },
  target: "node", // Since it's a server, target Node.js
  devtool: "source-map", // Enable source maps
  module: {
    rules: [
      {
        test: /\.m?js$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: [
          /node_modules\/@mediapipe\/tasks-vision/, // Ignore this module
        ],
      },
      {
        test: /\.js$/, // Apply this rule to JavaScript files
        exclude: /node_modules/, // Exclude dependencies
        use: {
          loader: "babel-loader", // Transpile ES6+ to ES5
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".js"], // Resolve these extensions
  },
};
