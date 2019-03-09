const fs = require("fs");
module.exports = function(context, args) {
	fs.writeFileSync(context.cwd + "/dist/hotfixApk/" + context.buildConfig.variants + ".js", args[0]);
	return args[0];
}