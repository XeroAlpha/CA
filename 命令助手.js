"ui";
/*
    Command Assistant (命令助手)
    Copyright (C) 2017-2019  ProjectXero
    E-mail: projectxero@163.com

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see [http://www.gnu.org/licenses/].
*/
function attackHook(attacker, victim) {}
function chatHook(str) {}
function continueDestroyBlock(x, y, z, side, progress) {}
function destroyBlock(x, y, z, side) {}
function projectileHitEntityHook(projectile, targetEntity) {}
function eatHook(hearts, saturationRatio) {}
function entityAddedHook(entity) {}
function entityHurtHook(attacker, victim, halfhearts) {}
function entityRemovedHook(entity) {}
function explodeHook(entity, x, y, z, power, onFire) {}
function serverMessageReceiveHook(str) {}
function deathHook(attacker, victim) {}
function playerAddExpHook(player, experienceAdded) {}
function playerExpLevelChangeHook(player, levelsAdded) {}
function redstoneUpdateHook(x, y, z, newCurrent, someBooleanIDontKnow, blockId, blockData) {}
function screenChangeHook(screenName) {}
function newLevel() {}
function startDestroyBlock(x, y, z, side) {}
function projectileHitBlockHook(projectile, blockX, blockY, blockZ, side) {}
function modTick() {}
function leaveGame() {}
function useItem(x, y, z, itemid, blockid, side, itemDamage, blockDamage) {}
function initialize() {}
function unload() {}

var MapScript = {
	//可访问钩子
	hooks : ["attackHook", "chatHook", "continueDestroyBlock", "destroyBlock", "projectileHitEntityHook", "eatHook", "entityAddedHook", "entityHurtHook", "entityRemovedHook", "explodeHook", "serverMessageReceiveHook", "deathHook", "playerAddExpHook", "playerExpLevelChangeHook", "redstoneUpdateHook", "screenChangeHook", "newLevel", "startDestroyBlock", "projectileHitBlockHook", "modTick", "leaveGame", "useItem", "initialize", "unload"],

	//已加载模块列表
	modules : [],

	//重置函数代码
	clearCode : function(func) {
		if (!(func in this) || typeof this[func] != "function") return null;
		var q = this[func].toString();
		q = q.slice(q.indexOf("function"), q.indexOf("{"));
		return this[func] = eval("(" + q + "{})");
	},

	//补充函数代码
	addCode : function(func, code) {
		if (!(func in this) || typeof this[func] != "function") return null;
		var q = this[func].toString();
		q = q.slice(q.indexOf("function"), q.lastIndexOf("}"));
		return this[func] = eval("(" + q + code + "})");
	},

	//读取并解析JSON-EX
	readJSON : function(path, defaultValue, gzipped) {
		try{
			if (!(new java.io.File(path)).isFile()) return defaultValue;
			var rd, s = [], q;
			if (gzipped) {
				rd = new java.io.BufferedReader(new java.io.InputStreamReader(new java.util.zip.GZIPInputStream(new java.io.FileInputStream(path))));
			} else {
				rd = new java.io.BufferedReader(new java.io.FileReader(path));
			}
			while (q = rd.readLine()) s.push(q);
			rd.close();
			return eval("(" + s.join("\n") + ")");
		} catch(e) {
			return defaultValue;
		}
	},

	//保存JSON-EX
	saveJSON : function(path, object, gzipped) {
		var wr;
		var f = new java.io.File(path).getParentFile();
		if (f) f.mkdirs();
		if (gzipped) {
			wr = new java.util.zip.GZIPOutputStream(new java.io.FileOutputStream(path));
		} else {
			wr = new java.io.FileOutputStream(path);
		}
		wr.write(new java.lang.String(this.toSource(object)).getBytes());
		wr.close();
	},

	//加载模块
	loadModule : function(name, obj, ignoreHook) {
		var i, sn, dx = this.modules.indexOf(name);
		if (obj === undefined && dx >= 0) {
			delete this.global[name];
		} else if (!(name in this.global) || dx >= 0) {
			this.global[name] = obj;
			if (dx < 0) this.modules.push(name);
			if (!ignoreHook && (obj instanceof Object)) {
				if (typeof obj.onCreate == "function") obj.onCreate();
				sn = this.toSource(name);
				for (i in obj)
					if (typeof obj[i] == "function" && this.hooks.indexOf(i) >= 0 && this.global[i].length == obj[i].length)
						this.addCode.call(this.global, i, "this[" + sn + "]." + i + ".apply(this[" + sn + "],arguments);");
			}
		} else return false;
		return true;
	},
	
	//返回对象源代码
	toSource : function(obj) {
		var strtok = ["\\\\", "\\n", "\\t", /*"\\b",*/ "\\r", "\\f", "\\\"", "\\\'"];
		var _toJSON = function toJSON(x, lev) {
			var p = "", r, i;
			if (lev < 0) return toJSON(String(x), 0);
			if (typeof x == "string") {
				for (i = 0; i < strtok.length; i++) x = x.replace(new RegExp(strtok[i], "g"), strtok[i]);
				return "\"" + x + "\"";
			} else if (Array.isArray(x)) {
				r = new Array();
				for (i = 0; i < x.length; i++) r.push(toJSON(x[i], lev - 1));
				p = "[" + r.join(",") + "]";
			} else if (x instanceof Error) {
				p = "new Error(" + toJSON(x.message) + ")";
			} else if (x instanceof RegExp) {
				p = x.toString();
			} else if (x instanceof Date) {
				p = "new Date(" + x.getTime() + ")";
			} else if (x instanceof Function) {
				p = x.toString();
			} else if (x instanceof Object) {
				r = new Array();
				for (i in x) r.push(toJSON(i, lev) + ":" + toJSON(x[i], lev - 1));
				p = "{" + r.join(",") + "}";
			} else if (typeof x == "object" && x != null) {
				p = toJSON(String(x), lev);
			} else {
				p = String(x);
			}
			return p;
		}
		return _toJSON(obj, 32);
	},

	//初始化
	init : function(g) {
		Object.defineProperty(this, "global", {
			enumerable: false,
			configurable: false,
			writable: false,
			value: g
		});
		if ("module" in g) { //Node.js
			module.exports = function(name) {
				return g[name];
			}
		}
	},

	initialize : function() {
		this.global.initialize();
	}
}
MapScript.init(this);

