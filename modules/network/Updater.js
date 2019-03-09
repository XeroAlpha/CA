MapScript.loadModule("Updater", {
	toChineseDate : function(d) {
		return new java.text.SimpleDateFormat("yyyy'年'MM'月'dd'日' HH:mm").format(new java.util.Date(d));
	},
	toAnchor : function(title, url) {
		return '<a href="' + url + '">' + title + '</a>';
	},
	queryFromSources : function(sources) {
		var i, lastError;
		for (i = 0; i < sources.length; i++) {
			try {
				return NetworkUtils.queryPage(sources[i]);
			} catch(e) {
				lastError = e;
			}
		}
		throw lastError;
	},
	cleanCache : function() {
		this.lastcheck = this.latest = null;
	},
	getUpdateInfo : function(sources, callback, silently) {
		var r;
		try {
			if (this.lastcheck) {
				r = this.lastcheck;
			} else {
				this.lastcheck = r = JSON.parse(this.queryFromSources(sources));
			}
			callback(r);
		} catch(e) {
			Log.e(e);
			if (!silently) return Common.toast("检测更新失败，请检查网络连接\n(" + e + ")");
		}
	},
	getVersionInfo : function() {
		if (this.checking) return "正在检查版本……";
		if (!this.latest) return "版本：" + BuildConfig.date;
		if (Date.parse(BuildConfig.date) < Date.parse(this.latest)) {
			return "更新：" + BuildConfig.date + " -> " + this.latest;
		} else if (Date.parse(BuildConfig.date) == Date.parse(this.latest)) {
			return "您使用的是最新版本";
		} else {
			return "Beta版本：" + BuildConfig.date;
		}
	},
	checkUpdate : function(callback, silently) {
		if (this.checking) {
			Common.toast("正在检查更新中，请稍候");
			return false;
		}
		this.checking = true;
		if (callback) callback();
		var thread = new java.lang.Thread(new java.lang.Runnable({run : function() {try {
			if (CA.settings.betaUpdate) {
				var snapshotVer;
				try {
					snapshotVer = JSON.parse(Common.readFile(MapScript.baseDir + "snapshot.json", null, true)).version;
				} catch(e) {
					Log.e(e);
				}
				if (!snapshotVer) snapshotVer = BuildConfig.date;
				Updater.getUpdateInfo(Updater.betaSources, function(info) {
					var flag = Date.parse(info.version) - Date.parse(snapshotVer);
					if (flag > 0) {
						Updater.showBetaUpdateDialog(info);
					} else if (!silently) {
						if (flag == 0) {
							Common.toast("当前已经是最新Beta版本：" + snapshotVer);
						} else {
							Common.toast("目前没有更新的Beta版本，您可以在设置中关闭Beta计划以查看是否有更新的正式版");
						}
					}
					Updater.latest = info.version;
				}, silently);
			} else {
				Updater.getUpdateInfo(Updater.sources, function(info) {
					var flag = Date.parse(info.version) - Date.parse(BuildConfig.date);
					if (flag > 0) {
						Updater.showUpdateDialog(info);
					} else if (!silently) {
						if (flag == 0) {
							Common.toast("当前已经是最新版本：" + BuildConfig.date);
						} else {
							Common.toast("目前您正在使用Beta版本，目前暂未公开Beta版的更新");
						}
					}
					Updater.latest = info.version;
				}, silently);
			}
			if (callback) callback();
			Updater.checking = false;
		} catch(e) {erp(e)}}}));
		thread.start();
	},
	testSupport : function(requirements) {
		if (!Array.isArray(requirements)) return null;
		var i, e, err = [], sdk_int = android.os.Build.VERSION.SDK_INT, abis = AndroidBridge.getABIs();
		for (i in requirements) {
			e = Object(requirements[i]);
			switch (e.type) {
				case "expr":
				try {
					eval.call(null, e.value);
				} catch(e) {
					err.push(e);
				}
				break;
				case "minsdk":
				if (sdk_int < e.value) err.push("您的Android版本较低(" + sdk_int + "<" + e.value + ")");
				break;
				case "maxsdk":
				if (sdk_int > e.value) err.push("您的Android版本过高(" + sdk_int + ">" + e.value + ")");
				break;
				case "abis":
				if (!Array.isArray(e.values)) e.values = [e.value];
				e.values.forEach(function(e) {
					if (abis.indexOf(e) < 0) err.push("您的CPU不支持" + e + "指令集");
				});
				break;
			}
		}
		if (err.length) return err;
	},
	showUpdateDialog : function(info) {
		var unsupport = Updater.testSupport(info.requirements);
		var buttons = [{
			text : "快速更新",
			onclick : function() {
				Common.showProgressDialog(function(dia) {
					dia.setText("下载中……");
					try {
						NetworkUtils.download(info.hotfix.url, MapScript.baseDir + "core.js");
						NetworkUtils.download(info.hotfix.sign, MapScript.baseDir + "core.sign");
						Common.toast("更新成功，将在下次启动时生效");
					} catch(e) {
						Common.toast("下载更新失败\n" + e);
					}
				});
			},
			visible : function() {
				return MapScript.host == "Android" && info.hotfix && info.hotfix.shell == ScriptInterface.getShellVersion()
			}
		}, {
			text : "手动更新",
			onclick : function() {
				Updater.chooseUpdateSource(info);
			}
		}, {
			text : "稍后提醒"
		}, {
			text : "不再提醒",
			onclick : function() {
				CA.settings.skipCheckUpdate = true;
				Common.toast("命令助手将不再自动检查更新");
			},
			visible : function() {
				return unsupport && unsupport.length > 0;
			}
		}].filter(function(e) {
			if (e.visible && !e.visible()) return false;
			return true;
		});
		Common.showConfirmDialog({
			title : "命令助手更新啦！", 
			description : ISegment.rawJson([function() {
				if (unsupport) {
					return {
						text : "您的设备可能无法安装这个新版本，原因是：\n" + unsupport.join("\n") + "\n\n",
						color : "criticalcolor",
						bold : true
					};
				} else {
					return "";
				}
			}, {
				extra : [
					{
						text : "最新版本：" + info.version,
						bold : true
					},
					"\n发布时间：", String(Updater.toChineseDate(info.time)),
					"\n更新内容：\n", info.info
				],
				color : "textcolor"
			}]),
			buttons : buttons.map(function(e) {
				return e.text;
			}),
			callback : function(i) {
				if (i in buttons && buttons[i].onclick) buttons[i].onclick();
			}
		});
	},
	chooseUpdateSource : function(info) {
		var i, d = [];
		for (i in info.downloads) {
			d.push({
				text : i,
				description : info.downloads[i]
			});
		}
		Common.showListChooser(d, function(i) {
			try {
				ctx.startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(d[i].description))
					.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
			} catch(e) {
				Common.toast("打开链接失败\n" + e);
			}
		});
	},
	showBetaUpdateDialog : function(info) {
		var buttons = [{
			text : "快速更新",
			onclick : function() {
				Common.showProgressDialog(function(dia) {
					dia.setText("下载中……");
					try {
						if (!NetworkUtils.downloadGz(info.snapshot.url, MapScript.baseDir + "snapshot.js", info.snapshot.sha1)) {
							Updater.cleanBeta();
							throw "文件校验失败";
						}
						ctx.getSharedPreferences("user_settings", ctx.MODE_PRIVATE).edit().putString("debugSource", MapScript.baseDir + "snapshot.js").apply();
						Common.saveFile(MapScript.baseDir + "snapshot.json", JSON.stringify(info), true);
						Common.toast("更新成功，将在下次启动快照时生效");
					} catch(e) {
						Common.toast("下载更新失败\n" + e);
					}
				});
			},
			visible : function() {
				return MapScript.host == "Android";
			}
		}, {
			text : "加入内测群获得",
			onclick : function() {
				Common.setClipboardText("671317302");
				Common.toast("群号已复制到剪贴板");
			},
			visible : function() {
				return MapScript.host != "Android";
			}
		}, {
			text : "稍后提醒"
		}].filter(function(e) {
			if (e.visible && !e.visible()) return false;
			return true;
		});
		Common.showConfirmDialog({
			title : "命令助手Beta版更新啦！", 
			description : ISegment.rawJson({
				extra : [
					{
						text : "最新版本：" + info.version,
						bold : true
					},
					"\n发布时间：", String(Updater.toChineseDate(info.time)),
					"\n更新内容：\n", info.info
				],
				color : "textcolor"
			}),
			buttons : buttons.map(function(e) {
				return e.text;
			}),
			callback : function(i) {
				if (i in buttons && buttons[i].onclick) buttons[i].onclick();
			}
		});
	},
	cleanBeta : function() {
		Common.deleteFile(MapScript.baseDir + "snapshot.json");
		Common.deleteFile(MapScript.baseDir + "snapshot.js");
	},
	showNewVersionInfo : function(oldVer) {
		Common.showTextDialog(G.Html.fromHtml([
			"<b>命令助手已更新！</b>",
			"<b>" + oldVer + " -> " + BuildConfig.date + "</b>\t(" + BuildConfig.version + ")",
			"发布时间：" + Updater.toChineseDate(BuildConfig.publishTime),
			"<br />更新内容：",
			BuildConfig.description.replace(/\n/g, "<br />")
		].join("<br />")));
	},
	askHurryDevelop : function(callback) {
		Common.showConfirmDialog({
			title : "催更命令助手", 
			description : "是不是觉得命令助手更新速度太慢？不如催促命令助手更新吧",
			buttons : [
				"立即催更",
				"暂不催更"
			],
			callback : function(id) {
				callback(id == 0);
			}
		});
	},
	isConnected : function() {
		var cm = ctx.getSystemService(ctx.CONNECTIVITY_SERVICE);
		var an = cm.getActiveNetworkInfo();
		if (an && an.isConnected()) {
			return true;
		} else {
			return false;
		}
	},
	initialize : function() {
		if (!CA.settings.skipCheckUpdate && this.isConnected() && !(CA.settings.nextCheckUpdate > Date.now())) {
			this.checkUpdate(function() {
				if (!CA.settings.betaUpdate) {
					CA.settings.nextCheckUpdate = Date.now() + 7 * 24 * 3600 * 1000;
				}
			}, true);
		}
	},
	latest : null,
	lastcheck : null,
	checking : false,
	sources : [
		"https://projectxero.top/ca/hotfix.json",
		"https://projectxero.gitee.io/ca/hotfix.json",
		"https://xeroalpha.github.io/CA/pages/hotfix.json"
	],
	betaSources : [
		"https://projectxero.top/ca/snapshot.json"
	]
});