var fs = require("fs");
var process = require("process");
var js2lib = require("./js2lib");

var pagelimit = 8;
var sourceId = "7c9d392b-7a1f-4226-a35a-a1137cf64e47";
var sourceUrl = "https://projectxero.gitee.io/ca/clib/";
var sourceDir = "pages/clib/";

function main() {
	console.log("Reading config...");
	var i, s, libs = JSON.parse(fs.readFileSync("clibs.json", "utf-8"));
	var index = [], map = {};
	for (i in libs.public) {
		console.log("Indexing " + libs.public[i].name);
		index.push(toIndex(libs.public[i]));
		fs.writeFileSync(sourceDir + libs.public[i].id + ".json", JSON.stringify(toUpdate(libs.public[i])));
		map[libs.public[i].uuid] = sourceUrl + libs.public[i].id + ".json"
		if (libs.public[i].src) {
			console.log("Compiling " + libs.public[i].name);
			js2lib(libs.public[i].src, sourceDir + libs.public[i].id + ".lib");
		}
	}
	for (i in libs.private) {
		console.log("Indexing " + libs.private[i].name);
		fs.writeFileSync(sourceDir + libs.private[i].id + ".json", JSON.stringify(toUpdate(libs.private[i])));
		map[libs.private[i].uuid] = sourceUrl + libs.private[i].id + ".json";
		if (libs.private[i].src) {
			console.log("Compiling " + libs.private[i].name);
			js2lib(libs.private[i].src, sourceDir + libs.private[i].id + ".lib");
		}
	}
	for (i in libs.store) {
		console.log("Indexing " + libs.store[i].name);
		index.push(toIndex(libs.store[i]));
		map[libs.store[i].uuid] = libs.store[i].updateurl;
	}
	console.log("Wrinting Index...");
	for (i = 0, s = 0; i < index.length; i += pagelimit, s++) {
		fs.writeFileSync(sourceDir + "index" + (i > 0 ? "-" + i : "") + ".json", JSON.stringify({
			sourceId : sourceId,
			pageNo : i,
			nextPage : (i + pagelimit) < index.length ? sourceUrl + "index-" + (i + 1) + ".json" : undefined,
			content : index.slice(i, i + pagelimit)
		}));
	}
	console.log("Wrinting Map...");
	fs.writeFileSync(sourceDir + "map.json", JSON.stringify({
		sourceId : sourceId,
		content : map
	}));
	console.log("Wrinting Info...");
	fs.writeFileSync(sourceDir + "info.json", JSON.stringify({
		sourceId : sourceId,
		map : sourceUrl + "map.json",
		index : sourceUrl + "index.json",
		indexPages : s + 1,
		indexLibs : index.length,
		lastUpdate : Date.now()
	}));
}

function toIndex(o) {
	return {
		"name": o.name,
		"author": o.author,
		"description": o.description,
		"uuid": o.uuid,
		"version": o.version,
		"requirement": o.requirement,
		"downloadurl" : o.downloadurl || sourceUrl + o.id + ".lib",
		"updateurl" : o.updateurl || sourceUrl + o.id + ".json"
	};
}

function toUpdate(o) {
	return {
		"uuid": o.uuid,
		"version": o.version,
		"url" : sourceUrl + o.id + ".lib",
		"message" : o.updateMessage
	};
}

main();