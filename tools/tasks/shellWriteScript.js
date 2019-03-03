const fs = require("fs");
module.exports = function(context, args) {
	fs.writeFileSync(context.shellcwd + "/app/src/main/assets/script.js", args[0]);
}