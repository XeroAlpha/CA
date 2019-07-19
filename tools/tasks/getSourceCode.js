const fs = require("fs");
const loader = require("../loader");
module.exports = function(context, args) {
	var result = loader.load(context.cwd + "/main.js", null, { buildConfig : context.buildConfig });
	fs.writeFileSync(context.cwd + "/build/export.js", result);
	return result;
}