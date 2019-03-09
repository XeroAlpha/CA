module.exports = function(context, args) {
	context.cwd = args[0];
	context.shellcwd = args[1];
	context.shellsign = args[2];
	return context.execute("initDirectory")
		.then(context.task("initShellConfig"))
		.then(context.task("initUpdateConfig"))
		.then(context.task("getBuildConfig", "release"))
		.then(context.task("shellUpdateGradle"))
		.then(context.task("getSourceCode"))
		.then(context.pipe("minifyJS"))
		.then(context.pipe("preprocessRelease"))
		.then(context.pipe("writeMinify"))
		.then(context.pipe("shellPrepareHotfix"))
		.then(context.pipe("shellEncryptScript"))
		.then(context.pipe("shellWriteHotfix"))
		.then(context.pipe("shellWriteHotfixSign"))
		.then(context.pipe("shellWriteHotfixLib"))
		.then(context.task("shellWriteUpdate"));
}
module.exports.input = "cli";