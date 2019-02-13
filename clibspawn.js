var fs = require("fs");
var process = require("process");
var crypto = require("crypto");
var js2lib = require("./js2lib");
var js2signlib = require("./js2signlib");

function main(path) {
	console.log("Reading config...");
	var i, s, libs = JSON.parse(fs.readFileSync(path, "utf-8")), libslock;
	process.chdir(path + "/../");
	try {
		libslock = JSON.parse(fs.readFileSync(libs.lockFile, "utf-8"));
	} catch(e) {}
	if (!libslock) libslock = {
		clib : {}
	};
	var index = [], map = {};
	for (i in libs.public) {
		if (libs.public[i].src) {
			console.log("Compiling " + libs.public[i].name);
			s = digestSHA1(fs.readFileSync(libs.public[i].src));
			if (libslock.clib[libs.public[i].uuid] != s) {
				if (libs.signKey) {
					js2signlib(libs.public[i].src, libs.signKey, libs.sourceDir + libs.public[i].id + ".lib");
				} else {
					js2lib(libs.public[i].src, libs.sourceDir + libs.public[i].id + ".lib");
				}
				libslock.clib[libs.public[i].uuid] = s;
			}
		}
		console.log("Indexing " + libs.public[i].name);
		index.push(toIndex(libs.public[i], libs));
		fs.writeFileSync(libs.sourceDir + libs.public[i].id + ".json", JSON.stringify(toUpdate(libs.public[i], libs)));
		map[libs.public[i].uuid] = libs.sourceUrl + libs.public[i].id + ".json"
	}
	for (i in libs.private) {
		if (libs.private[i].src) {
			console.log("Compiling " + libs.private[i].name);
			s = digestSHA1(fs.readFileSync(libs.private[i].src));
			if (libslock.clib[libs.private[i].uuid] != s) {
				if (libs.signKey) {
					js2signlib(libs.private[i].src, libs.signKey, libs.sourceDir + libs.private[i].id + ".lib");
				} else {
					js2lib(libs.private[i].src, libs.sourceDir + libs.private[i].id + ".lib");
				}
				libslock.clib[libs.private[i].uuid] = s;
			}
		}
		console.log("Indexing " + libs.private[i].name);
		fs.writeFileSync(libs.sourceDir + libs.private[i].id + ".json", JSON.stringify(toUpdate(libs.private[i], libs)));
		map[libs.private[i].uuid] = libs.sourceUrl + libs.private[i].id + ".json";
	}
	for (i in libs.store) {
		console.log("Indexing " + libs.store[i].name);
		index.push(toIndex(libs.store[i], libs));
		map[libs.store[i].uuid] = libs.store[i].updateurl;
	}
	console.log("Wrinting Index...");
	for (i = 0, s = 0; i < index.length; i += libs.pageLimit, s++) {
		fs.writeFileSync(libs.sourceDir + "index" + (s > 0 ? "-" + s : "") + ".json", JSON.stringify({
			sourceId : libs.sourceId,
			pageNo : s,
			nextPage : (i + libs.pageLimit) < index.length ? libs.sourceUrl + "index-" + (s + 1) + ".json" : undefined,
			content : index.slice(i, i + libs.pageLimit)
		}));
	}
	console.log("Wrinting Map...");
	fs.writeFileSync(libs.sourceDir + "map.json", JSON.stringify({
		sourceId : libs.sourceId,
		content : map
	}));
	console.log("Wrinting Authorities...");
	if (!libs.authorities) libs.authorities = {};
	for (i in libs.authorities) {
		if (!libs.authorities[i].startsWith("http")) {
			fs.copyFileSync(libs.authorities[i], libs.sourceDir + i + ".key");
			libs.authorities[i] = libs.sourceUrl + i + ".key";
		}
	}
	libs.authorities[libs.sourceId] = libs.verifyKey ? libs.sourceUrl + "verify.key" : undefined;
	fs.writeFileSync(libs.sourceDir + "authorities.json", JSON.stringify({
		sourceId : libs.sourceId,
		content : libs.authorities
	}));
	console.log("Wrinting Info...");
	if (libs.verifyKey) {
		var data = fs.readFileSync(libs.verifyKey, "utf-8").split(/\r?\n/);
		fs.writeFileSync(libs.sourceDir + "verify.key", Buffer.from(data.slice(1, -2).join(""), "base64"));
	}
	fs.writeFileSync(libs.sourceDir + "info.json", JSON.stringify({
		sourceId : libs.sourceId,
		map : libs.sourceUrl + "map.json",
		index : libs.sourceUrl + "index.json",
		indexPages : s,
		indexLibs : index.length,
		pubkey : libs.verifyKey ? libs.sourceUrl + "verify.key" : undefined,
		authorities : libs.sourceUrl + "authorities.json",
		lastUpdate : Date.now(),
		maintainer : libs.maintainer || libs.sourceUrl,
		details : libs.details
	}));
	fs.writeFileSync(libs.lockFile, JSON.stringify(libslock));
}

/*
如何生成所需的signKey(私钥)和verifyKey(公钥)：
1) 打开openssl
2) genrsa -out 输出私钥文件.pem 密钥位数(e.g. 2048)
3) rsa -in 输出私钥文件.pem -out 输出公钥文件.pub -pubout
*/

function toIndex(o, libs) {
	var r = {
		"name": o.name,
		"author": o.author,
		"description": o.description,
		"uuid": o.uuid,
		"version": o.version,
		"requirement": o.requirement,
		"downloadurl" : o.downloadurl || libs.sourceUrl + o.id + ".lib",
		"updateurl" : o.updateurl || libs.sourceUrl + o.id + ".json"
	};
	r.sha1 = o.downloadurl ? o.sha1 : digestSHA1(fs.readFileSync(libs.sourceDir + o.id + ".lib"));
	return r;
}

function toUpdate(o, libs) {
	var r = {
		"uuid": o.uuid,
		"version": o.version,
		"url" : libs.sourceUrl + o.id + ".lib",
		"message" : o.updateMessage,
		"source" : libs.sourceUrl
	};
	r.sha1 = digestSHA1(fs.readFileSync(libs.sourceDir + o.id + ".lib"));
	return r;
}

function digestSHA1(data) {
	var digest = crypto.createHash("sha1");
	digest.update(data);
	return digest.digest("base64");
}

if (process.argv[2]) main(process.argv[2]);
module.exports = main;