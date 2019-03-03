module.exports = function(context, args) {
	context.cwd = args[0];
	context.shellcwd = args[1];
	context.shellsign = args[2];
	return context.execute("initDirectory")
		.then(context.task("getBuildConfig", "debug"))
		.then(context.task("getSourceCode"))
		.then(context.pipe("shellEncryptScript"))
		.then(context.pipe("shellWriteScript"))
		.then(context.task("shellUpdateGradle"));
}