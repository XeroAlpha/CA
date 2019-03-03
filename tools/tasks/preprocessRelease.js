module.exports = function(context, args) {
	return args[0]
		.replace(/\{DATE\}/g, context.buildConfig.date)
		.replace(/"IGNORELN_START";([^]*?)"IGNORELN_END";/g, function(match, p) {
			return p.replace(/\s*\n\s*/g, "");
		}) //去除部分换行符
		.replace(/^\s*/, "") //去除开头多余的空行
		.replace(/^"ui";\n/, "").replace(/CA\.RELEASE/g, "true"); //去除UI标志，标记正式版
}