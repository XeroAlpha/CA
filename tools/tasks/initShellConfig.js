const fs = require("fs");
const readConfig = require("../readconfig");

module.exports = function(context, args) {
	context.shellConfig = readConfig(fs.readFileSync("./config/shell.txt", "utf-8"));
	context.shellConfig.dexPath = "/app/build/intermediates/dex/release/mergeDexRelease/out/classes.dex";
}