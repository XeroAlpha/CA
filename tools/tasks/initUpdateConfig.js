const fs = require("fs");
const readConfig = require("../readconfig");

module.exports = function(context, args) {
	var info = readConfig(fs.readFileSync("./config/info.txt", "utf-8"));
	context.updateConfig = {
		pageUrl : info.url + "/",
		downloadSource : {
			"酷安网（最推荐）": "https://www.coolapk.com/game/com.xero.ca",
			"Gitee": "https://gitee.com/projectxero/ca/releases",
			"百度网盘（备用）": "http://pan.baidu.com/share/link?shareid=2966673396&uk=404195919",
			"反馈群（加群303697689获得）": "https://jq.qq.com/?_wv=1027&k=5OOYWLn"
		}
	};
	if (info.autopublish == "sftp") {
		context.publishConfig = {
			method : "sftp",
			remotePath : info.remotepath,
			sshConfig : readConfig(fs.readFileSync("./config/" + info.sshconfig, "utf-8")),
		};
	}
}