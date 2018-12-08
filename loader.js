const fs = require("fs");
function parentDir(path) {
	var sp;
	path = fs.realpathSync(path).replace(/\\/g, "/");
	sp = path.lastIndexOf("/")
	return sp < 0 ? null : path.slice(0, sp);
}
function addFrontSpace(arr, frontSpace) {
	var i;
	for (i = 1; i < arr.length; i++) {
		arr[i] = frontSpace + arr[i];
	}
}
function preprocess(code, source, parentDir, path, charset) {
	eval(code);
	return source;
}
function load(path, charset) {
	var r = fs.readFileSync(path, charset), i;
	var parent = parentDir(path);
	var processer = (/\/\*LOADER\s([\s\S]+?)\*\//).exec(r);
	if (processer) {
		r = preprocess(processer[1], r, parent, path, charset);
	}
	r = r.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
	for (i = 0; i < r.length; i++) {
		r[i] = r[i].replace(/Loader.fromFile\("(.+)"\)/g, function(match, mpath) {
			var frontSpace = r[i].match(/^\s*/);
			var res = load(parent ? parent + "/" + mpath : mpath, charset);
			if (frontSpace) {
				addFrontSpace(res, frontSpace[0]);
			}
			return res.join("\n");
		});
	}
	return r;
}
module.exports = {
	load : function(path, charset) {
		return load(path, charset || "utf-8").join("\n");
	}
}