const fs = require("fs");
function rmdir(path) {
	if (!fs.existsSync(path)) return;
	var e, fn, files = fs.readdirSync(path);
	for (e of files) {
		if (fs.statSync(path + "/" + e).isDirectory()) {
			rmdir(path + "/" + e);
		} else {
			fs.unlinkSync(path + "/" + e);
		}
	}
	fs.rmdirSync(path);
}
module.exports = function(context, args) {
	context.cwd = args[0];
	rmdir(context.cwd + "/build");
	rmdir(context.cwd + "/dist");
	return 1;
}
module.exports.input = "cli";