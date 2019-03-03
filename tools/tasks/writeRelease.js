const fs = require("fs");
module.exports = function(context, args) {
	fs.writeFileSync(context.cwd + "/dist/release/release.js", args[0]);
	fs.copyFileSync(context.cwd + "/dist/release/release.js", context.cwd + "/dist/命令助手(" + context.buildConfig.date + ").js");
	return args[0];
}