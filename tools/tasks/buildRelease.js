module.exports = function(context, args) {
	context.cwd = args[0];
	return context.execute("initDirectory")
		.then(context.task("getBuildConfig", "release"))
		.then(context.task("getSourceCode"))
		.then(context.pipe("minifyJS"))
		.then(context.pipe("preprocessRelease"))
		.then(context.pipe("writeMinify"))
		.then(context.pipe("compressRelease"))
		.then(context.pipe("writeRelease"))
		.then(context.task("writeUpdate"));
}