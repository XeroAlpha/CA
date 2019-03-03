const fs = require("fs");
const crypto = require("crypto");
module.exports = function(context, args) {
	var signature = crypto.createSign("RSA-SHA256");
	signature.update(args[0]);
	var signBytes = signature.sign(fs.readFileSync(context.shellcwd + "/app/signatures/privatekey.pem").toString());
	var versionBytes = Buffer.alloc(4);
	versionBytes.writeInt32LE(context.gradleConfig.versionCode, 0);
	fs.writeFileSync(context.cwd + "/dist/hotfixApk/hotfix.sign", Buffer.concat([versionBytes, signBytes]));
	return args[0];
}