Plugins.inject(function(o) {
var port = 10523, server, connection;
o.name = "调试器";
o.author = "ProjectXero";
o.version = [1, 0, 0];
o.uuid = "56b45fa6-ee17-43c4-968d-05c7bd3ee134";
o.feature("corePlugin");
var preference = ctx.getSharedPreferences("user_settings", ctx.MODE_PRIVATE);
o.menu = [{
	text : "启用在线调试器",
	hidden : function() {
		return o.corePlugin;
	},
	onclick : function() {
		o.requestLoadAsCore();
		Common.toast("已启用，下次启动时生效");
	}
}, {
	text : "关闭在线调试器",
	hidden : function() {
		return !o.corePlugin;
	},
	onclick : function() {
		o.cancelLoadAsCore();
		Common.toast("已关闭，下次启动时生效");
	}
}, {
	text : "使用外置代码源",
	hidden : function() {
		return String(preference.getString("debugSource", "")).length > 0;
	},
	onclick : function() {
		Common.showFileDialog({
			type : 0,
			callback : function(f) {
				var intent = new android.content.Intent("com.xero.ca.DEBUG_EXEC")
					.setComponent(new android.content.ComponentName("com.xero.ca", "com.xero.ca.MainActivity"))
					.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
				preference.edit().putString("debugSource", f.result.getAbsolutePath()).apply();
				AndroidBridge.createShortcut(intent, "调试启动", com.xero.ca.R.mipmap.icon_small);
				Common.toast("源已更改，下次调试启动时生效");
			}
		});
	}
}, {
	text : "使用内置代码源",
	hidden : function() {
		return !String(preference.getString("debugSource", "")).length;
	},
	onclick : function() {
		preference.edit().remove("debugSource").apply();
		Common.toast("源已更改，下次调试启动时生效");
	}
}, {
	text : "打开当前代码源",
	onclick : function() {
		try {
			var sm = ScriptInterface.getScriptManager();
			var cls = sm.getClass();
			var method = cls.getDeclaredMethod("getScriptReader");
			method.setAccessible(true);
			var q, s = [], rd = new java.io.BufferedReader(method.invoke(sm));
			while (q = rd.readLine()) s.push(q);
			rd.close();
			var f = new java.io.File(ctx.getExternalCacheDir(), "sourcedump.js");
			f.delete();
			var fs = new java.io.FileOutputStream(f);
			fs.write(new java.lang.String(s.join("\n")).getBytes());
			fs.close();
			ctx.startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW)
				.setDataAndType(AndroidBridge.fileToUri(f), "text/plain")
				.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION | android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION | android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
		} catch(e) {
			Common.toast(e);
		}
	}
}, {
	text : "导出当前代码源",
	onclick : function() {
		try {
			var sm = ScriptInterface.getScriptManager();
			var cls = sm.getClass();
			var method = cls.getDeclaredMethod("getScriptReader");
			method.setAccessible(true);
			var q, s = [], rd = new java.io.BufferedReader(method.invoke(sm));
			while (q = rd.readLine()) s.push(q);
			rd.close();
			Common.showFileDialog({
				type : 1,
				callback : function(f) {
					Common.saveFile(f.result.getAbsolutePath(), s.join("\n"));
					Common.toast("代码源已保存");
				}
			});
		} catch(e) {
			Common.toast(e);
		}
	}
}];
MapScript.loadModule("OnlineDebugger", {
	unload : function() {
		stopServer();
	}
});
try {
	if (o.corePlugin) startServer();
} catch(e) {Common.toast(e)}
function startServer() {
	server = ScriptInterface.createWebSocketHelper(port, {
		onOpen : function(conn, handshake) {try {
			if (connection) conn.close(1);
			connection = conn;
			sendVersion();
			Log.start(println);
			Common.toast("设备" + conn.getRemoteSocketAddress() + "已连接");
		} catch(e) {erp(e)}},
		onClose : function(conn, code, reason, remote) {try {
			Log.stop();
			connection = null;
		} catch(e) {erp(e)}},
		onMessage : function(conn, message) {try {
			try {
				var o = JSON.parse(message);
				switch (o.type) {
					case "exec":
					executeCommand(o.cmd);
					break;
					case "ping":
					conn.send(JSON.stringify({type : "pong"}));
					break;
				}
			} catch(e) {
				Log.e(e);
			}
		} catch(e) {erp(e)}},
		onError : function(conn, err) {
			Common.toast(err);
		},
		onStart : function() {try {
			Common.toast("服务器已在端口" + port + "开启");
		} catch(e) {erp(e)}}
	});
	server.setTcpNoDelay(true);
	server.start();
}
function stopServer() {
	if (!server) return;
	server.stop();
	server = null;
}
function sendVersion() {
	connection.send(JSON.stringify({
		type : "version",
		version : CA.version,
		publishDate : CA.publishDate
	}));
}
function executeCommand(cmd) {
	if (cmd.startsWith("#")) {
		G.ui(function() {
			try {
				Log.s(eval.call(null, cmd.slice(1)));
			} catch(e) {
				Log.e(e);
			}
		});
	} else {
		try {
			Log.s(eval.call(null, cmd));
		} catch(e) {
			Log.e(e);
		}
	}
}
function println(level, text) {
	connection.send(JSON.stringify({
		type : "println",
		level : level,
		text : text
	}));
}
})
