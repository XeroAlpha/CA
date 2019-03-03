module.exports = function(context, args) {
	context.cwd = args[0];
	context.shellcwd = args[1];
	context.shellsign = args[2];
	return context.execute("initDirectory")
		.then(context.task("initShellConfig"))
		.then(context.task("getBuildConfig", "release"))
		.then(context.task("shellUpdateGradle"))
		.then(context.task("shellGradle", ":app:buildRelease"))
		.then(context.task("getSourceCode"))
		.then(context.pipe("minifyJS"))
		.then(context.pipe("preprocessRelease"))
		.then(context.pipe("writeMinify"))
		.then(function self(script) {
			return context.execute("shellAddDexVerify", [script])
				.then(context.pipe("shellEncryptScript"))
				.then(context.pipe("shellWriteScript"))
				.then(context.task("shellPrepareHotfix", [script]))
				.then(context.pipe("shellEncryptScript"))
				.then(context.pipe("shellWriteHotfix"))
				.then(context.pipe("shellWriteHotfixSign"))
				.then(context.pipe("shellWriteHotfixLib"))
				.then(context.task("shellGradle", ":app:assembleRelease"))
				.then(context.pipe("shellCheckDexUnchanged"))
				.then(unchanged => unchanged ? null : self(script));
		})
		.then(context.task("shellSignApk"))
		.then(context.task("shellAlignApk"))
		.then(context.task("shellExportApk"))
		.then(context.task("shellWriteUpdate"));
}
module.exports.input = "cli";