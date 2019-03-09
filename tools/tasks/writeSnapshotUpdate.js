const fs = require("fs");
const crypto = require("crypto");
function digestSHA1(data) {
	var digest = crypto.createHash("sha1");
	digest.update(data);
	return digest.digest("base64");
}
module.exports = function(context, args) {
	fs.writeFileSync(context.cwd + "/dist/snapshot/" + context.buildConfig.variants + ".json", JSON.stringify({
		"time": context.buildConfig.publishTime,
		"version": context.buildConfig.date,
		"belongs": context.buildConfig.version,
		"info": context.buildConfig.description,
		"snapshot" : {
			"url": context.updateConfig.pageUrl + context.buildConfig.variants + ".js",
			"sha1": digestSHA1(fs.readFileSync(context.cwd + "/dist/snapshot/" + context.buildConfig.variants + ".js"))
		}
	}));
}