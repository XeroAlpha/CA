const fs = require("fs");
const child_process = require("child_process");
module.exports = function(context, args) {
	var child = child_process.spawnSync(context.shellConfig.jarsignerPath, [
		"-verbose",
		"-keystore", context.shellcwd + "/app/signatures/release.keystore",
		"-signedjar", context.shellcwd + "/app/build/outputs/apk/release/app-release-unaligned.apk",
		context.shellcwd + "/app/build/outputs/apk/release/app-release-unsigned.apk",
		"appkey"
	], {
		cwd : context.shellcwd,
		input : fs.readFileSync(context.shellcwd + "/app/signatures/release.password")
	});
	if (child.error) throw error;
}