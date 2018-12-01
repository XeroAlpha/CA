MapScript.loadModule("Updater", {
	queryPage : function(url) {
		return this.request(url, "GET");
	},
	postPage : function(url, data, contentType) {
		return this.request(url, "POST", data, contentType);
	},
	request : function(url, method, data, contentType) {
		var url = new java.net.URL(url);
		var conn = url.openConnection();
		conn.setConnectTimeout(5000);
		conn.setUseCaches(false);
		conn.setRequestMethod(method);
		if (data) {
			conn.setDoInput(true);
			conn.setDoOutput(true);
		}
		if (contentType) conn.setRequestProperty("Content-Type", contentType);
		var rd, s, ln;
		try {
			conn.connect();
			if (data) {
				var wr = conn.getOutputStream();
				wr.write(new java.lang.String(data).getBytes());
				wr.flush();
			}
			rd = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
			s = [];
			while (ln = rd.readLine()) s.push(ln);
			rd.close();
			return s.join("\n");
		} catch(e) {
			try {
				rd = conn.getErrorStream();
			} catch(er) {
				throw e;
			}
			s = [conn.getResponseCode() + " " + conn.getResponseMessage()];
			if (rd) {
				rd = new java.io.BufferedReader(new java.io.InputStreamReader(rd));
				while (ln = rd.readLine()) s.push(ln);
				rd.close();
			}
			s.push(e);
			throw s.join("\n");
		}
	},
	download : function(url, path) {
		const BUFFER_SIZE = 4096;
		var url = new java.net.URL(url);
		var conn = url.openConnection();
		conn.setConnectTimeout(5000);
		conn.setUseCaches(false);
		conn.setRequestMethod("GET");
		conn.connect();
		var is, os, buf, hr;
		is = conn.getInputStream();
		os = new java.io.FileOutputStream(path);
		buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, BUFFER_SIZE);
		while ((hr = is.read(buf)) > 0) os.write(buf, 0, hr);
		os.close();
		is.close();
	},
	toChineseDate : function(d) {
		return new java.text.SimpleDateFormat("yyyy'年'MM'月'dd'日' HH:mm").format(new java.util.Date(d));
	},
	toAnchor : function(title, url) {
		return '<a href="' + url + '">' + title + '</a>';
	},
	getUpdateInfo : function(callback, silently) {
		var r;
		try {
			if (this.lastcheck) {
				r = this.lastcheck;
			} else {
				this.lastcheck = r = JSON.parse(this.queryPage(this.url));
			}
			callback(Date.parse(r.version) - Date.parse(CA.publishDate), r.version, r);
		} catch(e) {
			Log.e(e);
			if (!silently) return Common.toast("检测更新失败，请检查网络连接\n(" + e + ")");
		}
	},
	getVersionInfo : function() {
		if (this.checking) return "正在检查版本……";
		if (!this.latest) return "版本：" + CA.publishDate;
		if (Date.parse(CA.publishDate) < Date.parse(this.latest)) {
			return "更新：" + CA.publishDate + " -> " + this.latest;
		} else if (Date.parse(CA.publishDate) == Date.parse(this.latest)) {
			return "您使用的是最新版本";
		} else {
			return "Beta版本：" + CA.publishDate;
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
			Updater.getUpdateInfo(function(flag, date, info) {
				if (flag > 0) {
					Updater.showUpdateDialog(info);
				} else if (!silently) {
					if (flag == 0) {
						Common.toast("当前已经是最新版本：" + date);
					} else {
						Common.toast("目前您正在使用Beta版本，目前暂未公开Beta版的更新");
					}
				}
				Updater.latest = date;
			}, silently);
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
						Updater.download(info.hotfix.url, MapScript.baseDir + "core.js");
						Updater.download(info.hotfix.sign, MapScript.baseDir + "core.sign");
						Common.toast("更新成功，将在下次启动时生效");
					} catch(e) {
						Common.toast("下载更新失败\n" + e);
					}
				});
			},
			visible : function() {
				return MapScript.host == "Android" && info.hotfix && info.hotfix.shell == ScriptActivity.getShellVersion()
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
					"\n最近更新内容：\n", info.info
				],
				color : "textcolor"
			}]),
			buttons : buttons.map(function(e) {
				return e.text;
			}),
			callback : function(id) {
				if (id in buttons && buttons.onclick) buttons.onclick();
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
	showNewVersionInfo : function(oldVer) {
		this.checking = true;
		var thread = new java.lang.Thread(new java.lang.Runnable({run : function() {try {
			Updater.getUpdateInfo(function(flag, date, info) {
				if (flag >= 0) {
					Common.showTextDialog(G.Html.fromHtml([
						"<b>命令助手已更新！</b>",
						"<b>" + oldVer + " -> " + info.version + "</b>\t(" + info.belongs + ")",
						"发布时间：" + Updater.toChineseDate(info.time),
						"<br />最近更新内容：",
						info.info.replace(/\n/g, "<br />")
					].join("<br />")));
				} else {
					Common.showTextDialog(G.Html.fromHtml([
						"<b>欢迎使用命令助手 公测版本</b>",
						"<b>" + oldVer + " -> " + CA.publishDate + "</b>\t(" + CA.version.join(".") + ")",
						"公测版容易出现bug。如果出现bug，欢迎加入命令助手讨论区向我反馈。",
						"MCPE命令助手讨论区：" + Updater.toAnchor("207913610", "https://jq.qq.com/?_wv=1027&k=46Yl84D")
					].join("<br />")));
				}
				Updater.latest = date;
			}, true);
			Updater.checking = false;
		} catch(e) {erp(e)}}}));
		thread.start();
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
				CA.settings.nextCheckUpdate = Date.now() + 7 * 24 * 3600 * 1000;
			}, true);
		}
	},
	latest : null,
	lastcheck : null,
	checking : false,
	url : "https://projectxero.gitee.io/ca/hotfix.json"
});