MapScript.loadModule("ctx", (function(global) {
	var cx;
	if ("ModPE" in global) { //以ModPE脚本加载(BlockLauncher及衍生App)
		MapScript.host = "BlockLauncher";
		MapScript.baseDir = android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/games/com.mojang/ca/";
		cx = com.mojang.minecraftpe.MainActivity.currentMainActivity.get();
	} else if ("activity" in global) { //以AutoJS脚本加载（UI模式）
		MapScript.host = "AutoJs";
		MapScript.baseDir = android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/com.xero.ca.script/";
		cx = activity;
	} else if ("context" in global) { //以AutoJS脚本加载（非UI模式）
		MapScript.host = "AutoJsNoUI";
		MapScript.baseDir = android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/com.xero.ca.script/";
		cx = context;
	} else if ("ScriptInterface" in global) { //在Android脚本外壳中加载
		MapScript.host = "Android";
		MapScript.baseDir = ScriptInterface.getContext().getDir("rhino", 0).getAbsolutePath() + "/";
		cx = ScriptInterface.getContext();
	} else if ("World" in global) { //在Inner Core中加载
		MapScript.host = "InnerCore";
		MapScript.baseDir = android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/games/com.mojang/ca/";
		cx = Packages.zhekasmirnov.launcher.utils.UIUtils.getContext();
	} else {
		MapScript.host = "Unknown";
		MapScript.baseDir = android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/games/com.mojang/ca/";
		cx = com.mojang.minecraftpe.MainActivity.currentMainActivity.get();
	}
	new java.io.File(MapScript.baseDir).mkdirs();
	return cx;
})(this));

MapScript.loadModule("gHandler", new android.os.Handler(ctx.getMainLooper()));

