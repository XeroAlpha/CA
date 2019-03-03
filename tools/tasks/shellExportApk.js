const fs = require("fs");
module.exports = function(context, args) {
	fs.copyFileSync(context.shellcwd + "/app/build/outputs/apk/release/app-release.apk", context.cwd + "/dist/releaseApk/app-release.apk");
	fs.copyFileSync(context.cwd + "/dist/releaseApk/app-release.apk", context.cwd + "/dist/命令助手(" + context.buildConfig.version + ").apk");
}