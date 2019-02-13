(function() {try {//已经弃用 命令助手已经支持自定义更新了
	Updater.checkUpdate(function(){});
	return {
		"name": "自动检查更新",
		"author": "ProjectXero",
		"description": "今天是" + new Date().toLocaleDateString(),
		"uuid": "45dd9a7c-a129-42ca-9135-036886f2c3c4",
		"version": [0, 0, 1],
		"require": [],
		"commands": {},
		"enums": {},
		"selectors": {},
		"help": {}
	};
} catch(e) {}})()