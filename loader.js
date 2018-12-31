const fs = require("fs");
var charset = "utf-8";
function getParentDir(path) {
	var sp;
	path = path.replace(/\\/g, "/");
	sp = path.lastIndexOf("/")
	return sp < 0 ? null : path.slice(0, sp);
}
function addFrontSpace(arr, frontSpace) {
	var i;
	for (i = 1; i < arr.length; i++) {
		arr[i] = frontSpace + arr[i];
	}
}
function preprocess(code, source, parentDir, path, charset, variables, setAfterFill, addFlags, removeFlags) {
	var TestOnly = () => addFlags("test");
	eval(code);
	return source;
}
var sourceCache = {};
function load(path, variables) {
	path = fs.realpathSync(path);
	if (path in sourceCache) return sourceCache[path];
	var r = fs.readFileSync(path, charset), i, afterFill, flags = {};
	var parent = getParentDir(path);
	var processer = (/\/\*LOADER\s([\s\S]+?)\*\//).exec(r);
	if (processer) {
		r = preprocess(processer[1], r, parent, path, charset, variables, function setAfterFill(f) {
			afterFill = f;
		}, function addFlags() {
			for (i = 0; i < arguments.length; i++) flags[arguments[i]] = true;
		}, function removeFlags() {
			for (i = 0; i < arguments.length; i++) flags[arguments[i]] = false;
		}).replace(/\/\*LOADER\s([\s\S]+?)\*\//, "");
		if (flags.test) return "";
	}
	r = r.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
	for (i = 0; i < r.length; i++) {
		r[i] = r[i].replace(/Loader.fromFile\("(.+)"\)/g, function(match, mpath) {
			var frontSpace = r[i].match(/^\s*/);
			var res = load(parent ? parent + "/" + mpath : mpath).split("\n");
			if (frontSpace) {
				addFrontSpace(res, frontSpace[0]);
			}
			return res.join("\n");
		});
	}
	r = r.join("\n");
	if (afterFill) {
		r = afterFill(r);
	}
	return sourceCache[path] = r;
}
module.exports = {
	load : function(path, cs, variables) {
		charset = cs || "utf-8";
		return load(path, variables);
	}
}