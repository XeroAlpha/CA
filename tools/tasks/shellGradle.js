const process = require("process");
const child_process = require("child_process");
module.exports = function(context, args) {
	return new Promise(function(resolve, reject) {
		var cmd = "gradlew --console plain " + args;
		console.log("Running " + args);
		var child = child_process.exec(cmd, {
			cwd : context.shellcwd
		}, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
	});
}