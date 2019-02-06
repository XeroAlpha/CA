MapScript.loadModule("DebugUtils", {
	showDebugDialog : function self() {G.ui(function() {try {
		if (!self.main) {
			self.LINE_LIMIT = 200;
			self.history = [];
			self.lines = [];
			self.vmaker = function(holder) {
				var text = holder.text = new G.TextView(ctx);
				text.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				Common.applyStyle(text, "textview_default", 2);
				return text;
			}
			self.vbinder = function(holder, e, i, a) {
				holder.text.setText(e);
				holder.text.setPadding(10 * G.dp, i == 0 ? 10 * G.dp : 0, 10 * G.dp, i == a.length - 1 ? 10 * G.dp : 0);
			}
			self.cls = function() {
				self.lines.length = 0;
				self.history.length = 0;
				self.lines.push(new G.SpannableStringBuilder());
				self.print("控制台 - 输入exit以退出", new G.StyleSpan(G.Typeface.BOLD));
				self.ready(null);
			}
			self.print = function(str, span) {G.ui(function() {try {
				var t = self.lines[self.lines.length - 1];
				if (span) {
					appendSSB(t, str, span);
				} else {
					t.append(str);
				}
				self.adapter.notifyChange();
				self.prompt.smoothScrollToPosition(self.lines.length - 1);
			} catch(e) {erp(e)}})};
			self.ready = function(cmd) {
				cmd = String(cmd);
				self.history[self.lines.length - 1] = cmd;
				self.lines.push(new G.SpannableStringBuilder());
				if (self.lines.length > self.LINE_LIMIT) {
					self.lines.splice(0, self.lines.length - self.LINE_LIMIT - 1);
					self.history.splice(0, self.history.length - self.LINE_LIMIT - 1);
				}
				self.hiscur = -1;
				self.adapter.notifyChange();
				self.print(">  ", new G.ForegroundColorSpan(Common.theme.highlightcolor));
			}
			self.debugStatusListener = function(status, arg1, arg2) {
				switch(status) {
					case "connecting":
					self.print("\n[Interactive Debug] Connecting...");
					break;
					case "connected":
					self.print("\n[Interactive Debug] Connected!");
					break;
					case "disconnected":
					self.print("\n[Interactive Debug] Disconnected!");
					break;
					case "remoteExec":
					self.print("\n[Interactive Debug] Remote:" + arg1);
					break;
					case "log":
					self.print("\n[Interactive Debug] [" + arg1 + "]" + arg2);
					break;
					case "error":
					self.print("\n[Interactive Debug] Error: " + arg1, new G.ForegroundColorSpan(Common.theme.criticalcolor));
					break;
				}
			}
			self.exec = function(_s) {
				var _t, _ls = _s.toLowerCase();
				if (_ls == "exit") {
					self.popup.exit();
					return;
				} else if (_ls == "cls") {
					self.cls();
					return;
				} else if (_ls == "ls") {
					JSONEdit.traceGlobal();
				} else if (_ls.startsWith("ls ")) {
					JSONEdit.trace(eval.call(null, _s.slice(3)));
				} else if (_ls.startsWith("cp ")) {
					try {
						var _t = MapScript.toSource(eval.call(null, _s.slice(3)));
						self.print(_t);
						Common.setClipboardText(_t);
					} catch(_e) {
						self.print(_e + "\n" + _e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
						Common.setClipboardText(_e + "\n" + _e.stack);
					}
				} else if (_ls.startsWith("sn ")) {
					try {
						_t = MapScript.toSource(eval.call(null, _s.slice(3)));
						self.print(_t);
					} catch(_e) {
						self.print(_t = _e + "\n" + _e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
					}
					var _file = new java.io.File(ctx.getExternalCacheDir(), "sn.txt");
					var _fs = new java.io.PrintWriter(new java.io.FileOutputStream(_file));
					_fs.println(_t);
					_fs.close();
					try {
						ctx.startActivity(new android.content.Intent(android.content.Intent.ACTION_SEND)
							.setType("text/plain")
							.putExtra(android.content.Intent.EXTRA_STREAM, AndroidBridge.fileToUri(_file))
							.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION | android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION | android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
					} catch(e) {
						Common.toast("文件已生成于" + _file.getAbsolutePath());
					}
				} else if (_ls.startsWith("exec ")) {
					try {
						_t = eval(Common.readFile(_s.slice(5), ""));
						self.print(Log.debug("D", _t, 0).join("\n"));
					} catch(_e) {
						self.print(_e + "\n" + _e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
					}
				} else if (_ls.startsWith("id ")) {
					try {
						DebugUtils.startInteractiveDebug(_s.slice(3), self.debugStatusListener);
					} catch(_e) {
						self.print(_e + "\n" + _e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
					}
				} else if (_ls.startsWith("#")) {
					new java.lang.Thread(function() {
						try {
							var _t = eval(_s.slice(1));
							self.print(Log.debug("D", _t, 0).join("\n"));
						} catch(_e) {
							self.print(_e + "\n" + _e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
						}
						G.ui(function() {try {
							self.ready(_s);
						} catch(e) {erp(e)}});
					}).start();
					return;
				} else {
					try {
						_t = eval(_s);
						self.print(Log.debug("D", _t, 0).join("\n"));
					} catch(_e) {
						self.print(_e + "\n" + _e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
					}
				}
				self.ready(_s);
			}
			function print(str) {
				self.print(Common.toString(str));
			}
			function println(str) {
				self.print(Common.toString(str));
				self.print("\n");
			}
			self.adapter = SimpleListAdapter.getController(new SimpleListAdapter(self.lines, self.vmaker, self.vbinder));

			self.main = new G.LinearLayout(ctx);
			self.main.setOrientation(G.LinearLayout.VERTICAL);

			self.bar = new G.LinearLayout(ctx);
			self.bar.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			self.bar.setOrientation(G.LinearLayout.HORIZONTAL);
			Common.applyStyle(self.bar, "bar_float");

			self.cmd = new G.EditText(ctx);
			self.cmd.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2, 1.0));
			self.cmd.setFocusableInTouchMode(true);
			self.cmd.setPadding(5 * G.dp, 10 * G.dp, 0, 10 * G.dp);
			self.cmd.setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
			Common.applyStyle(self.cmd, "edittext_default", 3);
			self.bar.addView(self.cmd);
			Common.postIME(self.cmd);

			self.eval = new G.TextView(ctx);
			self.eval.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.eval.setGravity(G.Gravity.CENTER);
			self.eval.setText(">");
			self.eval.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			Common.applyStyle(self.eval, "button_reactive", 3);
			self.eval.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				switch (e.getAction()) {
					case e.ACTION_DOWN:
					Common.applyStyle(v, "button_reactive_pressed", 3);
					break;
					case e.ACTION_CANCEL:
					case e.ACTION_UP:
					Common.applyStyle(v, "button_reactive", 3);
				}
				return false;
			} catch(e) {return erp(e), true}}}));
			self.eval.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (!self.cmd.getText().length()) return;
				var s = String(self.cmd.getText());
				self.print(s);
				self.print("\n");
				self.exec(s);
				self.cmd.setText("");
			} catch(e) {erp(e)}}}));
			self.bar.addView(self.eval);

			self.prompt = new G.ListView(ctx);
			self.prompt.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1.0));
			self.prompt.setDividerHeight(0);
			Common.applyStyle(self.prompt, "message_bg");
			self.prompt.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				if (self.history[pos]) {
					self.history[self.lines.length - 1] = String(self.cmd.getText());
					self.cmd.setText(self.history[pos]);
					self.cmd.setSelection(self.cmd.length());
				}
			} catch(e) {erp(e)}}}));
			self.prompt.setOnItemLongClickListener(new G.AdapterView.OnItemLongClickListener({onItemLongClick : function(parent, view, pos, id) {try {
				Common.setClipboardText(self.lines[pos]);
				Common.toast("内容已复制");
				return true;
			} catch(e) {return erp(e), true}}}));
			self.prompt.setAdapter(self.adapter.self);
			self.main.addView(self.prompt);
			self.main.addView(self.bar);

			self.popup = new PopupPage(self.main, "common.Console");

			self.cls();
			PWM.registerResetFlag(self, "main");
		}
		self.popup.enter();
	} catch(e) {erp(e)}})},

	traceStack : function() {
		var s = [], i;
		var ts = java.lang.Thread.getAllStackTraces();
		var it = ts.keySet().iterator();
		var ct, cts, ctid = java.lang.Thread.currentThread().getId();
		while (it.hasNext()) {
			ct = it.next();
			s.push((ctid == ct.getId() ? "<当前>" : "") + "线程" + ct.getId() + ":" + ct.getName() + " (优先级" + ct.getPriority() + (ct.isDaemon() ? "守护线程" : "") + ") - " + ct.getState().toString());
			cts = ts.get(ct);
			for (i in cts) {
				s.push(" at " + cts[i].toString());
			}
			s.push("");
		}
		return s.join("\n");
	},
	
	startInteractiveDebug : function(uri, statusListener) {
		if (MapScript.host != "Android") {
			Log.throwError(new Error("Your device not support Interactive Debug!"));
		}
		if (this.wsclient) Log.throwError(new Error("Channel busy"));
		statusListener("connecting");
		this.wsclient = ScriptInterface.createWSClient(uri, {
			onOpen : function(thisObj, handshake) {try {
				thisObj.send(JSON.stringify({
					type : "version",
					version : CA.version,
					publishDate : CA.publishDate
				}));
				Log.start(function(level, text) {
					statusListener("log", level, text);
					thisObj.send(JSON.stringify({
						type : "println",
						level : level,
						text : text
					}));
				});
				statusListener("connected");
			} catch(e) {erp(e)}},
			onClose : function(thisObj, code, reason, remote) {try {
				Log.stop();
				statusListener("disconnected");
				DebugUtils.wsclient = null;
			} catch(e) {erp(e)}},
			onMessage : function(thisObj, message) {try {
				try {
					var o = JSON.parse(message);
					switch (o.type) {
						case "exec":
						statusListener("remoteExec", o.cmd);
						if (o.cmd.startsWith("#")) {
							G.ui(function() {
								try {
									Log.s(eval.call(null, o.cmd.slice(1)));
								} catch(e) {
									Log.e(e);
								}
							});
						} else {
							try {
								Log.s(eval.call(null, o.cmd));
							} catch(e) {
								Log.e(e);
							}
						};
						break;
						case "ping":
						thisObj.send(JSON.stringify({type : "pong"}));
						break;
					}
				} catch(e) {
					Log.e(e);
				}
			} catch(e) {erp(e)}},
			onError : function(thisObj, err) {
				erp(err, true);
				statusListener("error", err);
			}
		});
		this.wsclient.connect();
	},
	stopInteractiveDebug : function() {
		if (this.wsclient && this.wsclient.getReadyState() == org.java_websocket.WebSocket.READYSTATE.OPEN) this.wsclient.close();
	}
});