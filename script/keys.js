const fs = require("fs");
const path = require("path");

async function main() {
  // read rsa keys from env
  // base64 decode
  // write to file
  const publicKey = process.env.github_public_key;
  const privateKey = process.env.github_private_key;

  //   const privateFile = path.resolve(__dirname, 'xxx')
  //   const publicFile = path.resolve(__dirname, 'yyy')

  const homeDir = require('os').homedir()
  const publicFile = path.resolve(homeDir, '.ssh/id_rsa.pub')
  const privateFile = path.resolve(homeDir, '.ssh/id_rsa')


//   console.log(privateFile, publicFile)

  fs.writeFileSync(publicFile, Buffer.from(publicKey, "base64"));
  fs.writeFileSync(privateFile, Buffer.from(privateKey, "base64"));
}

main();