MapScript.loadModule("Log", (function() {
var proto = {
	nullFunc : function(v) {return v},
	start : function(target) {
		var i;
		for (i in this) if (i.length < 3) delete this[i];
		this.setTarget(target);
		return this;
	},
	stop : function() {
		var i;
		for (i in this) if (i.length < 3) this[i] = proto.nullFunc;
		this.setTarget("null");
		return this;
	},
	setTarget : function(target) {
		if (target instanceof Function) {
			return this.println = target;
		}
		this.println = proto.nullFunc;
	},
	throwError : function self(err) {
		Error.captureStackTrace(err, self);
		throw err;
	},
	a : function(a, b, m) { //断言
		if (a !== b) {
			this.println("Fatal", m + ": " + a + " !== " + b);
			this.r();
			this.throwError(new Error(m));
		}
	},
	c : function(f, scope) { //尝试调用函数
		try {
			for (var i = 2, s = []; i < arguments.length; i++) s.push(arguments[i]);
			return this.d(f.apply(scope, s), s);
		} catch(e) {
			this.e(e);
		}
	},
	d : function(v) { //打印多个信息
		for (var i = 0, s = []; i < arguments.length; i++) s.push(arguments[i]);
		this.println("Debug", s.join("; "));
		return v;
	},
	e : function(e) { //打印错误
		var s = [e, e.stack];
		this.println("Error", s.join("\n"));
	},
	f : function(name, args) { //记录函数
		for (var i = 0, s = []; i < args.length; i++) s.push(args[i]);
		this.println("Verbose", name + "(" + s.join(", ") + ")");
	},
	r : function captureStack() { //查看堆栈
		var k = {};
		Error.captureStackTrace(k, captureStack);
		return this.println("Debug", k.stack);
	},
	s : function(s) { //树状解析对象
		return (this.println("Debug", this.debug("D", s, 0).join("\n")), s);
	},
	t : function self(s) { //显示Toast
		ctx.runOnUiThread(function() {
			if (self.last) self.last.cancel();
			(self.last = android.widget.Toast.makeText(ctx, String(s), 0)).show();
		});
	},
	e : function(e) { //打印警告
		var s = [e, e.stack];
		this.println("Warning", s.join("\n"));
	},
	debug : function self(name, o, depth, objs) {
		var i, r = [], circular;
		if (!objs) objs = [];
		if (depth > 8) return [name + ": " + o];
		if (o instanceof java.lang.String) o = String(o);
		circular = objs.indexOf(o) >= 0;
		if (o instanceof Array) {
			r.push(name + ": " + "Array[" + o.length + "]");
		} else {
			r.push(name + ": " + (typeof o) + ": " + (o instanceof Function ? "[Function]" : circular ? "[Circular]" : o));
		}
		if (o instanceof Object && !circular) {
			objs.push(o);
			for (i in o) {
				self(i, o[i], depth + 1, objs).forEach(function(e) {
					r.push("\t" + e);
				});
			}
		}
		return r;
	}
};
return Object.create(proto).stop();
})());

