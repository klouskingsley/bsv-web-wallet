const path = require("path");

module.exports = {
  entry: "./public-api.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "public-api.js",
  },
};

if (process.env.NODE_ENV !== "production") {
  module.exports.devtool = "source-map";
}
