const fs = require("fs");
function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}
module.exports = function(context, args) {
	ensureDir(context.cwd + "/build");
	ensureDir(context.cwd + "/dist");
	ensureDir(context.cwd + "/dist/release"); //js
	ensureDir(context.cwd + "/dist/snapshot"); //snapshot lib
	ensureDir(context.cwd + "/dist/hotfix"); //hotfix lib
	ensureDir(context.cwd + "/dist/releaseApk"); //apk
	ensureDir(context.cwd + "/dist/hotfixApk"); //apk hotfix
	return 1;
}