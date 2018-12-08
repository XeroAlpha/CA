var fs = require("fs");
var process = require("process");
var loader = require("./loader");

function fixZero(s, n) {
	s = String(s);
	return n > s.length ? fixZero("0" + s, n) : s;
}
function getDateString(d) {
	return fixZero(d.getFullYear(), 4) + "-" + fixZero(d.getMonth() + 1, 2) + "-" + fixZero(d.getDate(), 2);
}
var curdate = getDateString(new Date());
var cwd = process.cwd();
var verlog = cwd + "/versions.json";
var versions = JSON.parse(fs.readFileSync(verlog, 'utf-8'));
var script = cwd + "/命令助手.js";
var updatefile = cwd + "/update.json";
var changelog = cwd + "/Changelog.txt";
var recentlog = cwd + "/recentlog.txt";

var sources = {
	"酷安网（最推荐）": "https://www.coolapk.com/game/com.xero.ca",
	"Gitee": "https://gitee.com/projectxero/ca/releases",
	"百度网盘（备用）": "http://pan.baidu.com/share/link?shareid=2966673396&uk=404195919",
	"反馈群（加群303697689获得）": "https://jq.qq.com/?_wv=1027&k=5OOYWLn"
};

function help() {
	console.log("node record_version.js [<details>]");
	console.log(" <details> changes of this revision, splitted by Chinese semi-colon(；)");
	console.log("   if <details> is given, this change will be written into versions.json");
	console.log(" this will also update Changelog.txt and update.json");
}

function addVersion(content, desp) {
	var version = /version : \[(.*)\]/.exec(content)[1];
	version = JSON.parse("[" + version + "]");
	versions.push({
		"version": curdate,
		"belongs": version.join("."),
		"time": Date.now(),
		"info": desp
	});
}

function makeUpdate() {
	var details;
	fs.writeFileSync(verlog, JSON.stringify(versions, null, 4));
	details = versions.map(function(e) {
		return "●" + e.info + "(" + e.version + ")";
	});
	details.reverse();
	fs.writeFileSync(changelog, details.join("\n"));
	var lv = versions[versions.length - 1];
	fs.writeFileSync(updatefile, JSON.stringify({
		"time": lv.time,
		"version": lv.version,
		"belongs": lv.belongs,
		"info": fs.readFileSync(recentlog, 'utf-8'),
		"downloads": sources
	}));
}

function main(details) {
	var content = loader.load(script, 'utf-8')
	if (details) addVersion(content, details);
	makeUpdate();
	console.log("Done.\n");
	help();
}

if (process.argv.length > 3) {
	help();
} else {
	main(process.argv[2]);
}