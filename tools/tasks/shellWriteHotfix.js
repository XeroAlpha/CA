const fs = require("fs");
module.exports = function(context, args) {
	fs.writeFileSync(context.cwd + "/dist/hotfixApk/hotfix.js", args[0]);
	return args[0];
}