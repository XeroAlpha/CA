module.exports = function(context, args) {
	return args[0].upload(context, {
			localPath : args[1].localPath,
			remotePath : context.publishConfig.remotePath + "/" + args[1].remotePath
		})
		.then(() => args[0]);
}