MapScript.loadModule("erp", function self(error, silent, extra) {
	if (error instanceof java.lang.Throwable) {
		error = {
			javaException : error,
			stack : "",
			fileName : "",
			toString : function() {
				return this.javaException.toString();
			}
		};
	}
	var tech = [
		error,
		"\n版本: {DATE}",
		"\n来源:", error.fileName,
		"\n包名:", ctx.getPackageName(),
		"\nSDK版本:", android.os.Build.VERSION.SDK_INT,
		"\n制造商:", android.os.Build.MANUFACTURER,
		"\n堆栈:", error.stack
	].join("");
	if (MapScript.host == "BlockLauncher") tech += "\nMinecraft版本: " + ModPE.getMinecraftVersion();
	if (error.javaException) {
		var strw = new java.io.StringWriter(), strp = new java.io.PrintWriter(strw);
		error.javaException.printStackTrace(strp);
		tech += "\nJavaException: " + strw.toString();
	}
	if (extra) tech += "\n" + Log.debug("额外数据", extra, 0).join("\n");
	android.util.Log.e("CA", tech);
	try {
		var fs = new java.io.PrintWriter(new java.io.FileOutputStream(android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/com.xero.ca.error.log", true));
		fs.println("* " + (silent ? "Warning" : "Error") + ": " + new Date().toLocaleString());
		fs.println(tech);
		fs.close();
		if (silent) {
			Log.w(error);
		} else {
			Log.e(error);
		}
	} catch(e) {
		android.util.Log.e("CA", e);
	}
	if (silent) return;
	if (self.count) {
		self.count++;
	} else {
		self.count = 1;
	}
	if (self.count > 3) return;
	new java.lang.Thread(function() {try {
		var url = new java.net.URL("https://projectxero.top/ca/bugreport.php");
		var conn = url.openConnection();
		conn.setConnectTimeout(5000);
		conn.setUseCaches(false);
		conn.setRequestMethod("POST");
		conn.setDoInput(true);
		conn.setDoOutput(true);
		var rd, s, ln;
		var wr = conn.getOutputStream();
		wr.write(new java.lang.String(tech).getBytes());
		wr.flush();
		conn.getInputStream().close();
	} catch(e) {
		android.util.Log.e("CA", e);
	}}).start();
	if (MapScript.host == "Android") {
		ScriptInterface.reportError(tech);
		return;
	}
	gHandler.post(new java.lang.Runnable({run : function() {try {
		android.widget.Toast.makeText(ctx, error.fileName + "出现了一个错误：" + error + "\n查看对话框获得更多信息。", 0).show();
		var dialog = new android.app.AlertDialog.Builder(ctx);
		dialog.setTitle("错误");
		dialog.setCancelable(false);
		dialog.setMessage("您好，" + error.fileName + "出现了一个错误。您可以将这个错误反馈给我们，来推动这个Mod的更新。您也可以选择忽略。作者联系方式：QQ-814518615(Xero)\n\n错误信息：\n" + tech);
		dialog.setPositiveButton("忽略", new android.content.DialogInterface.OnClickListener({
			onClick : function(dia,w) {
				dia.dismiss();
			}
		}));
		dialog.setNegativeButton("立即停止", new android.content.DialogInterface.OnClickListener({
			onClick : function(dia,w) {
				unload()
				ctx.finish();
			}
		}));
		dialog.setNeutralButton("复制错误信息", new android.content.DialogInterface.OnClickListener({
			onClick : function(dia,w) {try {
				ctx.getSystemService(ctx.CLIPBOARD_SERVICE).setText(tech);
				android.widget.Toast.makeText(ctx, "错误信息已复制", 0).show();
				dia.dismiss();
			} catch(e) {}}
		}));
		dialog.show();
	} catch(e) {}}}));
});

MapScript.loadModule("Loader", {
	loading : false,
	load : function(f) {
		var lto, lm, lmb;
		if (MapScript.host == "Android") {
			lm = MapScript.loadModule;
			lmb = lm.bind(MapScript);
			MapScript.loadModule = function(name, obj, ignoreHook) {
				ScriptInterface.setLoadingTitle("正在加载模块：" + name);
				lmb(name, obj, ignoreHook);
			};
		}
		this.loading = true;
		this.enableCache();
		if (MapScript.host != "Android") {
			gHandler.post(function() {try {
				lto = android.widget.Toast.makeText(ctx, "命令助手 by ProjectXero\n基于Rhino (" + MapScript.host + ")\n加载中……", 1);
				lto.setGravity(android.view.Gravity.CENTER, 0, 0);
				lto.show();
			} catch(e) {erp(e)}});
		}
		var th = new java.lang.Thread(new java.lang.Runnable({run : function() {try { //Async Loading
			f();
			gHandler.post(function() {try {
				if (lto) lto.cancel();
				if (lm) ScriptInterface.setLoadingTitle("初始化模块");
			} catch(e) {erp(e)}});
			if (lm) MapScript.loadModule = lm;
			Loader.loading = false;
			Loader.disableCache();
			MapScript.initialize();
		} catch(e) {erp(e)}}}));
		th.start();
	},
	enableCache : function() {
		if (!this.cache) this.cache = {};
	},
	disableCache : function() {
		if (this.cache) this.cache = null;
	},
	open : function(path) {
		if (MapScript.host == "Android") {
			var manager = ScriptInterface.getScriptManager();
			return manager.open(path);
		} else if (MapScript.global.modulePath) {
			return new java.io.FileInputStream(new java.io.File(MapScript.global.modulePath, path));
		} else Log.throwError(new Error("不支持的平台"));
	},
	fromFile : function(path) { //这是一个占位符函数，它只会在调试过程中起作用
		var pathFile, rd, s, parentDir, t;
		pathFile = new java.io.File(path.replace(/\\/g, "/")).getCanonicalFile();
		path = pathFile.getPath();
		if (this.cache && path in this.cache) return this.cache[path];
		rd = new java.io.BufferedReader(new java.io.InputStreamReader(this.open(path)));
		s = [];
		while (t = rd.readLine()) s.push(t);
		rd.close();
		s = s.join("\n");
		parentDir = pathFile.getParent();
		s = s.replace(/Loader.fromFile\("(.+)"\)/g, function(match, mpath) {
			return match.replace(mpath, new java.io.File(parentDir, mpath));
		});
		if (s.search(/;\s*$/) < 0) s = "(" + s + ")";
		t = this.evalSpecial(s, pathFile.getName(), 0);
		if (this.cache) this.cache[path] = t;
		return t;
	},
	evalSpecial : function(source, sourceName, lineNumber) {
		var cx = org.mozilla.javascript.Context.getCurrentContext();
		return org.mozilla.javascript.ScriptRuntime.evalSpecial(cx, MapScript.global, null, [new java.lang.String(source)], sourceName, lineNumber);
	},
	lockProperty : function(obj, propertyName) {
		Object.defineProperty(obj, propertyName, {
			enumerable: false,
			configurable: false,
			writable: false,
			value: obj[propertyName]
		});
	},
	lockMethods : function(obj, methods) {
		var i, a = methods || Object.getOwnPropertyNames(obj);
		for (i = 0; i < a.length; i++) {
			if (typeof obj[a[i]] == "function") this.lockProperty(obj, a[i]);
		}
	},
	lockFields : function(obj, fields) {
		var i, a = fields || Object.getOwnPropertyNames(obj);
		for (i = 0; i < a.length; i++) {
			if (typeof obj[a[i]] != "function") this.lockProperty(obj, a[i]);
		}
	},
	freezeObject : function(obj) {
		var i, a = Object.getOwnPropertyNames(obj);
		for (i = 0; i < a.length; i++) {
			if (typeof obj[a[i]] == "object") this.freezeObject(obj[a[i]]);
		}
		Object.freeze(obj);
	},
	freezeProperty : function(obj, propertyName) {
		if (typeof obj[propertyName] == "object") this.freezeObject(obj[propertyName]);
		this.lockProperty(obj, propertyName);
	},
	freezeFields : function(obj, fields) {
		var i, a = fields || Object.getOwnPropertyNames(obj);
		for (i = 0; i < a.length; i++) {
			if (typeof obj[a[i]] != "function") this.freezeProperty(obj, a[i]);
		}
	},
});

Loader.load(function() {
Loader.fromFile("modules/BuildConfig.js")

Loader.fromFile("modules/test/FileLogger.js")

Loader.fromFile("modules/uiCore/G.js")

Loader.fromFile("modules/core/EventSender.js")

Loader.fromFile("modules/uiCore/L.js")

Loader.fromFile("modules/uiCore/PWM.js")

Loader.fromFile("modules/uiCore/PopupPage.js")

Loader.fromFile("modules/core/MemSaver.js")

Loader.fromFile("modules/CA.js")

Loader.fromFile("modules/uiCore/PopupWindow.js")

Loader.fromFile("modules/Common.js")

Loader.fromFile("modules/core/Plugins.js")

Loader.fromFile("modules/utils/GlobalUtils.js")

Loader.fromFile("modules/sense/FCString.js")

Loader.fromFile("modules/Tutorial.js")

Loader.fromFile("modules/listAdapter/EmptyAdapter.js")

Loader.fromFile("modules/listAdapter/RhinoListAdapter.js")

Loader.fromFile("modules/listAdapter/FilterListAdapter.js")

Loader.fromFile("modules/listAdapter/SimpleListAdapter.js")

Loader.fromFile("modules/listAdapter/MultipleListAdapter.js")

Loader.fromFile("modules/listAdapter/ExpandableListAdapter.js")

Loader.fromFile("modules/network/NetworkUtils.js")

Loader.fromFile("modules/network/Updater.js")

Loader.fromFile("modules/sense/ISegment.js")

Loader.fromFile("modules/JSONEdit.js")

Loader.fromFile("modules/utils/SettingsCompat.js")

Loader.fromFile("modules/EasterEgg.js")

Loader.fromFile("modules/MCAdapter.js")

Loader.fromFile("modules/AndroidBridge.js")

Loader.fromFile("modules/core/DexPlugin.js")

Loader.fromFile("modules/NeteaseAdapter.js")

Loader.fromFile("modules/network/WSServer.js")

Loader.fromFile("modules/network/GiteeFeedback.js")

Loader.fromFile("modules/uiCore/LPlugins.js")

Loader.fromFile("modules/DebugUtils.js")

Loader.fromFile("modules/builtinData.js")

Loader.fromFile("modules/LockClasses.js")
});