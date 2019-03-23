module.exports = function(context, args) {
	var promise;
	if (Array.isArray(args)) {
		if (args[1] == "rebuild") {
			var buildArgs = args.slice();
			buildArgs.splice(1, 1);
			promise = context.execute("shellBuildReleaseHotfix", buildArgs);
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
			localPath : context.cwd + "/dist/hotfixApk/release.js",
			remotePath : "hotfix/release.js"
		}))
		.then(context.pipe("publishFile", {
			localPath : context.cwd + "/dist/hotfixApk/release.sign",
			remotePath : "hotfix/release.sign"
		}))
		.then(context.pipe("publishFile", {
			localPath : context.cwd + "/dist/hotfixApk/release.json",
			remotePath : "hotfix.json"
		}))
		.then(context.pipe("endPublish"));
}
module.exports.input = "cli";