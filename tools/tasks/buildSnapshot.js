module.exports = function(context, args) {
	context.cwd = args[0];
	return context.execute("initDirectory")
		.then(context.task("getBuildConfig", "snapshot"))
		.then(context.task("getSourceCode"))
		.then(context.pipe("preprocessSnapshot"))
		.then(context.pipe("writeSnapshot"))
		.then(context.task("writeUpdate"));
}
module.exports.input = "cli";