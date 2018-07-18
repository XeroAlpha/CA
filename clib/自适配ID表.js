(function self() {
	function readAsset(path) {
		var entry = zf.getEntry(path);
		if (entry == null) return null;
		return new java.io.BufferedReader(new java.io.InputStreamReader(zf.getInputStream(entry)));
	}
	function initLang(path) {
		var rd = readAsset(path), q, z, r = {};
		while (q = rd.readLine()) {
			z = (/(.+?)\=(.*)#/).exec(q);
			if (!z) continue;
			r[z[1]] = z[2].replace(/\s*$/, "");
		}
		rd.close();
		return r;
	}
	function readAssetJSON(path, defaultValue) {
		try{
			var rd = readAsset(path);
			var s = [], q;
			while (q = rd.readLine()) s.push(q);
			rd.close();
			return eval("(" + s.join("\n") + ")");
		} catch(e) {
			return defaultValue;
		}
	}
	function searchObject(obj, v) {
		var rk = [], rp = [];
		(Object.keys(obj)).forEach(function(e, i, a) {
			if (e.search(v) >= 0) {
				rk.push(e);
				rp.push(obj[e]);
			}
		});
		return {
			keys : rk,
			values : rp
		};
	}
try {
	var pkgname = CA.settings._autoid_pkgname;
	var ret, result;
	if (!pkgname) {
		Common.toast("[自适配ID表]请稍候……");
		var pm = ctx.getPackageManager();
		var lp = pm.getInstalledPackages(0).toArray();
		var i, j, as, r = [], f;
		for (i in lp) {
			if (!lp[i].applicationInfo) continue;
			f = true;
			try { //非常神奇的Exception:Package manager has died
				as = pm.getPackageInfo(lp[i].packageName, 1).activities;
				for (j in as) {
					if (as[j].name == "com.mojang.minecraftpe.MainActivity") {
						f = false;
						break;
					}
				}
				if (f) continue;
			} catch(e) {}
			r.push({
				text : pm.getApplicationLabel(lp[i].applicationInfo),
				description : lp[i].versionName,
				result : lp[i].packageName
			});
		}
		if (r.length > 0) {
			Common.toast("[自适配ID表]请选择您期望从哪个应用中提取ID表，选中后将无法更改！");
			var lock = new java.util.concurrent.Semaphore(0);
			Common.showListChooser(r, function(id) {
				CA.settings._autoid_pkgname = String(r[id].result);
			}, false, function() {
				lock.release();
			});
			lock.acquire();
			if (CA.settings._autoid_pkgname) {
				ret = self().versionPack.ids.enums;
			}
		} else {
			Common.toast("[自适配ID表]找不到可供提取的应用");
		}
	} else {
		Common.toast("[自适配ID表]请稍候……正在生成ID表\n(1/5)读取语言文件");
		var zf = new java.util.zip.ZipFile(ctx.getPackageManager().getApplicationInfo(pkgname, 128).publicSourceDir);
		var lang = initLang("assets/resource_packs/vanilla/texts/zh_CN.lang");
		Common.toast("[自适配ID表]请稍候……正在生成ID表\n(2/5)读取资源包信息");
		var items = Object.keys(readAssetJSON("assets/resource_packs/vanilla/items_client.json").items),
			blocks = Object.keys(readAssetJSON("assets/resource_packs/vanilla/blocks.json")),
			sounds = Object.keys(readAssetJSON("assets/resource_packs/vanilla/sounds/sound_definitions.json"));
		ret = {
			block : {},
			item : {},
			sound : {}
		}
		Common.toast("[自适配ID表]请稍候……正在生成ID表\n(3/5)尝试匹配物品中文译名");
		items.forEach(function(e, i, a) {
			ret.item[e.toLowerCase()] = ("item." + e + ".name") in lang ? lang["item." + e + ".name"] : searchObject(lang, new RegExp("item\\." + e + "\\..*name")).values.join("/");
		});
		Common.toast("[自适配ID表]请稍候……正在生成ID表\n(4/5)尝试匹配方块中文译名");
		blocks.forEach(function(e, i, a) {
			ret.block[e.toLowerCase()] = ("tile." + e + ".name") in lang ? lang["tile." + e + ".name"] : searchObject(lang, new RegExp("tile\\." + e + "\\..*name")).values.join("/");
		});
		Common.toast("[自适配ID表]请稍候……正在生成ID表\n(5/5)生成声音列表");
		Object.keys(ret.block).forEach(function(e, i, a) {
			ret.item[e] = ret.block[e];
		});
		sounds.forEach(function(e, i, a) {
			ret.sound[e] = "";
		});
	}
	var menu = [{
		text : "重置ID表",
		onclick : function() {
			CA.settings._autoid_pkgname = null;
			Common.toast("[自适配ID表]ID表重置成功，将在下次应用时生效。");
		}
	}, {
		text : "创建静态副本",
		onclick : function(v, tag) {
			Common.showFileDialog({
				type : 1,
				callback : function(f) {
					var fp = String(f.result.getAbsolutePath());
					result.name = "自适配ID表(静态版本)";
					delete result.menu;
					CA.IntelliSense.disableLibrary(tag.data.src);
					CA.IntelliSense.savePrefixed(fp, result);
					CA.IntelliSense.enableLibrary(fp);
					Common.toast("[自适配ID表]静态ID表创建成功，将在下次应用时生效。");
				}
			});
		}
	}]
	result = {
		"name": "自适配ID表",
		"author": "ProjectXero",
		"description": ret ? "已配置成功" : "未配置",
		"uuid": "04a9e9b2-8fae-4f30-84fa-d52f9457f4eb",
		"version": [0, 0, 2],
		"require": [],
		"menu" : menu
	};
	if (ret) {
		result.versionPack = {
			"ids": {
				"mode": "overwrite",
				"enums": ret
			}
		}
		Common.toast("[自适配ID表]已生成ID表并导入");
	}
	return result;
} catch(e) {
	CA.settings._autoid_pkgname = null;
	return {
		"name": "自适配ID表",
		"author": "ProjectXero",
		"description": "加载失败：" + e,
		"uuid": "04a9e9b2-8fae-4f30-84fa-d52f9457f4eb",
		"version": [0, 0, 2],
		"require": []
	};
}
})()