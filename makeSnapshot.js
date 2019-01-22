var fs = require("fs");
var process = require("process");
var zlib = require("zlib");
var loader = require("./loader");

var cwd = process.cwd();
var script = cwd + "/命令助手.js";
var help = cwd + "/帮助.html";
ensureDir(cwd + "/snapshot");

function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}
function fixZero(s, n) {
	s = String(s);
	return n > s.length ? fixZero("0" + s, n) : s;
}
function getDateId(d) {
	return fixZero(d.getFullYear(), 4) + fixZero(d.getMonth() + 1, 2) + fixZero(d.getDate(), 2) + fixZero(d.getHours(), 2) + fixZero(d.getMinutes(), 2) + fixZero(d.getSeconds(), 2);
}

function buildSnapshot() {
	var s = loader.load(script, "utf-8");
	var id = getDateId(new Date());
	s = s.replace(/\{DATE\}/g, "S" + id);
	fs.writeFileSync(cwd + "/snapshot/命令助手快照" + id + ".lib", asLibrary([
		'Plugins.inject(function(o){',
			'const id=' + JSON.stringify(id) + ';',
			'function u(p,b){',
				'var o=new java.io.FileOutputStream(p);',
				'o.write(android.util.Base64.decode(b,2));',
				'o.close();',
			'}',
			'o.name="命令助手快照包 - "+id;',
			'o.description="命令助手快照安装器\\n";',
			'o.uuid="f6cf1729-3861-481b-a9ac-e3f48cbc4a94";',
			'o.author="命令助手制作组";',
			'o.version=[1,0];',
			'if (CA.publishDate==' + JSON.stringify("S" + id) + '){return void(o.description+="您正在使用本快照或更高版本\\n\\n"+ds)}',
			'if(MapScript.host!="Android")return void(o.description+="本快照仅适用于App版");',
			'u(MapScript.baseDir+"snapshot.js",' + JSON.stringify(Buffer.from(s).toString("base64")) + ');',
			'ctx.getSharedPreferences("user_settings",ctx.MODE_PRIVATE).edit().putString("debugSource",MapScript.baseDir+"snapshot.js").apply()',
			'AndroidBridge.createShortcut(new android.content.Intent("com.xero.ca.DEBUG_EXEC").setComponent(new android.content.ComponentName("com.xero.ca","com.xero.ca.MainActivity")).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK),"快照命令助手",com.xero.ca.R.mipmap.icon_small);',
			'Common.showTextDialog(o.description+="快照已安装完毕，您可以在桌面找到快照版的快捷方式");',
			'CA.Library.removeLibrary(path);',
		'})'
	].join("\n")));
}
function asLibrary(s) {
	var o;
	var dh = Buffer.alloc(15), date = Date.now();
	dh.write("LIBRARY");
	dh.writeInt32BE(Math.floor(date / 0xffffffff), 7);
	dh.writeInt32BE(date & 0xffffffff, 11);
	s = zlib.gzipSync(s);
	o = Buffer.alloc(dh.length + s.length);
	dh.copy(o, 0);
	s.copy(o, dh.length);
	return o;
}

buildSnapshot();