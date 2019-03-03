const process = require("process");
const child_process = require("child_process");
module.exports = function(context, args) {
	return new Promise(function(resolve, reject) {
		var cmd = "gradlew --console plain " + args;
		console.log("Running " + cmd);
		var child = child_process.exec(cmd, {
			cwd : context.shellcwd
		}, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else {
				console.log(stdout);
				resolve();
			}
		});
	});
}