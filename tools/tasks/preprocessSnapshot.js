module.exports = function(context, args) {
	return args[0].replace(/\{DATE\}/g, "S" + context.buildConfig.date);
}