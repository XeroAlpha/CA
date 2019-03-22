const ssh2 = require("ssh2");
var sftpInterface = {
	upload : function(context, args) {
		return context.execute("sftpPut", {
			session : this,
			localPath : args.localPath,
			remotePath : args.remotePath
		});
	},
	close : function(context) {
		return context.execute("sftpDisconnect", {
			session : this
		});
	}
}
module.exports = function(context, args) {
	var publishCfg = context.publishConfig;
	if (!publishCfg) throw new Error("publishConfig not found");
	if (publishCfg.method == "sftp") {
		return context.execute("sftpConnect", publishCfg.sshConfig)
			.then(function(v) {
				var o = Object.create(sftpInterface);
				o.sftp = v.sftp;
				o.connection = v.connection;
				return o;
			});
	} else {
		throw new Error("Unknown publish method: " + publishCfg.method);
	}
}