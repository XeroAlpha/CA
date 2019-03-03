const fs = require("fs");
module.exports = function(context, args) {
	fs.writeFileSync(context.cwd + "/build/min.js", args[0]);
	return args[0];
}