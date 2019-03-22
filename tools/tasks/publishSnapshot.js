module.exports = function(context, args) {
	var promise;
	if (Array.isArray(args)) {
		if (args[1] == "rebuild") {
			promise = context.execute("buildSnapshot", args);
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
			localPath : context.cwd + "/dist/snapshot/snapshot.json",
			remotePath : "snapshot.json"
		}))
		.then(context.pipe("publishFile", {
			localPath : context.cwd + "/dist/snapshot/snapshot.js",
			remotePath : "snapshot.js"
		}))
		.then(context.pipe("endPublish"));
}
module.exports.input = "cli";