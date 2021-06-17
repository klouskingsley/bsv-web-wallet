const Buffer = require("buffer/index").Buffer;

if (typeof window !== "undefined" && typeof window.Buffer === "undefined") {
  window.Buffer = Buffer;
}
