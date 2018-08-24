var fs = require("fs");
var process = require("process");
var crypto = require("crypto");
var js2lib = require("./js2lib");
var js2signlib = require("./js2signlib");

var pagelimit = 8;
var sourceId = "7c9d392b-7a1f-4226-a35a-a1137cf64e47";
var sourceUrl = "https://projectxero.gitee.io/ca/clib/";
var sourceDir = "pages/clib/";

function main() {
	console.log("Reading config...");
	var i, s, libs = JSON.parse(fs.readFileSync("clibs.json", "utf-8"));
	var index = [], map = {};
	for (i in libs.public) {
		if (libs.public[i].src) {
			console.log("Compiling " + libs.public[i].name);
			if (libs.signKey) {
				js2signlib(libs.public[i].src, libs.signKey, sourceDir + libs.public[i].id + ".lib");
			} else {
				js2lib(libs.public[i].src, sourceDir + libs.public[i].id + ".lib");
			}
		}
		console.log("Indexing " + libs.public[i].name);
		index.push(toIndex(libs.public[i]));
		fs.writeFileSync(sourceDir + libs.public[i].id + ".json", JSON.stringify(toUpdate(libs.public[i])));
		map[libs.public[i].uuid] = sourceUrl + libs.public[i].id + ".json"
	}
	for (i in libs.private) {
		if (libs.private[i].src) {
			console.log("Compiling " + libs.private[i].name);
			if (libs.signKey) {
				js2signlib(libs.private[i].src, libs.signKey, sourceDir + libs.private[i].id + ".lib");
			} else {
				js2lib(libs.private[i].src, sourceDir + libs.private[i].id + ".lib");
			}
		}
		console.log("Indexing " + libs.private[i].name);
		fs.writeFileSync(sourceDir + libs.private[i].id + ".json", JSON.stringify(toUpdate(libs.private[i])));
		map[libs.private[i].uuid] = sourceUrl + libs.private[i].id + ".json";
	}
	for (i in libs.store) {
		console.log("Indexing " + libs.store[i].name);
		index.push(toIndex(libs.store[i]));
		map[libs.store[i].uuid] = libs.store[i].updateurl;
	}
	console.log("Wrinting Index...");
	for (i = 0, s = 0; i < index.length; i += pagelimit, s++) {
		fs.writeFileSync(sourceDir + "index" + (s > 0 ? "-" + s : "") + ".json", JSON.stringify({
			sourceId : sourceId,
			pageNo : s,
			nextPage : (i + pagelimit) < index.length ? sourceUrl + "index-" + (s + 1) + ".json" : undefined,
			content : index.slice(i, i + pagelimit)
		}));
	}
	console.log("Wrinting Map...");
	fs.writeFileSync(sourceDir + "map.json", JSON.stringify({
		sourceId : sourceId,
		content : map
	}));
	console.log("Wrinting Authorities...");
	if (!libs.authorities) libs.authorities = {};
	for (i in libs.authorities) {
		if (!libs.authorities[i].startsWith("http")) {
			fs.copyFileSync(libs.authorities[i], sourceDir + i + ".key");
			libs.authorities[i] = sourceUrl + i + ".key";
		}
	}
	libs.authorities[sourceId] = libs.verifyKey ? sourceUrl + "verify.key" : undefined;
	fs.writeFileSync(sourceDir + "authorities.json", JSON.stringify({
		sourceId : sourceId,
		content : libs.authorities
	}));
	console.log("Wrinting Info...");
	if (libs.verifyKey) {
		var data = fs.readFileSync(libs.verifyKey, "utf-8").split(/\r?\n/);
		fs.writeFileSync(sourceDir + "verify.key", Buffer.from(data.slice(1, -2).join(""), "base64"));
	}
	fs.writeFileSync(sourceDir + "info.json", JSON.stringify({
		sourceId : sourceId,
		map : sourceUrl + "map.json",
		index : sourceUrl + "index.json",
		indexPages : s,
		indexLibs : index.length,
		pubkey : libs.verifyKey ? sourceUrl + "verify.key" : undefined,
		authorities : sourceUrl + "authorities.json",
		lastUpdate : Date.now(),
		maintainer : libs.maintainer || sourceUrl,
		details : libs.details
	}));
}

function toIndex(o) {
	var r = {
		"name": o.name,
		"author": o.author,
		"description": o.description,
		"uuid": o.uuid,
		"version": o.version,
		"requirement": o.requirement,
		"downloadurl" : o.downloadurl || sourceUrl + o.id + ".lib",
		"updateurl" : o.updateurl || sourceUrl + o.id + ".json"
	};
	r.sha1 = o.downloadurl ? o.sha1 : digestSHA1(fs.readFileSync(sourceDir + o.id + ".lib"));
	return r;
}

function toUpdate(o) {
	var r = {
		"uuid": o.uuid,
		"version": o.version,
		"url" : sourceUrl + o.id + ".lib",
		"message" : o.updateMessage
	};
	r.sha1 = digestSHA1(fs.readFileSync(sourceDir + o.id + ".lib"));
	return r;
}

function digestSHA1(data) {
	var digest = crypto.createHash("sha1");
	digest.update(data);
	return digest.digest("base64");
}

main();