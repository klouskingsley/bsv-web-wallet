const path = require("path");

module.exports = {
  entry: "./public-api.js",
  optimization: {
    minimize: false,
  },
  output: {
    library: "bsvWebWallet",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "dist"),
    filename: "public-api.js",
  },
};