MapScript.loadModule("AndroidBridge", {
	intentCallback : {},
	permissionRequestData : [],
	permissionCallback : {length : 0},
	onCreate : function() {
		G.ui(this.initIcon);
	},
	initialize : function() {try {
		if (MapScript.host != "Android") return;
		if (CA.RELEASE) gHandler.post(this.verifyApk);
		ScriptInterface.setBridge({
			applyIntent : function(intent) {try {
				AndroidBridge.callHide();
				return true;
			} catch(e) {erp(e)}},
			onAccessibilitySvcCreate : function() {try {
				AndroidBridge.notifySettings();
			} catch(e) {erp(e)}},
			onAccessibilitySvcDestroy : function() {try {
				AndroidBridge.notifySettings();
			} catch(e) {erp(e)}},
			onActivityResult : function(requestCode, resultCode, data) {try {
				var cb = AndroidBridge.intentCallback[requestCode];
				if (!cb) return;
				PWM.onResume();
				delete AndroidBridge.intentCallback[requestCode];
				cb(resultCode, data);
			} catch(e) {erp(e)}},
			onBeginPermissonRequest : function(activity) {try {
				return AndroidBridge.onBeginPermissonRequest(activity);
			} catch(e) {erp(e)}},
			onKeyEvent : function(e) {try {
				if (e.getAction() == e.ACTION_DOWN) {
					var k = e.getKeyCode();
					if (k == e.KEYCODE_HOME || k == e.KEYCODE_MENU || k == e.KEYCODE_ENDCALL || k == e.KEYCODE_POWER || k == e.KEYCODE_NOTIFICATION) {
						AndroidBridge.callHide();
					}
				}
			} catch(e) {erp(e)}},
			onNewIntent : function(intent) {try {
				AndroidBridge.onNewIntent(intent, false);
			} catch(e) {erp(e)}},
			onRemoteEnabled : function() {try {
				Common.toast("正在连接至Minecraft适配器……/\n等待游戏数据传输……");
			} catch(e) {erp(e)}},
			onRemoteMessage : function(msg) {try {
				if (msg.what != 1) return;
				var data = msg.getData();
				if (data.getString("action") != "init" && !MCAdapter.client) {
					var msg2 = android.os.Message.obtain();
					msg2.what = 2;
					msg.replyTo.send(msg2);
					return;
				}
				switch (String(data.getString("action"))) {
					case "init":
					MCAdapter.client = msg.replyTo;
					MCAdapter.connInit = true;
					MCAdapter.version = data.getInt("version", 0);
					AndroidBridge.notifySettings();
					Common.toast("已连接至Minecraft适配器，终端：" + data.getString("platform") + "\n" + (MCAdapter.targetVersion > MCAdapter.version ? "此适配器版本较旧，可能不支持部分提示，请在设置中重新加载适配器" : "当前适配器为最新版本"));
					break;
					case "info":
					MCAdapter.updateInfo(data.getBundle("info"));
					break;
					case "event":
					try {
						MCAdapter.callHook(data.getString("name"), JSON.parse(data.getString("param")));
					} catch(e) {erp(e, true)}
					break;
					case "resetMCV":
					NeteaseAdapter.mcVersion = String(data.getString("version"));
					Common.toast("正在切换拓展包版本，请稍候……");
					CA.checkFeatures();
					CA.Library.initLibrary(function(flag) {
						if (flag) {
							Common.toast("拓展包加载完毕");
						} else {
							Common.toast("有至少1个拓展包无法加载，请在设置中查看详情");
						}
					});
				}
			} catch(e) {erp(e)}},
			onRemoteDisabled : function() {try {
				Common.toast("已断开至Minecraft适配器的连接");
				MCAdapter.bundle = null;
				MCAdapter.client = null;
				MCAdapter.connInit = false;
				AndroidBridge.notifySettings();
			} catch(e) {erp(e)}}
		});
		this.onNewIntent(ScriptInterface.getIntent(), true);
		if (CA.settings.autoStartAccSvcRoot) this.startAccessibilitySvcByRootAsync(null, true);
		if (CA.settings.watchClipboard) this.startWatchClipboard();
		if (CA.settings.startWSSOnStart) WSServer.start(true);
		if (G.shouldFloat) this.showActivityContent(G.supportFloat);
		this.checkNecessaryPermissions(function(success) {
			if (G.supportFloat) AndroidBridge.exitLoading(!CA.settings.hideRecent);
		});
	} catch(e) {erp(e)}},
	onNewIntent : function(intent, startByIntent) {
		function onReturn() {
			if (!CA.trySave()) return;
			if (startByIntent) {
				//CA.performExit();
			}
		}
		var t;
		if (!intent) return;
		switch (intent.getAction()) {
			case ScriptInterface.ACTION_ADD_LIBRARY:
			t = AndroidBridge.uriToFile(intent.getData());
			Common.showConfirmDialog({
				title : "确定加载拓展包“" + t + "”？",
				callback : function(id) {
					if (id != 0) return onReturn();
					if (!CA.Library.enableLibrary(String(t))) {
						Common.toast("无法导入该拓展包，可能文件不存在");
						return CA.showLibraryMan(onReturn);
					}
					CA.Library.initLibrary(function() {
						Common.toast("导入成功！");
						CA.showLibraryMan(onReturn);
					});
				}
			});
			break;
			case ScriptInterface.ACTION_EDIT_COMMAND:
			t = intent.getExtras().getString("text", "");
			G.ui(function() {try {
				CA.showGen(true);
				CA.cmd.setText(t);
				CA.showGen.activate(false);
			} catch(e) {erp(e)}});
			break;
			case ScriptInterface.ACTION_START_FROM_SHORTCUT:
			t = ctx.getPackageManager().getLaunchIntentForPackage(intent.getData().getSchemeSpecificPart());
			if (t) {
				ctx.startActivity(t);
			}
			break;
			case ScriptInterface.ACTION_SCRIPT_ACTION:
			if (!startByIntent) AndroidBridge.scriptAction();
			break;
			case ScriptInterface.ACTION_URI_ACTION:
			AndroidBridge.openUriAction(intent.getData(), intent.getExtras());
			break;
			case ScriptInterface.ACTION_SHOW_DEBUG:
			//ctx.startActivity(new android.content.Intent("com.xero.ca.SHOW_DEBUG").setComponent(new android.content.ComponentName("com.xero.ca", "com.xero.ca.MainActivity")).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
			Common.showDebugDialog();
			break;

			default:
			if (startByIntent && CA.settings.chainLaunch) {
				t = ctx.getPackageManager().getLaunchIntentForPackage(CA.settings.chainLaunch);
				if (t) {
					ctx.startActivity(t);
				}
			}
			if (!startByIntent) {
				CA.showIcon();
			}
		}
	},
	verifyApk : function() {
		if (ctx.getPackageName() != "com.xero.ca") throw new java.lang.SecurityException("101");
		AndroidBridge.verifySign();
		AndroidBridge.verifyContext();
		if (AndroidBridge.HOTFIX) return;
		AndroidBridge.verifyDex();
	},
	verifySign : function() {
		try {
			var sn = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), android.content.pm.PackageManager.GET_SIGNATURES).signatures, vc = [], i;
			var md = java.security.MessageDigest.getInstance("SHA-256");
			for (i in sn) {
				md.update(sn[i].toByteArray());
				vc.push(android.util.Base64.encodeToString(md.digest(), android.util.Base64.NO_WRAP));
			}
			if (vc.join("") != "HmzSXz/O6M/qIPo8mvhmFuXusTaKk3caC/vjP+ymxzw=") throw 102;
		} catch(e) {
			throw new java.lang.SecurityException(String(e));
		}
	},
	verifyContext : function() {
		try {
			var cls = ctx.getApplicationContext().getClass();
			if (cls != com.xero.ca.XApplication) throw 104;
			if (this.findDeclaredMethodClass(cls, ["attachBaseContext", android.content.Context], android.app.Application)) throw 105;
			if (this.findDeclaredMethodClass(cls, ["onCreate"], android.app.Application) != com.xero.ca.XApplication) throw 106;
			/*cls = ctx.getClass();
			if (cls != com.xero.ca.MainActivity) throw 107;
			if (this.findDeclaredMethodClass(cls, ["attachBaseContext", android.content.Context], com.xero.ca.MainActivity)) throw 108;
			if (this.findDeclaredMethodClass(cls, ["onCreate", android.os.Bundle], com.xero.ca.MainActivity) != com.xero.ca.MainActivity) throw 109;*/
		} catch(e) {
			throw new java.lang.SecurityException(String(e));
		}
	},
	verifyDex : function() {
		var zf = new java.util.zip.ZipFile(ctx.getPackageCodePath());
		var e = zf.getEntry("classes.dex");
		if (java.lang.Long.toHexString(e.getCrc()) != "$dexCrc$") throw new java.lang.SecurityException("103");
	},
	findDeclaredMethodClass : function self(cls, params, parent) {
		try {
			var method = cls.getDeclaredMethod.apply(cls, params);
			return cls;
		} catch(e) {/*Class not found*/}
		if (!parent) parent = java.lang.Object;
		if (cls == java.lang.Object || cls == parent) return null;
		return self(cls.getSuperclass(), params, parent);
	},
	callHide : function() {
		if (PopupPage.getCount() > 0) {
			PopupPage.hide();
		}
	},
	scriptAction : function() {
		Common.showOperateDialog(this.keeperMenu);
	},
	openUriAction : function(uri, extras) {
		switch (String(uri.getHost()).toLowerCase()) {
			case "base":
			var path, obj, query, fragment;
			path = uri.getPath();
			query = uri.getEncodedQuery();
			fragment = uri.getFragment();
			if (path) {
				obj = this.getBaseUriAction(String(path));
				if (obj) {
					obj(fragment ? String(fragment) : null, query ? this.getQueryKV(String(query)) : {}, extras);
				} else {
					Common.toast("未知的调用：" + path);
				}
			}
			break;
		}
	},
	getBaseUriAction : function(path) {
		var i, obj = this.uriActions, par;
		path = path.toLowerCase().replace(/^\//, "").split("/");
		for (i = 0; i < path.length; i++) {
			par = obj;
			obj = obj[path[i]];
			if (!obj) {
				obj = par.get ? par.get(path.slice(i)) : par instanceof Function ? par : par.default;
				break;
			}
		}
		if (typeof obj == "function") return obj;
		return null;
	},
	getQueryKV : function(query) {
		var r = {}, i, strs, t;
		strs = query.slice(t + 1).split("&");
		for(i in strs) {
			t = strs[i].indexOf("=");
			if (t >= 0) {
				r[strs[i].slice(0, t)] = unescape(strs[i].slice(t + 1));
			}
		}
		return r;
	},
	notifySettings : function() {
		G.ui(function() {try {
			if (Common.showSettings.refreshText) Common.showSettings.refreshText();
		} catch(e) {erp(e)}});
	},
	addSettings : function(o) {
		if (MapScript.host != "Android") return;
		var preference = ScriptInterface.getPreference();
		o.splice(2, 0, {
			name : "Android版设置",
			type : "tag"
		}, {
			name : "管理无障碍服务",
			description : "用于支持粘贴命令以及一些其他操作",
			type : "custom",
			get : function() {
				return ScriptInterface.getAccessibilitySvc() != null ? "已启用" : "未启用";
			},
			onclick : function(fset) {
				ScriptInterface.goToAccessibilitySetting();
			}
		}, {
			name : "加载适配器……",
			description : "在输入命令时提供一些与游戏相关的信息",
			type : "custom",
			get : function() {
				return MCAdapter.connInit ? "已连接" : "未连接";
			},
			onclick : function(fset) {
				fset(this.get());
				MCAdapter.listAdapters();
			}
		}, {
			name : "连锁启动……",
			description : "设置启动命令助手时自动启动的应用",
			type : "custom",
			get : function() {
				var r = CA.settings.chainLaunch, ai;
				try {
					if (r) ai = ctx.getPackageManager().getApplicationInfo(r, 128);
				} catch(e) {/*App not found*/}
				if (!ai) return "无";
				return ctx.getPackageManager().getApplicationLabel(ai);
			},
			onclick : function(fset) {
				AndroidBridge.listApp((function(pkg) {
					if (pkg == ctx.getPackageName()) {
						Common.toast("不能连锁启动自身！");
						return;
					}
					CA.settings.chainLaunch = pkg;
					fset(this.get());
				}).bind(this));
			}
		}, {
			name : "WebSocket服务器",
			description : "实验性功能",
			type : "custom",
			get : function() {
				return WSServer.isAvailable() ? (WSServer.isConnected() ? "已连接" : "已启动") : "未启动";
			},
			onclick : function(fset) {
				if (WSServer.isConnected()) {
					WSServer.showConsole();
				} else if (WSServer.isAvailable()) {
					WSServer.howToUse();
				} else {
					WSServer.start();
				}
			}
		}, {
			name : "开机自动启动",
			description : "需要系统允许开机自启",
			type : "boolean",
			get : preference.getBootStart.bind(preference),
			set : preference.setBootStart.bind(preference)
		}, {
			name : "隐藏启动界面",
			type : "boolean",
			get : preference.getHideSplash.bind(preference),
			set : preference.setHideSplash.bind(preference)
		}, {
			name : "隐藏后台任务",
			type : "boolean",
			get : function() {
				return Boolean(CA.settings.hideRecent);
			},
			set : function(v) {
				CA.settings.hideRecent = Boolean(v);
				Common.toast("本项设置将在重启命令助手后应用");
			}
		}, {
			name : "隐藏通知",
			description : "可能导致应用被自动关闭",
			type : "boolean",
			get : preference.getHideNotification.bind(preference),
			set : ScriptInterface.setHideNotification.bind(ScriptInterface)
		}, {
			name : "自动启动无障碍服务",
			description : "需要Root",
			type : "boolean",
			get : function() {
				return Boolean(CA.settings.autoStartAccSvcRoot);
			},
			set : function(v) {
				CA.settings.autoStartAccSvcRoot = Boolean(v);
				if (v) {
					AndroidBridge.startAccessibilitySvcByRootAsync();
				}
			}
		}, {
			name : "监听剪切板",
			type : "boolean",
			get : function() {
				return Boolean(CA.settings.watchClipboard);
			},
			set : function(v) {
				CA.settings.watchClipboard = Boolean(v);
				if (v) {
					if (!AndroidBridge.clipListener) AndroidBridge.startWatchClipboard();
				}
			}
		}, {
			name : "隐藏“启用适配器”的提示",
			type : "boolean",
			get : function() {
				return Boolean(CA.settings.neverAskAdapter);
			},
			set : function(v) {
				CA.settings.neverAskAdapter = Boolean(v);
			}
		}, {
			name : "启动时自动启动WebSocket服务器",
			type : "boolean",
			get : function() {
				return Boolean(CA.settings.startWSSOnStart);
			},
			set : function(v) {
				CA.settings.startWSSOnStart = Boolean(v);
			}
		});
	},
	initIcon : function() {
		var logo, icon;
		try {
			var appi = ctx.getPackageManager().getApplicationInfo("com.xero.ca", 128);
			icon = ctx.getPackageManager().getResourcesForApplication(appi).getDrawable(appi.icon, null);
		} catch(e) {/*CA not found*/}
		if (icon) {
			CA.Icon.default0 = CA.Icon.default;
			CA.Icon.default = function(size) {
				const w = 32 * G.dp * size;
				var bmp = G.Bitmap.createBitmap(w, w, G.Bitmap.Config.ARGB_8888);
				var cv = new G.Canvas(bmp);
				cv.scale(w / 256, w / 256);
				var pt = new G.Paint();
				pt.setAntiAlias(true);
				pt.setColor(G.Color.BLACK);
				pt.setShadowLayer(16, 0, 0, G.Color.BLACK);
				var ph = new G.Path();
				ph.addCircle(128, 128, 112, G.Path.Direction.CW);
				cv.drawPath(ph, pt);
				cv.clipPath(ph);
				icon.setBounds(16, 16, 240, 240);
				icon.draw(cv);
				var frm = new G.FrameLayout(ctx);
				var view = new G.ImageView(ctx);
				view.setImageBitmap(bmp);
				view.setLayoutParams(new G.FrameLayout.LayoutParams(w, w));
				frm.addView(view);
				return frm;
			}
			return;
		}
		try {
			logo = ctx.getPackageManager().getApplicationIcon("com.xero.ca");
		} catch(e) {/*CA not found*/}
		if (logo) {
			CA.Icon.default0 = CA.Icon.default;
			CA.Icon.default = function(size) {
				var zp = G.dp * size;
				var frm = new G.FrameLayout(ctx);
				var view = new G.ImageView(ctx);
				view.setImageDrawable(logo);
				view.setLayoutParams(new G.FrameLayout.LayoutParams(32 * zp, 32 * zp));
				frm.addView(view);
				return frm;
			};
		}
	},
	listApp : function(callback) {
		Common.showProgressDialog(function(o) {
			var pm = ctx.getPackageManager();
			o.setText("正在加载列表……");
			var lp = pm.getInstalledPackages(0).toArray();
			var i, r = [{
				text : "不使用"
			}];
			for (i in lp) {
				if (!lp[i].applicationInfo) continue;
				if (!pm.getLaunchIntentForPackage(lp[i].packageName)) continue;
				r.push({
					text : pm.getApplicationLabel(lp[i].applicationInfo),
					description : lp[i].versionName,
					result : lp[i].packageName
				});
			}
			o.close();
			if (o.cancelled) return;
			Common.showListChooser(r, function(id) {
				callback(String(r[id].result));
			});
		}, true);
	},
	startActivityForResult : function(intent, callback) {
		var i;
		for (i = 0; i < 65536; i++) {
			if (!(i in this.intentCallback)) break;
		}
		if (i >= 65536) {
			Common.toast("启动Intent失败：同时请求的Intent过多");
			return;
		}
		this.intentCallback[i] = callback;
		ScriptInterface.startActivityForResult(intent, i);
	},
	requestPermissions : function(permissions, explanation, callback) {
		var i, denied = [];
		for (i = 0; i < permissions.length; i++) {
			if (ScriptInterface.checkSelfPermission(permissions[i]) != 0) { // PERMISSION_GRANTED == 0
				denied.push(permissions[i]);
			}
		}
		if (denied.length) {
			AndroidBridge.permissionRequestData.push({
				permissions : denied,
				explanation : explanation,
				callback : callback
			});
			ScriptInterface.beginPermissonRequest();
		} else {
			callback(true, permissions.slice(), [], true);
		}
		return denied.length;
	},
	onBeginPermissonRequest : function(activity) {
		var lastData, code = 0;
		lastData = AndroidBridge.permissionRequestData.pop();
		if (lastData) this.doPermissonRequest(activity, lastData, code);
		activity.setCallback({
			onRequestPermissionsResult : function(activity, requestCode, permissions, grantResults) {try {
				var i, succeed = [], failed = [];
				if (code == requestCode && lastData && lastData.callback) {
					for (i in grantResults) {
						if (grantResults[i] == 0) { // PERMISSION_GRANTED == 0
							succeed.push(String(permissions[i]));
						} else {
							failed.push(String(permissions[i]));
						}
					}
					lastData.callback(failed.length == 0, succeed, failed, false);
				}
				lastData = AndroidBridge.permissionRequestData.pop();
				if (lastData) {
					this.doPermissonRequest(activity, lastData, ++code);
				} else {
					activity.finish();
				}
			} catch(e) {erp(e)}}
			//onEndPermissionRequest : function(activity) {}
		});
	},
	doPermissonRequest : function(activity, data, code) {
		Common.showTextDialog("命令助手需要申请" + data.permissions.length + "个权限。" + (data.explanation ? "\n" + data.explanation : ""), function() {
			activity.requestPermissionsCompat(code, data.permissions);
		});
	},
	getABIs : function() {
		if (android.os.Build.VERSION.SDK_INT > 21) {
			return android.os.Build.SUPPORTED_ABIS.map(function(e) {
				return String(e);
			});
		} else {
			return [String(android.os.Build.CPU_ABI), String(android.os.Build.CPU_ABI2)];
		}
	},
	uriToFile : function(uri) { //Source : https://www.cnblogs.com/panhouye/archive/2017/04/23/6751710.html
		var r = null, cursor, column_index, selection = null, selectionArgs = null, isKitKat = android.os.Build.VERSION.SDK_INT >= 19, docs;
		if (uri.getScheme().equalsIgnoreCase("content")) {
			if (isKitKat && android.provider.DocumentsContract.isDocumentUri(ctx, uri)) {
				if (String(uri.getAuthority()) == "com.android.externalstorage.documents") {
					docs = String(android.provider.DocumentsContract.getDocumentId(uri)).split(":");
					if (docs[0] == "primary") {
						return android.os.Environment.getExternalStorageDirectory() + "/" + docs[1];
					}
				} else if (String(uri.getAuthority()) == "com.android.providers.downloads.documents") {
					uri = android.content.ContentUris.withAppendedId(
						android.net.Uri.parse("content://downloads/public_downloads"),
						parseInt(android.provider.DocumentsContract.getDocumentId(uri))
					);
				} else if (String(uri.getAuthority()) ==  "com.android.providers.media.documents") {
					docs = String(android.provider.DocumentsContract.getDocumentId(uri)).split(":");
					if (docs[0] == "image") {
						uri = android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
					} else if (docs[0] == "video") {
						uri = android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
					} else if (docs[0] == "audio") {
						uri = android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
					}
					selection = "_id=?";
					selectionArgs = [docs[1]];
				}
			}
			try {
				cursor = ctx.getContentResolver().query(uri, ["_data"], selection, selectionArgs, null);
				if (cursor && cursor.moveToFirst()) {
					r = String(cursor.getString(cursor.getColumnIndexOrThrow("_data")));
				}
			} catch(e) {Log.e(e)}
			if (cursor) cursor.close();
			return r;
		} else if (uri.getScheme().equalsIgnoreCase("file")) {
			return String(uri.getPath());
		}
		return null;
	},
	fileToUri : function(file) {
		file = file instanceof java.io.File ? file : new java.io.File(file);
		if (android.os.Build.VERSION.SDK_INT >= 24 && MapScript.host == "Android") {
			return ScriptInterface.fileToUri(file);
		} else {
			return android.net.Uri.fromFile(file);
		}
	},
	selectFile : function(mimeType, callback) {
		var i = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
		i.setType(mimeType);
		this.startActivityForResult(i, function(resultCode, data) {
			if (resultCode != -1) return; // RESULT_OK = -1
			callback(AndroidBridge.uriToFile(data.getData()));
		});
	},
	selectImage : function(callback) {
		if (MapScript.host == "Android") {
			try {
				this.selectFile("image/*", function(path) {
					callback(path);
				});
				return;
			} catch(e) {erp(e, true)} //某些垃圾手机不支持这种选择方式
		}
		Common.showFileDialog({
			type : 0,
			check : function(path) {
				var bmp = G.BitmapFactory.decodeFile(path.getAbsolutePath());
				if (!bmp) {
					Common.toast("不支持的图片格式");
					return false;
				}
				bmp.recycle();
				return true;
			},
			callback : function(f) {
				var path = String(f.result.getAbsolutePath());
				callback(path);
			}
		});
	},
	createShortcut : function(intent, name, icon) {
		if (android.os.Build.VERSION.SDK_INT >= 26) {
			var manager = ctx.getSystemService(ctx.SHORTCUT_SERVICE);
			var shortcut = new android.content.pm.ShortcutInfo.Builder(ctx, name)
				.setShortLabel(name)
				.setLongLabel(name)
				.setIcon(isNaN(icon) ? icon : android.graphics.drawable.Icon.createWithResource(ctx, icon))
				.setIntent(intent)
				.build();
			var callback = android.app.PendingIntent.getBroadcast(ctx, 0,
				manager.createShortcutResultIntent(shortcut), android.app.PendingIntent.FLAG_ONE_SHOT);
			manager.requestPinShortcut(shortcut, callback.getIntentSender());
		} else {
			var i = new android.content.Intent("com.android.launcher.action.INSTALL_SHORTCUT");
			i.putExtra(android.content.Intent.EXTRA_SHORTCUT_NAME, name);
			i.putExtra("duplicate", false);
			i.putExtra(android.content.Intent.EXTRA_SHORTCUT_INTENT, intent);
			if (isNaN(icon)) {
				i.putExtra(android.content.Intent.EXTRA_SHORTCUT_ICON, icon);
			} else {
				i.putExtra(android.content.Intent.EXTRA_SHORTCUT_ICON_RESOURCE, android.content.Intent.ShortcutIconResource.fromContext(ctx, icon));
			}
			ctx.sendBroadcast(i);
		}
	},
	startAccessibilitySvcByRoot : function() {
		var s = String(android.provider.Settings.Secure.getString(ctx.getContentResolver(), android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)).split(":");
		var t = "com.xero.ca/com.xero.ca.AccessibilitySvc";
		var f = s.some(function(e) {
			return e == t;
		});
		if (f) return true;
		s.push(t);
		try {
			var r = java.lang.Runtime.getRuntime(), p;
			p = r.exec(["su", "root", "settings", "put", "secure", "enabled_accessibility_services", s.join(":")]);
			p.waitFor();
			if (p.getErrorStream().available() > 0) return false;
			p = r.exec(["su", "root", "settings", "put", "secure", "accessibility_enabled", "1"]);
			p.waitFor();
			if (p.getErrorStream().available() > 0) return false;
			return true;
		} catch(e) {Log.e(e)}
		return false;
	},
	startAccessibilitySvcByRootAsync : function(callback, silently) {
		new java.lang.Thread(function() {
			var success = AndroidBridge.startAccessibilitySvcByRoot();
			if (callback) callback(success);
			if (silently) return;
			if (success) {
				Common.toast("无障碍服务已启动");
			} else {
				Common.toast("无障碍服务启动失败");
			}
		}).start();
	},
	startWatchClipboard : function() {G.ui(function() {try {
		var svc = ctx.getSystemService(ctx.CLIPBOARD_SERVICE);
		if (android.os.Build.VERSION.SDK_INT >= 11) {
			svc.addPrimaryClipChangedListener(AndroidBridge.clipListener = new android.content.ClipboardManager.OnPrimaryClipChangedListener({onPrimaryClipChanged : function() {try {
				if (!CA.settings.watchClipboard || !CA.IntelliSense.library || !Common.hasClipboardText()) return;
				var s = String(Common.getClipboardText()), t, o;
				s = s.replace(/^\s*\/?/, "");
				o = s.search(/\n/);
				if (o >= 0) s = s.slice(0, o);
				o = s.search(/\s/);
				t = o >= 0 ? s.slice(0, o) : s;
				if (!(t.toLowerCase() in CA.IntelliSense.library.commands)) return;
				CA.addHistory(s);
			} catch(e) {erp(e)}}}));
		}
	} catch(e) {erp(e)}})},
	exitLoading : function(keepActivity) {
		var activity = ScriptInterface.getBindActivity();
		if (!activity) return;
		activity.runOnUiThread(function() {try {
			if (keepActivity) {
				activity.moveTaskToBack(false);
			} else {
				if (G.style == "Material") {
					activity.finishAndRemoveTask();
				} else {
					activity.finish();
				}
			}
		} catch(e) {erp(e)}});
	},
	showActivityContent : function(canFloat) {
		var activity = ScriptInterface.getBindActivity();
		if (!activity) return;
		activity.runOnUiThread(function() {try {
			var layout, help, ensurefloat, exit;
			layout = new G.LinearLayout(ctx);
			layout.setBackgroundColor(G.Color.WHITE);
			layout.setOrientation(G.LinearLayout.VERTICAL);
			layout.setGravity(G.Gravity.CENTER);
			layout.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			layout.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -1));
			help = new G.TextView(ctx);
			help.setGravity(G.Gravity.CENTER);
			help.setTextSize(16);
			help.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			help.setText(canFloat ? "当前模式∶悬浮窗模式\n您现在可以在屏幕上找到命令助手的悬浮窗，找不到的话请手动打开命令助手的悬浮窗权限" : "当前模式∶页面模式\n检测到命令助手没有悬浮窗权限，无法以悬浮窗模式打开命令助手。如果您已给予权限，请手动重启命令助手。");
			help.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
			layout.addView(help);
			ensurefloat = new G.Button(ctx);
			ensurefloat.setText("检查悬浮窗权限");
			ensurefloat.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			ensurefloat.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (SettingsCompat.ensureCanFloat(false)) {
					G.ui(function() {try {
						G.Toast.makeText(ctx, "悬浮窗权限已打开", 0).show();
					} catch(e) {erp(e)}});
				}
			} catch(e) {erp(e)}}}));
			layout.addView(ensurefloat);
			exit = new G.Button(ctx);
			exit.setText("退出命令助手");
			exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				CA.performExit();
			} catch(e) {erp(e)}}}));
			layout.addView(exit);
			activity.setContentView(layout);
		} catch(e) {erp(e)}});
	},
	checkNecessaryPermissions : function(callback) {
		AndroidBridge.requestPermissions([
			"android.permission.READ_EXTERNAL_STORAGE",
			"android.permission.WRITE_EXTERNAL_STORAGE"
		], "读取内部存储\n写入内部存储\n\n这些权限将用于读写命令库、编辑JSON、记录错误日志等", function(flag, success, denied, sync) {
			if (!sync) {
				if (flag) {
					CA.load();
					Common.toast("权限请求成功，已重新加载配置");
				} else {
					Common.toast("权限请求失败\n将造成部分命令库无法读取等问题");
				}
			}
			if (callback) callback(flag);
		});
	},
	keeperMenu : [{
		text : "显示/隐藏图标",
		onclick : function() {
			if (CA.icon) {
				CA.hideIcon();
			} else {
				CA.showIcon();
			}
		}
	}, {
		text : "快捷栏",
		onclick : function() {
			CA.showQuickBar();
		}
	}, {
		text : "退出命令助手",
		onclick : function() {
			CA.performExit();
		}
	}],
	uriActions : {
		open : {
			default : function() {
				CA.showGen(true);
			}
		},
		command : {
			edit : function(fragment, query, extras) {
				G.ui(function() {try {
					CA.showGen(true);
					CA.cmd.setText(String(query.text));
					CA.showGen.activate(false);
				} catch(e) {erp(e)}});
			}
		},
		feedback : {
			authorize : function(fragment, query, extras) {
				GiteeFeedback.callbackOAuth(String(query.code));
			}
		}
	}
});