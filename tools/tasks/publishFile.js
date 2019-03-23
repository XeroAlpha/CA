module.exports = function(context, args) {
	console.log("Publishing " + args[1].remotePath);
	return args[0].upload(context, {
			localPath : args[1].localPath,
			remotePath : context.publishConfig.remotePath + "/" + args[1].remotePath
		})
		.then(() => args[0]);
}