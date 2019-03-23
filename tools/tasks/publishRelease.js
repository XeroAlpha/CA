module.exports = function(context, args) {
	var promise;
	if (Array.isArray(args)) {
		if (args[1] == "rebuild") {
			promise = context.execute("buildRelease", args);
		} else {
			context.cwd = args[0];
			promise = context.execute("initDirectory")
				.then(context.task("initUpdateConfig"));
		}
	} else {
		promise = Promise.resolve();
	}
	return promise.then(context.task("preparePublish"))
		.then(context.pipe("publishFile", {
			localPath : context.cwd + "/dist/update/release.json",
			remotePath : "update.json"
		}))
		.then(context.pipe("endPublish"));
}
module.exports.input = "cli";