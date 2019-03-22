const fs = require("fs");
const readConfig = require("../readconfig");

module.exports = function(context, args) {
	context.buildConfig = readConfig(fs.readFileSync(context.cwd + "/buildinfo.txt", "utf-8"));
	context.buildConfig.variants = args;
	context.buildConfig.publishTime = Date.now();
}