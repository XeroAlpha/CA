const fs = require("fs");
module.exports = function(context, args) {
	fs.writeFileSync(context.cwd + "/dist/update.json", JSON.stringify({
		"time": context.buildConfig.publishTime,
		"version": context.buildConfig.date,
		"belongs": context.buildConfig.version,
		"info": context.buildConfig.description,
		"downloads": {
			"酷安网（最推荐）": "https://www.coolapk.com/game/com.xero.ca",
			"Gitee": "https://gitee.com/projectxero/ca/releases",
			"百度网盘（备用）": "http://pan.baidu.com/share/link?shareid=2966673396&uk=404195919",
			"反馈群（加群303697689获得）": "https://jq.qq.com/?_wv=1027&k=5OOYWLn"
		}
	}));
}