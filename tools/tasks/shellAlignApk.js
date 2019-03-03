const child_process = require("child_process");
module.exports = function(context, args) {
	var child = child_process.spawnSync(context.shellConfig.zipalignPath, [
		"-f", "4",
		context.shellcwd + "/app/build/outputs/apk/release/app-release-unaligned.apk",
		context.shellcwd + "/app/build/outputs/apk/release/app-release.apk"
	], {
		cwd : context.shellcwd,
		stdio : "pipe"
	});
	if (child.error) throw child.error;
}