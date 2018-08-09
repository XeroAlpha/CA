Plugins.inject(function(o) {
var port = 10523, server, connection;
o.name = "在线调试器";
o.author = "ProjectXero";
o.version = [1, 0, 0];
o.uuid = "56b45fa6-ee17-43c4-968d-05c7bd3ee134";
MapScript.loadModule("OnlineDebugger", {
	unload : function() {
		stopServer();
	}
});
try {
	startServer();
} catch(e) {erp(e)}
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
