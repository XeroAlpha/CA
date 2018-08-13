Plugins.inject(function(o) {
var port = 10523, server, connection;
o.name = "调试器";
o.author = "ProjectXero";
o.version = [1, 0, 0];
o.uuid = "56b45fa6-ee17-43c4-968d-05c7bd3ee134";
var preference = ctx.getSharedPreferences("user_settings", ctx.MODE_PRIVATE);
o.menu = [{
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
				AndroidBridge.createShortcut(intent, "调试启动", com.xero.ca.R.drawable.icon_small);
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
}];
MapScript.loadModule("OnlineDebugger", {
	unload : function() {
		stopServer();
	}
});
try {
	startServer();
} catch(e) {Common.toast(e)}
function startServer() {
	server = ScriptActivity.createWebSocketHelper(port, {
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
			erp(err);
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
	Log.s(eval.call(null, cmd));
}
function println(level, text) {
	connection.send(JSON.stringify({
		type : "println",
		level : level,
		text : text
	}));
}
})
