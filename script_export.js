var fs = require("fs");
var process = require("process");
var zlib = require("zlib");
var loader = require("./loader");

var cwd = process.cwd();
var versions = JSON.parse(fs.readFileSync(cwd + "/versions.json", 'utf-8'));
var curdate = versions[versions.length - 1].version;
var script = cwd + "/命令助手.js";
var outputFile = cwd + "/build/export.js";
var minifiedFile = cwd + "/build/min.js";
var exportFile = cwd + "/export/命令助手(" + curdate + ").js";
ensureDir(cwd + "/build");
ensureDir(cwd + "/export");

function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function initScript(s) {
	return String(s).replace(/\{DATE\}/g, curdate);
	//记录版本日期
}

function initExport(s) {
	s = initScript(s);
	
	s = jsmin("", s, 1);
	//压缩js（需花费很长时间）
	
	s = s.replace(/"IGNORELN_START";([^]*?)"IGNORELN_END";/g, function(match, p) {
		return p.replace(/\s*\n\s*/g, "");
	});
	//去除部分换行符
	
	s = s.replace(/^\s*/, "");
	//去除开头多余的空行
	
	s = s.replace(/^"ui";\n/, "").replace(/CA\.RELEASE/g, "true");
	//去除UI标志，标记正式版
	
	return s;
}

function initGZIP(s) {
	var b = Buffer.from(s);
	b = zlib.gzipSync(b); //GZIP压缩
	var r = '"ui";\nvar a=new java.io.BufferedReader(new java.io.InputStreamReader(new java.util.zip.GZIPInputStream(new java.io.ByteArrayInputStream(android.util.Base64.decode("' + b.toString("base64") + '",2))))),b=[],c;while(c=a.readLine())b.push(c);a.close();eval(b.join("\\n"));';
	return r;
}

function exports() {
	var out, min;
	console.log("Linking...");
	fs.writeFileSync(outputFile, out = loader.load(script, "utf-8"));
	console.log("Running js-min...");
	fs.writeFileSync(minifiedFile, min = initExport(out));
	console.log("Compressing...");
	fs.writeFileSync(exportFile, initGZIP(min));
}

// JavaScript Document
String.prototype.has = function(c) {
    return this.indexOf(c) > -1;
};
function jsmin(comment, input, level) {
    if (input === undefined) {
        input = comment;
        comment = '';
        level = 2;
    } else if (level === undefined || level < 1 || level > 3) {
        level = 2;
    }
    if (comment.length > 0) {
        comment += '\n';
    }
    var a = '',
    b = '',
    EOF = -1,
    LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    DIGITS = '0123456789',
    ALNUM = LETTERS + DIGITS + '_$\\',
    theLookahead = EOF;
    function isAlphanum(c) {
        return c != EOF && (ALNUM.has(c) || c.charCodeAt(0) > 126);
    }
    function get() {
        var c = theLookahead;
        if (get.i == get.l) {
            return EOF;
        }
        theLookahead = EOF;
        if (c == EOF) {
            c = input.charAt(get.i); ++get.i;
        }
        if (c >= ' ' || c == '\n') {
            return c;
        }
        if (c == '\r') {
            return '\n';
        }
        return ' ';
    }
    get.i = 0;
    get.l = input.length;
    function peek() {
        theLookahead = get();
        return theLookahead;
    }
    function next() {
        var c = get();
        if (c == '/') {
            switch (peek()) {
            case '/':
                for (;;) {
                    c = get();
                    if (c <= '\n') {
                        return c;
                    }
                }
                break;
            case '*':
                get();
                for (;;) {
                    switch (get()) {
                    case '*':
                        if (peek() == '/') {
                            get();
                            return ' ';
                        }
                        break;
                    case EOF:
                        throw 'Error: Unterminated comment.';
                    }
                }
                break;
            default:
                return c;
            }
        }
        return c;
    }
    function action(d) {
        var r = [];
        if (d == 1) {
            r.push(a);
        }
        if (d < 3) {
            a = b;
            if (a == '\'' || a == '"') {
                for (;;) {
                    r.push(a);
                    a = get();
                    if (a == b) {
                        break;
                    }
                    if (a <= '\n') {
                        throw 'Error: unterminated string literal: ' + a;
                    }
                    if (a == '\\') {
                        r.push(a);
                        a = get();
                    }
                }
            }
        }
        b = next();
        if (b == '/' && '(,=:[!&|'.has(a)) {
            r.push(a);
            r.push(b);
            for (;;) {
                a = get();
                if (a == '/') {
                    break;
                } else if (a == '\\') {
                    r.push(a);
                    a = get();
                } else if (a <= '\n') {
                    throw 'Error: unterminated Regular Expression literal';
                }
                r.push(a);
            }
            b = next();
        }
        return r.join('');
    }
    function m() {
        var r = [];
        a = '\n';
        r.push(action(3));
        while (a != EOF) {
            switch (a) {
            case ' ':
                if (isAlphanum(b)) {
                    r.push(action(1));
                } else {
                    r.push(action(2));
                }
                break;
            case '\n':
                switch (b) {
                case '{':
                case '[':
                case '(':
                case '+':
                case '-':
                    r.push(action(1));
                    break;
                case ' ':
                    r.push(action(3));
                    break;
                default:
                    if (isAlphanum(b)) {
                        r.push(action(1));
                    } else {
                        if (level == 1 && b != '\n') {
                            r.push(action(1));
                        } else {
                            r.push(action(2));
                        }
                    }
                }
                break;
            default:
                switch (b) {
                case ' ':
                    if (isAlphanum(a)) {
                        r.push(action(1));
                        break;
                    }
                    r.push(action(3));
                    break;
                case '\n':
                    if (level == 1 && a != '\n') {
                        r.push(action(1));
                    } else {
                        switch (a) {
                        case '}':
                        case ']':
                        case ')':
                        case '+':
                        case '-':
                        case '"':
                        case '\'':
                            if (level == 3) {
                                r.push(action(3));
                            } else {
                                r.push(action(1));
                            }
                            break;
                        default:
                            if (isAlphanum(a)) {
                                r.push(action(1));
                            } else {
                                r.push(action(3));
                            }
                        }
                    }
                    break;
                default:
                    r.push(action(1));
                    break;
                }
            }
        }
        return r.join('');
    }
    jsmin.oldSize = input.length;
    ret = m(input);
    jsmin.newSize = ret.length;
    return comment + ret;
}
console.log("Start Export at " + process.cwd());
exports();
console.log("Complete. File has been exported to " + exportFile);
