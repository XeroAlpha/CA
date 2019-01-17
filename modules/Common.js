MapScript.loadModule("Common", {
	themelist : {
		"light" : {
			"name" : "默认风格"
		}
	},
	theme : null,
	
	onCreate : function() {
		L.on("afterAttach", function(name, view, holder) {
			var style = holder.get("style");
			if (style) {
				Common.applyStyle(view, style, holder.get("fontSize"));
			}
		});
	},

	/* BUG 修复
	 * Android 8.0 颜色转换出错
	 * 原因：Oreo版本新增了多个方法：
	    Color.argb(float, float, float, float)
	   与它的同名方法在JS层面上参数表相同。
	    Color.argb(int, int, int, int)
	   还有Color.red, Color.green等方法也出现此状况。
	   解决方案：自定义argb、rgb等方法。
	 */
	argbInt : function(alpha, red, green, blue) {
		return (new java.lang.Long((alpha << 24) | (red << 16) | (green << 8) | blue)).intValue();
	},
	rgbInt : function(red, green, blue) {
		return (new java.lang.Long((0xff << 24) | (red << 16) | (green << 8) | blue)).intValue();
	},
	setAlpha : function(color, alpha) {
		return (new java.lang.Long((alpha << 24) | (color & 0xffffff))).intValue();
	},

	loadTheme : function(id) {
		var light = {
			"bgcolor" : "#FAFAFA",
			"float_bgcolor" : "#F5F5F5",
			"message_bgcolor" : "#FAFAFA",
			"textcolor" : "#212121",
			"promptcolor" : "#9E9E9E",
			"highlightcolor" : "#0000FF",
			"criticalcolor" : "#FF0000",
			"go_bgcolor" : "#EEEEEE",
			"go_textcolor" : "#000000",
			"go_touchbgcolor" : "#616161",
			"go_touchtextcolor" : "#FAFAFA"
		};
		var convert = function(v, d) {
			var n = Number("0x" + String(v).slice(1));
			if (isNaN(n)) n = Number("0x" + d.slice(1));
			return Common.argbInt(0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
		}
		var r = {id : (id in this.themelist ? String(id) : "light")}, k, i, t;
		k = r.id in this.themelist ? this.themelist[r.id] : light;
		for (i in light) {
			r[i] = convert(k[i], light[i]);
		}
		r.name = k === light ? "默认主题" : String(k.name);
		i = Math.floor(CA.settings.alpha * 255);
		if (i >= 0 && i < 255) {
			r.bgcolor = this.setAlpha(r.bgcolor, i);
			r.float_bgcolor = this.setAlpha(r.float_bgcolor, i);
			r.message_bgcolor = this.setAlpha(r.message_bgcolor, 0xe0);
		} else {
			CA.settings.alpha = 1;
		}
		i = parseFloat(CA.settings.textSize);
		if (!(i > 0)) {
			CA.settings.textSize = i = 1;
		}
		r.textsize = [Math.ceil(10 * i), Math.ceil(12 * i), Math.ceil(14 * i), Math.ceil(16 * i), Math.ceil(18 * i)];
		t = ctx.getResources().getDisplayMetrics();
		G.dp = t.density * i;
		G.sp = t.scaledDensity * i;
		this.theme = r;
	},
	applyStyle : function(v, style, size) {
		switch (style) {
			case "bar_float":
			v.setBackgroundColor(this.theme.float_bgcolor);
			if (G.style == "Material") v.setElevation(8 * G.dp);
			break;
			case "bar_float_second":
			v.setBackgroundColor(this.theme.float_bgcolor);
			if (G.style == "Material") v.setElevation(4 * G.dp);
			break;
			case "container_default":
			v.setBackgroundColor(Common.theme.bgcolor);
			break;
			case "message_bg":
			v.setBackgroundColor(Common.theme.message_bgcolor);
			break;
			case "textview_default":
			case "button_default":
			case "item_default":
			v.setTextSize(Common.theme.textsize[size]);
			v.setTextColor(Common.theme.textcolor);
			break;
			case "textview_prompt":
			case "button_secondary":
			case "item_disabled":
			v.setTextSize(Common.theme.textsize[size]);
			v.setTextColor(Common.theme.promptcolor);
			break;
			case "textview_critial":
			case "button_critical":
			case "item_critical":
			v.setTextSize(Common.theme.textsize[size]);
			v.setTextColor(Common.theme.criticalcolor);
			break;
			case "textview_highlight":
			case "button_highlight":
			case "item_highlight":
			v.setTextSize(Common.theme.textsize[size]);
			v.setTextColor(Common.theme.highlightcolor);
			break;
			case "button_reactive":
			v.setBackgroundColor(Common.theme.go_bgcolor);
			v.setTextSize(Common.theme.textsize[size]);
			v.setTextColor(Common.theme.go_textcolor);
			break;
			case "button_reactive_pressed":
			v.setBackgroundColor(Common.theme.go_touchbgcolor);
			v.setTextSize(Common.theme.textsize[size]);
			v.setTextColor(Common.theme.go_touchtextcolor);
			break;
			case "button_reactive_auto":
			Common.applyStyle(v, "button_reactive", size);
			v.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				switch (e.getAction()) {
					case e.ACTION_DOWN:
					Common.applyStyle(v, "button_reactive_pressed", size);
					break;
					case e.ACTION_CANCEL:
					case e.ACTION_UP:
					Common.applyStyle(v, "button_reactive", size);
				}
				return false;
			} catch(e) {return erp(e), true}}}));
			break;
			case "edittext_default":
			v.setBackgroundColor(G.Color.TRANSPARENT);
			v.setTextSize(Common.theme.textsize[size]);
			v.setTextColor(Common.theme.textcolor);
			v.setHintTextColor(Common.theme.promptcolor);
			break;
		}
	},
	applyPopup : function(popup) {
		if (G.supportFloat) {
			if (android.os.Build.VERSION.SDK_INT >= 26) {
				popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY);
			} else {
				popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
			}
		}
	},

	showChangeTheme : function self(update, dismiss) {G.ui(function() {try {
		if (!self.linear) {
			self.adapter = function(e, i, a) {
				var view = new G.TextView(ctx);
				Common.loadTheme(e);
				view.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
				view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				view.setBackgroundColor(Common.theme.bgcolor);
				view.setText(Common.theme.name + (self.current == e ? " (当前)" : ""));
				view.setTextSize(Common.theme.textsize[3]);
				view.setTextColor(Common.theme.textcolor);
				Common.loadTheme(self.current);
				view.setGravity(G.Gravity.CENTER);
				return view;
			}
			self.refresh = function() {
				self.current = Common.theme.id;
				self.list.setAdapter(new RhinoListAdapter(Object.keys(Common.themelist), self.adapter));
				self.linear.setBackgroundColor(Common.theme.message_bgcolor);
				self.linear.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
				self.title.setPadding(0, 0, 0, 10 * G.dp);
				self.title.setTextSize(Common.theme.textsize[4]);
				self.title.setTextColor(Common.theme.textcolor);
				self.alpha.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
				self.alpha.setText("不透明度：" + (isFinite(CA.settings.alpha) ? parseInt(CA.settings.alpha * 100) : 100) + "%");
				self.alpha.setTextSize(Common.theme.textsize[2]);
				self.alpha.setTextColor(Common.theme.highlightcolor);
				self.tsz.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
				self.tsz.setText("字体大小：" + (isFinite(CA.settings.textSize) ? parseInt(CA.settings.textSize * 100) : 100) + "%");
				self.tsz.setTextSize(Common.theme.textsize[2]);
				self.tsz.setTextColor(Common.theme.highlightcolor);
				self.exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
				self.exit.setTextSize(Common.theme.textsize[3]);
				self.exit.setTextColor(Common.theme.criticalcolor);
			}
			self.alphaSetting = function() {
				Common.showSlider({
					max : 100,
					progress : Math.floor(CA.settings.alpha * 100),
					prompt : function(progress) {
						return "不透明度：" + progress + "%";
					},
					callback : function(progress) {
						CA.settings.alpha = progress / 100;
						Common.loadTheme(self.current);
						self.refresh();
					},
				});
			}
			self.tszSetting = function() {
				var l = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
				Common.showListChooser(l.map(function(e) {
					return String(e * 100) + "%";
				}), function(p) {
					CA.settings.textSize = l[p];
					Common.loadTheme(self.current);
					self.refresh();
				});
			}
			self.linear = new G.LinearLayout(ctx);
			self.linear.setOrientation(G.LinearLayout.VERTICAL);

			self.title = new G.TextView(ctx);
			self.title.setText("主题选择");
			self.title.setGravity(G.Gravity.CENTER);
			self.linear.addView(self.title, new G.LinearLayout.LayoutParams(-1, -2));

			self.list = new G.ListView(ctx);
			self.list.setDividerHeight(0);
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				Common.loadTheme(parent.getAdapter().getItem(pos));
				self.refresh();
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.list, new G.LinearLayout.LayoutParams(-1, 0, 1.0));

			self.exbar = new G.LinearLayout(ctx);
			self.exbar.setOrientation(G.LinearLayout.HORIZONTAL);

			self.alpha = new G.TextView(ctx);
			self.alpha.setGravity(G.Gravity.CENTER);
			self.alpha.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.alphaSetting();
			} catch(e) {erp(e)}}}));
			self.exbar.addView(self.alpha, new G.LinearLayout.LayoutParams(-2, -2, 1));

			self.tsz = new G.TextView(ctx);
			self.tsz.setGravity(G.Gravity.CENTER);
			self.tsz.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.tszSetting();
			} catch(e) {erp(e)}}}));
			self.exbar.addView(self.tsz, new G.LinearLayout.LayoutParams(-2, -2, 1));
			self.linear.addView(self.exbar, new G.LinearLayout.LayoutParams(-1, -2));

			self.exit = new G.TextView(ctx);
			self.exit.setText("确定");
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (Common.theme.id != self.last || CA.settings.alpha != self.lastalpha || CA.settings.textSize != self.lasttsz) {
					self.modified = true;
					if (self.update) self.update();
					//此处无需dismiss。因为update会自动resetGUI()
				} else {
					self.popup.exit();
				}
				return true;
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.exit, new G.LinearLayout.LayoutParams(-1, -2));

			self.popup = new PopupPage(self.linear, "common.ChangeTheme");

			PWM.registerResetFlag(self, "linear");
		}
		self.update = update;
		self.modified = false;
		self.popup.on("exit", function() {
			if (!self.modified) Common.loadTheme(self.last);
			if (dismiss) dismiss();
		});
		self.last = Common.theme.id;
		self.lastalpha = CA.settings.alpha;
		self.lasttsz = CA.settings.textSize;
		self.refresh();
		self.popup.enter();
	} catch(e) {erp(e)}})},

	customVMaker : function(holder) {
		var view = new G.TextView(ctx);
		view.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
		view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
		Common.applyStyle(view, "textview_default", 3);
		return view;
	},

	initEnterAnimation : function(v) {
		var trans;
		if (!CA.settings.noAnimation) {
			trans = new G.AlphaAnimation(0, 1);
			trans.setDuration(150);
			v.startAnimation(trans);
		}
	},
	
	//Deprecated
	showDialog : function(layout, width, height, onExit, modal) {
		var p = PopupPage.showDialog("common.Dialog", layout, width, height, modal);
		if (onExit) p.on("exit", onExit);
		return p;
	},

	showTextDialog : function(s, onDismiss) {G.ui(function() {try {
		var layout, scr, text, exit, popup;
		layout = new G.LinearLayout(ctx);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 0);
		Common.applyStyle(layout, "message_bg");
		scr = new G.ScrollView(ctx);
		scr.setLayoutParams(new G.LinearLayout.LayoutParams(-2, 0, 1));
		text = new G.TextView(ctx);
		text.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2));
		text.setText(s);
		text.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 0);
		text.setMovementMethod(G.LinkMovementMethod.getInstance());
		Common.applyStyle(text, "textview_default", 2);
		scr.addView(text);
		layout.addView(scr);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("关闭");
		exit.setGravity(G.Gravity.CENTER);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		Common.applyStyle(exit, "button_critical", 3);
		exit.measure(0, 0);
		text.setMinWidth(exit.getMeasuredWidth());
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			popup.exit();
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		popup = PopupPage.showDialog("common.TextDialog", layout, -2, -2);
		if (onDismiss) popup.on("exit", onDismiss);
	} catch(e) {erp(e)}})},

	showOperateDialog : function self(s, tag, onDismiss) {G.ui(function() {try {
		var frame, list, popup;
		if (!self.adapter) {
			self.adapter = function(e) {
				if (isFinite(e.gap)) {
					e.view = new G.View(ctx);
					e.view.setLayoutParams(new G.AbsListView.LayoutParams(-1, e.gap));
					e.view.setFocusable(true);
					return e.view;
				} else {
					e.view = new G.LinearLayout(ctx);
					e.view.setOrientation(G.LinearLayout.VERTICAL);
					e.view.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
					e.view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					e._title = new G.TextView(ctx);
					e._title.setText(Common.toString(e.text));
					e._title.setGravity(G.Gravity.CENTER | G.Gravity.LEFT);
					e._title.setFocusable(false);
					e._title.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
					Common.applyStyle(e._title, "textview_default", 2);
					e.view.addView(e._title);
					if (e.description) {
						e._description = new G.TextView(ctx);
						e._description.setText(Common.toString(e.description));
						e._description.setPadding(0, 3 * G.dp, 0, 0);
						e._description.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
						Common.applyStyle(e._description, "textview_prompt", 1);
						e.view.addView(e._description);
					}
					return e.view;
				}
			}
		}
		s = s.filter(function(e) {
			if (e.hidden && e.hidden(tag)) return false;
			return true;
		});
		frame = new G.FrameLayout(ctx);
		frame.setPadding(5 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
		Common.applyStyle(frame, "message_bg");
		list = new G.ListView(ctx);
		list.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -2));
		list.setDividerHeight(0);
		list.setAdapter(new RhinoListAdapter(s, self.adapter));
		list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
			var e = s[pos];
			if (e.onclick) if (!e.onclick(e.button, tag)) popup.exit();
			return true;
		} catch(e) {erp(e)}}}));
		frame.addView(list);
		popup = PopupPage.showDialog("common.OperateDialog", frame, -1, -2);
		if (onDismiss) popup.on("exit", onDismiss);
	} catch(e) {erp(e)}})},

	showInputDialog : function(s) {G.ui(function() {try {
		var scr, layout, title, text, ret, exit, popup;
		scr = new G.ScrollView(ctx);
		Common.applyStyle(scr, "message_bg");
		layout = new G.LinearLayout(ctx);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
		if (s.title) {
			title = new G.TextView(ctx);
			title.setText(Common.toString(s.title));
			title.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			title.setPadding(0, 0, 0, 10 * G.dp);
			Common.applyStyle(title, "textview_default", 4);
			layout.addView(title);
		}
		if (s.description) {
			text = new G.TextView(ctx);
			text.setText(Common.toString(s.description));
			text.setPadding(0, 0, 0, 10 * G.dp);
			text.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			Common.applyStyle(text, "textview_prompt", 2);
			layout.addView(text);
		}
		ret = new G.EditText(ctx);
		if (s.defaultValue) ret.setText(Common.toString(s.defaultValue));
		ret.setSingleLine(Boolean(s.singleLine));
		if (s.inputType) ret.setInputType(s.inputType);
		if (s.keyListener) ret.setKeyListener(s.keyListener);
		if (s.transformationMethod) ret.setTransformationMethod(s.transformationMethod);
		ret.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
		ret.setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
		ret.setSelection(ret.length());
		Common.applyStyle(ret, "edittext_default", 2);
		layout.addView(ret);
		Common.postIME(ret);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("确定");
		exit.setGravity(G.Gravity.CENTER);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		Common.applyStyle(exit, "button_critical", 3);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			if (s.callback && s.callback(s.text = String(ret.getText()))) return true;
			popup.exit();
			return true;
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		layout.addOnLayoutChangeListener(new G.View.OnLayoutChangeListener({onLayoutChange : function(v, l, t, r, b, ol, ot, or, ob) {try {
			ret.setMinWidth(0.5 * popup.getWidth());
		} catch(e) {erp(e)}}}));
		scr.addView(layout);
		s.text = null;
		s.dialog = popup = PopupPage.showDialog("common.InputDialog", scr, -2, -2);
		if (s.onDismiss) popup.on("exit", s.onDismiss);
	} catch(e) {erp(e)}})},

	showConfirmDialog : function(s) {G.ui(function() {try {
		var scr, layout, title, text, skip, onClick, popup;
		scr = new G.ScrollView(ctx);
		Common.applyStyle(scr, "message_bg");
		layout = new G.LinearLayout(ctx);
		layout.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2));
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 5 * G.dp);
		if (s.title) {
			title = new G.TextView(ctx);
			title.setText(Common.toString(s.title));
			title.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
			title.setPadding(0, 0, 0, 10 * G.dp);
			Common.applyStyle(title, "textview_default", 4);
			layout.addView(title);
		}
		if (s.description) {
			text = new G.TextView(ctx);
			text.setText(Common.toString(s.description));
			text.setPadding(0, 0, 0, 10 * G.dp);
			text.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
			Common.applyStyle(text, "textview_prompt", 2);
			layout.addView(text);
		}
		if (s.skip) {
			skip = new G.CheckBox(ctx);
			skip.setChecked(Boolean(s.canSkip));
			skip.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2, 0));
			skip.getLayoutParams().setMargins(0, 0, 0, 10 * G.dp)
			skip.setText("不再提示");
			layout.addView(skip);
		}
		onClick = function(i) {
			if (s.skip) s.skip(skip.isChecked());
			if (s.callback && s.callback(i)) return;
			popup.exit();
		}
		but = (s.buttons || ["确定", "取消"]).map(function(e, i) {
			var b = new G.TextView(ctx);
			b.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			b.setText(String(e));
			b.setGravity(G.Gravity.CENTER);
			b.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			Common.applyStyle(b, "button_critical", 3);
			b.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				onClick(i);
			} catch(e) {erp(e)}}}));
			layout.addView(b);
			return b;
		});
		scr.addView(layout);
		popup = PopupPage.showDialog("common.ConfirmDialog", scr, -2, -2);
		if (s.onDismiss) popup.on("exit", s.onDismiss);
	} catch(e) {erp(e)}})},

	showListChooser : function self(l, callback, optional, onDismiss) {G.ui(function() {try {
		var frame, list, popup;
		if (!self.vmaker) {
			self.vmaker = function(holder) {
				var view = new G.LinearLayout(ctx);
				view.setOrientation(G.LinearLayout.VERTICAL);
				view.setPadding(15 * G.dp, 10 * G.dp, 15 * G.dp, 10 * G.dp);
				view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				var title = holder.title = new G.TextView(ctx);
				title.setGravity(G.Gravity.CENTER | G.Gravity.LEFT);
				title.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
				Common.applyStyle(title, "textview_default", 2);
				view.addView(title);
				var desp = holder.desp = new G.TextView(ctx);
				desp.setPadding(0, 3 * G.dp, 0, 0);
				desp.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
				Common.applyStyle(desp, "textview_prompt", 1);
				view.addView(desp);
				return view;
			}
			self.vbinder = function(holder, e) {
				if (e instanceof Object) {
					holder.title.setText(Common.toString(e.text));
					if (e.description) {
						holder.desp.setText(Common.toString(e.description));
						holder.desp.setVisibility(G.View.VISIBLE);
					} else {
						holder.desp.setVisibility(G.View.GONE);
					}
				} else {
					holder.title.setText(Common.toString(e));
					holder.desp.setVisibility(G.View.GONE);
				}
			}
		}
		if (l.length == 0) {
			Common.toast("没有可选的选项");
			return;
		}
		if (optional && l.length == 1 && !callback(0, l)) return;
		frame = new G.FrameLayout(ctx);
		Common.applyStyle(frame, "message_bg");
		list = new G.ListView(ctx);
		list.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -2));
		list.setAdapter(new SimpleListAdapter(l, self.vmaker, self.vbinder));
		list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
			if (!callback(pos, l)) popup.exit();
			return true;
		} catch(e) {erp(e)}}}));
		frame.addView(list);
		popup = PopupPage.showDialog("common.ListChooser", frame, -1, -2);
		if (onDismiss) popup.on("exit", onDismiss);
	} catch(e) {erp(e)}})},

	showProgressDialog : function self(f, onCancel) {
		if (!self.loadAnimation) {
			self.loadAnimation = function(prg) {
				prg.setImageDrawable(new G.ColorDrawable(Common.theme.highlightcolor));
				var aset = new G.AnimationSet(false);
				var tani = new G.TranslateAnimation(-180 * G.dp, 180 * G.dp, 0, 0);
				var sani = new G.ScaleAnimation(0.5, 0.3, 1, 1, 120 * G.dp, 0);
				tani.setDuration(1500);
				tani.setRepeatMode(G.Animation.RESTART);
				tani.setRepeatCount(-1);
				sani.setDuration(1000);
				sani.setRepeatMode(G.Animation.REVERSE);
				sani.setRepeatCount(-1);
				aset.addAnimation(sani);
				aset.addAnimation(tani);
				prg.startAnimation(aset);
			}
			self.init = function(o) {G.ui(function() {try {
				var layout, text, prg, popup;
				layout = new G.LinearLayout(ctx);
				layout.setOrientation(G.LinearLayout.VERTICAL);
				Common.applyStyle(layout, "message_bg");
				text = o.text = new G.TextView(ctx);
				text.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2));
				text.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
				Common.applyStyle(text, "textview_default", 2);
				layout.addView(text);
				prg = new G.ImageView(ctx);
				prg.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 4 * G.dp));
				self.loadAnimation(prg);
				layout.addView(prg);
				o.popup = PopupPage.showDialog("common.ProgressDialog", layout, 240 * G.dp, -2, !o.onCancel);
				o.popup.on("exit", function() {
					if (!o.closed) {
						o.cancelled = true;
						if (typeof o.onCancel == "function") o.onCancel();
					}
					o.closed = true;
				});
			} catch(e) {erp(e)}})},
			self.controller = {
				setText : function(s) {
					var o = this;
					G.ui(function() {try {
						o.text.setText(Common.toString(s));
					} catch(e) {erp(e)}});
				},
				close : function() {
					var o = this;
					G.ui(function() {try {
						if (o.closed) return;
						o.closed = true;
						o.popup.exit();
					} catch(e) {erp(e)}});
				},
				async : function(f) {
					var o = this;
					var th = new java.lang.Thread(function() {
						try {
							f(o);
						} catch(e) {erp(e)}
						o.close();
					});
					th.start();
				}
			};
		}
		var o = Object.create(self.controller);
		o.onCancel = onCancel;
		self.init(o);
		if (f) o.async(f);
		return o;
	},

	showSlider : function self(o) {G.ui(function() {try {
		var scr, layout, seekbar, text, exit, popup;
		scr = new G.ScrollView(ctx);
		Common.applyStyle(scr, "message_bg");
		layout = new G.LinearLayout(ctx);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 0);
		seekbar = new G.SeekBar(ctx);
		seekbar.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		seekbar.setMax(o.max);
		seekbar.setProgress(o.progress);
		seekbar.setOnSeekBarChangeListener(new G.SeekBar.OnSeekBarChangeListener({
			onProgressChanged : function(v, progress, fromUser) {try {
				text.setText(o.prompt(progress));
			} catch(e) {erp(e)}}
		}));
		layout.addView(seekbar);
		text = new G.TextView(ctx);
		text.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
		text.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 0);
		Common.applyStyle(text, "textview_default", 2);
		layout.addView(text);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("关闭");
		exit.setGravity(G.Gravity.CENTER);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		Common.applyStyle(exit, "button_critical", 3);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			o.callback(seekbar.getProgress());
			popup.exit();
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		text.setText(o.prompt(o.progress));
		scr.addView(layout);
		popup = PopupPage.showDialog("common.SliderDialog", scr, -1, -2);
		if (o.onDismiss) popup.on("exit", o.onDismiss);
	} catch(e) {erp(e)}})},

	showSettings : function self(data, onSave) {G.ui(function() {try {
		if (!self.linear) {
			self.refreshText = function() {
				if (!self.popup.showing) return;
				self.data.forEach(function(e, i) {
					if (!e._view) return;
					if (e.type == "text") {
						e._text.setText(String(e.get ? e.get() : e.text));
					} else if (e.type == "custom") {
						e._text.setText(e.get ? String(e.get()) : "");
					} else if (e.type == "boolean") {
						e._box.setChecked(e.get());
					} else if (e.type == "seekbar") {
						e._seekbar.setProgress(e.get());
					}
				});
			}
			self.adapter = function(e, i, a, extra) {
				var hl, vl;
				switch (e.type) {
					case "boolean":
					case "custom":
					hl = new G.LinearLayout(ctx);
					hl.setOrientation(G.LinearLayout.HORIZONTAL);
					hl.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					hl.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
					vl = new G.LinearLayout(ctx);
					vl.setOrientation(G.LinearLayout.VERTICAL);
					vl.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2, 1.0));
					vl.getLayoutParams().gravity = G.Gravity.CENTER;
					e._name = new G.TextView(ctx);
					e._name.setText(String(e.name));
					e._name.setSingleLine(true);
					e._name.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
					Common.applyStyle(e._name, "textview_default", 3);
					vl.addView(e._name);
					if (e.description) {
						e._description = new G.TextView(ctx);
						e._description.setText(String(e.description));
						e._description.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
						Common.applyStyle(e._description, "textview_prompt", 1);
						vl.addView(e._description);
					}
					hl.addView(vl);
					if (e.type == "custom") {
						e._text = new G.TextView(ctx);
						e._text.setText(e.get ? String(e.get()) : "");
						e._text.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
						e._text.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
						e._text.getLayoutParams().gravity = G.Gravity.CENTER;
						Common.applyStyle(e._text, "textview_prompt", 2);
						hl.addView(e._text);
					} else {
						e._box = new G.CheckBox(ctx);
						e._box.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2, 0));
						e._box.getLayoutParams().gravity = G.Gravity.CENTER;
						e._box.setChecked(e.get());
						e._box.setOnCheckedChangeListener(new G.CompoundButton.OnCheckedChangeListener({onCheckedChanged : function(v, s) {try {
							e.set(s);
							if (e.onclick) e.onclick(function() {
								self.refreshText();
							});
							e._box.setChecked(e.get());
						} catch(e) {erp(e)}}}));
						e._box.setFocusable(false);
						hl.addView(e._box);
					}
					return e._view = hl;
					case "space":
					e._sp = new G.Space(ctx);
					e._sp.setLayoutParams(new G.AbsListView.LayoutParams(-1, e.height));
					e._sp.setFocusable(true);
					return e._view = e._sp;
					case "tag":
					e._tag = new G.TextView(ctx);
					e._tag.setText(String(e.name));
					e._tag.setPadding(20 * G.dp, 25 * G.dp, 0, 0);
					e._tag.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					e._tag.setFocusable(true);
					Common.applyStyle(e._tag, "textview_highlight", 2);
					return e._view = e._tag;
					case "text":
					e._text = new G.TextView(ctx);
					e._text.setText(String(e.get ? e.get() : e.text));
					e._text.setPadding(20 * G.dp, 0, 20 * G.dp, 10 * G.dp);
					e._text.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					e._text.setFocusable(true);
					Common.applyStyle(e._text, "textview_prompt", 2);
					return e._view = e._text;
					case "seekbar":
					vl = new G.LinearLayout(ctx);
					vl.setOrientation(G.LinearLayout.VERTICAL);
					vl.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					vl.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
					hl = new G.LinearLayout(ctx);
					hl.setOrientation(G.LinearLayout.HORIZONTAL);
					hl.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
					hl.setPadding(0, 0, 0, 10 * G.dp);
					hl.getLayoutParams().gravity = G.Gravity.CENTER;
					e._name = new G.TextView(ctx);
					e._name.setText(String(e.name));
					e._name.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
					Common.applyStyle(e._name, "textview_default", 3);
					hl.addView(e._name);
					e._progress = new G.TextView(ctx);
					e._progress.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -1));
					e._progress.setGravity(G.Gravity.CENTER | G.Gravity.RIGHT);
					e._progress.setPadding(0, 0, 10 * G.dp, 0);
					Common.applyStyle(e._progress, "textview_prompt", 2);
					hl.addView(e._progress);
					vl.addView(hl);
					e._seekbar = new G.SeekBar(ctx);
					e._seekbar.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
					e._seekbar.setOnSeekBarChangeListener(new G.SeekBar.OnSeekBarChangeListener({
						onProgressChanged : function(v, progress, fromUser) {try {
							e._progress.setText(e.current ? e.current(progress) : progress);
							return true;
						} catch(e) {erp(e)}},
						onStopTrackingTouch : function(v) {try {
							e.set(v.getProgress());
							return true;
						} catch(e) {erp(e)}}
					}));
					e._seekbar.setMax(e.max);
					e._seekbar.setProgress(e.get());
					vl.addView(e._seekbar);
					return e._view = vl;
				}
			}
			self.linear = new G.LinearLayout(ctx);
			self.linear.setOrientation(G.LinearLayout.VERTICAL);
			Common.applyStyle(self.linear, "message_bg");

			self.title = new G.TextView(ctx);
			self.title.setText("设置");
			self.title.setPadding(15 * G.dp, 10 * G.dp, 15 * G.dp, 10 * G.dp);
			Common.applyStyle(self.title, "bar_float");
			Common.applyStyle(self.title, "textview_default", 4);
			self.title.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));

			self.list = new G.ListView(ctx);
			self.list.setDividerHeight(0);
			self.list.addHeaderView(self.title);
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				var e = parent.getAdapter().getItem(pos);
				if (!e) return true;
				if (e.type == "custom") {
					if (e.onclick) e.onclick(function(v) {
						self.refreshText();
						e._text.setText(String(v == null ? e.get() : v));
					});
				} else if (e.type == "boolean") {
					e._box.performClick();
				}
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.list, new G.LinearLayout.LayoutParams(-1, 0, 1.0));

			self.exit = new G.TextView(ctx);
			self.exit.setText("确定");
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
			Common.applyStyle(self.exit, "bar_float");
			Common.applyStyle(self.exit, "button_critical", 3);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.popup.exit();
				return true;
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.exit, new G.LinearLayout.LayoutParams(-1, -2));

			self.popup = new PopupPage(self.linear, "common.Settings");

			PWM.registerResetFlag(self, "linear");
		}
		self.popup.on("exit", function() {
			self.data.forEach(function(e, i) {
				switch (e.type) {
					case "boolean":
					case "seekbar":
					if (e.get() != self.last[i] && e.refresh) e.refresh();
					return;
					case "custom":
					case "space":
					case "tag":
					case "text":
					return;
				}
			});
			if (onSave) onSave();
		});
		self.data = data.filter(function(e) {
			if (e.hidden && e.hidden()) return false;
			return true;
		});
		self.last = self.data.map(function(e) {
			switch (e.type) {
				case "boolean":
				case "seekbar":
				return e.get();
				case "custom":
				case "space":
				case "tag":
				case "text":
				return null;
			}
		});
		self.list.setAdapter(new RhinoListAdapter(self.data, self.adapter));
		self.popup.enter();
	} catch(e) {erp(e)}})},

	showFileDialog : function self(o) {G.ui(function() {try {
		if (!self.linear) {
			self.vmaker = function() {
				var name = new G.TextView(ctx);
				name.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
				name.setSingleLine(true);
				name.setEllipsize(G.TextUtils.TruncateAt.END);
				name.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				return name;
			}
			self.vbinder = function(holder, e) {
				if (e) {
					holder.self.setText((e.isDirectory() ? "\ud83d\udcc1 " : "\ud83d\udcc4 ") + String(e.getName())); //Emoji:Collapsed Folder; Document
					Common.applyStyle(holder.self, e.isHidden() ? "item_disabled" : "item_default", 3);
				} else {
					holder.self.setText("\ud83d\udcc2 .. (上一级目录)"); //Emoji:Expanded Folder
					Common.applyStyle(holder.self, "item_default", 3);
				}
			}
			self.compare = MapScript.host == "AutoJs" ? function(a, b) {
				a = String(a.getName()).toLowerCase();
				b = String(b.getName()).toLowerCase();
				return a > b ? 1 : a < b ? -1 : 0;
			} : function(a, b) {
				return a.getName().compareToIgnoreCase(b.getName());
			}
			self.choose = function(e) {
				var o = self.sets;
				if (o.check && !o.check(e)) return false;
				self.popup.exit();
				o.result = e;
				if (o.callback) o.callback(o);
				self.lastDir = o.curdir.getAbsolutePath();
				return true;
			}
			self.refresh = function() {
				var o = self.sets;
				var f = o.curdir.listFiles(), i, dir = [], fi = [];
				for (i in f) {
					if (o.filter && !o.filter(f[i])) continue;
					if (f[i].isDirectory()) {
						dir.push(f[i]);
					} else if (f[i].isFile()) {
						fi.push(f[i]);
					}
				}
				self.path.setText(o.curdir.getAbsolutePath());
				if (o.compare) {
					dir.sort(o.compare);
					fi.sort(o.compare);
				} else {
					dir.sort(self.compare);
					fi.sort(self.compare);
				}
				var a = o.fileFirst ? fi.concat(dir) : dir.concat(fi);
				if (o.curdir.getParent()) a.unshift(null);
				self.list.setAdapter(self.curadp = new SimpleListAdapter(a, self.vmaker, self.vbinder));
			}
			self.linear = new G.LinearLayout(ctx);
			self.linear.setOrientation(G.LinearLayout.VERTICAL);

			self.header = new G.LinearLayout(ctx);
			self.header.setOrientation(G.LinearLayout.HORIZONTAL);
			Common.applyStyle(self.header, "bar_float");

			self.back = new G.TextView(ctx);
			self.back.setText("< 返回");
			self.back.setGravity(G.Gravity.CENTER);
			self.back.setPadding(20 * G.dp, 0, 20 * G.dp, 0);
			Common.applyStyle(self.back, "button_highlight", 2);
			self.back.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.popup.exit();
				return true;
			} catch(e) {erp(e)}}}));
			self.header.addView(self.back, new G.LinearLayout.LayoutParams(-2, -1));

			self.title = new G.TextView(ctx);
			self.title.setPadding(0, 10 * G.dp, 0, 10 * G.dp);
			Common.applyStyle(self.title, "textview_default", 4);
			self.header.addView(self.title, new G.LinearLayout.LayoutParams(-2, -2));

			self.path = new G.TextView(ctx);
			self.path.setGravity(G.Gravity.CENTER | G.Gravity.LEFT);
			self.path.setPadding(15 * G.dp, 0, 5 * G.dp, 0);
			self.path.setSingleLine(true);
			self.path.setEllipsize(G.TextUtils.TruncateAt.START);
			Common.applyStyle(self.path, "textview_prompt", 2);
			self.path.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var o = self.sets;
				Common.showInputDialog({
					title : "路径",
					callback : function(s) {
						var f = new java.io.File(s);
						if (!f.exists()) {
							return Common.toast("路径不存在");
						}
						if (o.type == 0) {
							if (f.isDirectory()) {
								o.curdir = f;
							} else if (f.isFile()) {
								self.choose(f);
							} else return;
						} else if (o.type == 1 || o.type == 2) {
							o.curdir = f.isDirectory() ? f : f.getParentFile();
						}
						self.refresh();
					},
					singleLine : true,
					defaultValue : o.curdir.getAbsolutePath()
				});
				return true;
			} catch(e) {erp(e)}}}));
			self.header.addView(self.path, new G.LinearLayout.LayoutParams(0, -1, 1.0));

			self.newDir = new G.TextView(ctx);
			self.newDir.setText("\ud83d\udcc1+"); //Emoji:Collapsed Folder
			self.newDir.setGravity(G.Gravity.CENTER);
			self.newDir.setPadding(20 * G.dp, 0, 20 * G.dp, 0);
			Common.applyStyle(self.newDir, "button_default", 2);
			self.newDir.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var a = {
					title : "新建文件夹",
					callback : function(s) {
						if (!s) {
							Common.toast("目录名不能为空哦～");
							return;
						} else {
							try {
								(new java.io.File(self.sets.curdir, s)).mkdirs();
								self.refresh();
							} catch (e) {
								Common.toast("创建目录出错\n" + e + ")");
							}
						}
					}
				}
				Common.showInputDialog(a);
				return true;
			} catch(e) {erp(e)}}}));
			self.header.addView(self.newDir, new G.LinearLayout.LayoutParams(-2, -1));
			self.linear.addView(self.header, new G.LinearLayout.LayoutParams(-1, -2));

			self.list = new G.ListView(ctx);
			Common.applyStyle(self.list, "message_bg");
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				var o = self.sets;
				var e = self.curadp.getItem(pos);
				if (!e) {
					o.curdir = o.curdir.getParentFile();
				} else if (e.isDirectory()) {
					o.curdir = e;
				} else if (o.type == 0) {
					self.choose(e);
					return true;
				} else if (o.type == 1) {
					self.fname.setText(e.getName());
					return true;
				}
				self.refresh();
				return true;
			} catch(e) {erp(e)}}}));
			if (G.style == "Material") {
				self.list.setFastScrollEnabled(true);
				self.list.setFastScrollAlwaysVisible(false);
			}
			self.linear.addView(self.list, new G.LinearLayout.LayoutParams(-1, 0, 1.0));

			self.inputbar = new G.LinearLayout(ctx);
			self.inputbar.setOrientation(G.LinearLayout.HORIZONTAL);
			Common.applyStyle(self.inputbar, "bar_float");

			self.fname = new G.EditText(ctx);
			self.fname.setHint("文件名");
			self.fname.setSingleLine(true);
			self.fname.setGravity(G.Gravity.LEFT | G.Gravity.CENTER);
			self.fname.setInputType(G.InputType.TYPE_CLASS_TEXT);
			self.fname.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			Common.applyStyle(self.fname, "edittext_default", 3);
			self.inputbar.addView(self.fname, new G.LinearLayout.LayoutParams(0, -1, 1.0));

			self.exit = new G.TextView(ctx);
			self.exit.setText("确定");
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			Common.applyStyle(self.exit, "button_critical", 3);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var o = self.sets, e;
				if (o.type == 1) {
					if (!self.fname.getText().length()) {
						Common.toast("文件名不能为空哦～");
						return true;
					}
					var e = new java.io.File(o.curdir, self.fname.getText());
					if (!e.getParentFile().exists()) {
						e = new java.io.File(self.fname.getText());
						if (!e.getParentFile().exists()) {
							Common.toast("无效的文件名");
							return true;
						}
					}
					if (e.exists() && !e.isFile()) {
						Common.toast("同名目录已存在，无法保存");
						return true;
					}
					self.choose(e);
				} else if (o.type == 2) {
					self.choose(o.curdir);
				}
				return true;
			} catch(e) {erp(e)}}}));
			self.inputbar.addView(self.exit, new G.LinearLayout.LayoutParams(-2, -2));
			self.linear.addView(self.inputbar, new G.LinearLayout.LayoutParams(-1, -2));

			self.popup = new PopupPage(self.linear, "common.FileChooser");

			PWM.registerResetFlag(self, "linear");
		}
		if (o.onDismiss) self.popup.on("exit", o.onDismiss);
		self.sets = o;
		try {
			o.curdir = new java.io.File(String(o.initDir ? o.initDir : self.lastDir));
			if (!o.curdir.isDirectory()) o.curdir = android.os.Environment.getExternalStorageDirectory();
			self.refresh();
		} catch (e) {
			Common.toast("拒绝访问\n" + e + ")");
			return;
		}
		self.title.setText(Common.toString(o.title || "浏览"));
		switch (o.type) {
			case 1: //新建文件（保存）
			self.exit.setVisibility(G.View.VISIBLE);
			self.fname.setVisibility(G.View.VISIBLE);
			self.fname.setText(String(o.defaultFileName || ""));
			break;
			case 2: //选择目录（打开）
			self.exit.setVisibility(G.View.VISIBLE);
			self.fname.setVisibility(G.View.GONE);
			break;
			default:
			o.type = 0;
			case 0: //选择文件（打开）
			self.exit.setVisibility(G.View.GONE);
			self.fname.setVisibility(G.View.GONE);
		}
		self.popup.enter();
	} catch(e) {erp(e)}})},

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
			self.print = function(str, span) {
				var t = self.lines[self.lines.length - 1];
				if (span) {
					appendSSB(t, str, span);
				} else {
					t.append(str);
				}
				gHandler.post(function() {try {
					self.prompt.smoothScrollToPosition(self.lines.length - 1);
				} catch(e) {erp(e)}});
			}
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
			self.exec = function(_s) {
				var _t;
				if (_s.toLowerCase() == "exit") {
					self.popup.exit();
					return;
				} else if (_s.toLowerCase() == "cls") {
					self.cls();
					return;
				} else if (_s.toLowerCase() == "ls") {
					JSONEdit.traceGlobal();
				} else if (_s.toLowerCase().startsWith("ls ")) {
					JSONEdit.trace(eval.call(null, _s.slice(3)));
				} else if (_s.toLowerCase().startsWith("cp ")) {
					try {
						var _t = MapScript.toSource(eval.call(null, _s.slice(3)));
						self.print(_t);
						Common.setClipboardText(_t);
					} catch(_e) {
						self.print(_e + "\n" + _e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
						Common.setClipboardText(_e + "\n" + _e.stack);
					}
				} else if (_s.toLowerCase().startsWith("sn ")) {
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
				} else if (_s.toLowerCase().startsWith("exec ")) {
					try {
						_t = eval(Common.readFile(_s.slice(5), ""));
						self.print(Log.debug("D", _t, 0).join("\n"));
					} catch(_e) {
						self.print(_e + "\n" + _e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
					}
				} else if (_s.toLowerCase().startsWith("#")) {
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
				self.print(str + "\n");
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

	showWebViewDialog : function(s) {G.ui(function() {try {
		var layout, wv, ws, exit, popup;
		layout = new G.LinearLayout(ctx);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 0);
		Common.applyStyle(layout, "message_bg");
		wv = new G.WebView(ctx);
		wv.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1.0));
		if (s.url && s.code) {
			wv.loadDataWithBaseURL(String(s.url), String(s.code), s.mimeType ? String(s.mimeType) : null, null, null);
		} else if (s.code) {
			wv.loadData(String(s.code), s.mimeType ? String(s.mimeType) : null, null);
		} else if (s.url) {
			wv.loadUrl(String(s.url));
		} else {
			wv.loadUrl("about:blank");
		}
		ws = wv.getSettings();
		ws.setSupportZoom(true);
		ws.setJavaScriptEnabled(true);
		ws.setAllowFileAccess(true);
		ws.setAllowFileAccessFromFileURLs(true);
		ws.setAllowUniversalAccessFromFileURLs(true);
		ws.setSaveFormData(true);
		ws.setLoadWithOverviewMode(true);
		ws.setJavaScriptCanOpenWindowsAutomatically(true);
		ws.setLoadsImagesAutomatically(!CA.settings.noWebImage);
		ws.setAllowContentAccess(true);
		//ws.setBuiltInZoomControls(true);
		//ws.setUseWideViewPort(true);
		layout.addView(wv);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("关闭");
		exit.setGravity(G.Gravity.CENTER);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		Common.applyStyle(exit, "button_critical", 3);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			popup.exit();
			return true;
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		popup = PopupPage.showDialog("common.WebDialog", layout, -1, -1);
		popup.on("exit", function() {
			wv.destroy();
		});
	} catch(e) {erp(e)}})},

	showTutorial : function self(o) {gHandler.post(function() {try {
		if (!self.popup) {
			self.queue = [];
			self.next = function() {
				if (!self.popup.isShowing()) {
					var decor = ctx.getWindow().getDecorView();
					decor.getWindowVisibleDisplayFrame(self.frameRect);
					if (self.bmp) self.bmp.recycle();
					self.bmp = G.Bitmap.createBitmap(self.frameRect.width(), self.frameRect.height(), G.Bitmap.Config.ARGB_8888);
					self.frame.setBackground(new G.BitmapDrawable(self.bmp));
					self.cv.setBitmap(self.bmp);
					self.popup.showAtLocation(decor, G.Gravity.LEFT | G.Gravity.TOP, 0, 0);
					//if (MapScript.host == "Android" && G.supportFloat) ScriptActivity.bringToFront();
					PWM.addFloat(self.popup);
				}
				if (!self.queue.length) {
					self.popup.dismiss();
					return;
				}
				self.current = self.queue.shift();
				if (self.current.callback) self.current.callback();
				self.text.setText(self.current.text || "");
				self.draw(self.current);
			}
			self.draw = function(o) {
				self.cv.drawColor(Common.argbInt(0xa0, 0, 0, 0), G.PorterDuff.Mode.SRC);
				if (o.view) {
					o.rect = new G.Rect();
					o.view.getGlobalVisibleRect(o.rect);
					if (o.offset) o.rect.offset(o.offset[0] - self.frameRect.left, o.offset[1] - self.frameRect.top);
				}
				if (o.rect) {
					self.cv.drawRect(o.rect, self.paint);
				}
			}
			self.paint = new G.Paint();
			self.paint.setStyle(G.Paint.Style.FILL);
			self.paint.setColor(G.Color.WHITE);
			self.paint.setAntiAlias(true);
			self.paint.setXfermode(G.PorterDuffXfermode(G.PorterDuff.Mode.DST_OUT));
			self.cv = new G.Canvas();
			self.frameRect = new G.Rect();
			self.frame = new G.FrameLayout(ctx);
			self.frame.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				if (e.getAction() == e.ACTION_DOWN) {
					if (self.current.onDismiss) self.current.onDismiss();
					self.next();
				}
				return true;
			} catch(e) {return erp(e), true}}}));
			self.text = new G.TextView(ctx);
			self.text.setBackgroundColor(Common.argbInt(0x80, 0, 0, 0));
			self.text.setTextColor(G.Color.WHITE);
			self.text.setTextSize(16);
			self.text.setGravity(G.Gravity.CENTER);
			self.text.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
			self.text.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2, G.Gravity.CENTER));
			self.frame.addView(self.text);
			self.popup = new G.PopupWindow(self.frame, -1, -1);
			Common.applyPopup(self.popup);
			self.popup.setFocusable(true);
			self.popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
			self.popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
				self.bmp.recycle();
				self.bmp = null;
				if (self.current.onDismiss) self.current.onDismiss();
				self.queue.splice(0, self.queue.length).forEach(function(e) {
					if (e.onDismiss) e.onDismiss();
				});
			} catch(e) {erp(e)}}}));
		}
		self.queue.push(o);
		if (!self.popup.isShowing()) self.next();
	} catch(e) {erp(e)}})},

	toast : function self(str) {G.ui(function() {try {
		if (!self.frame) {
			self.show = function() {
				if (!self.overlay) {
					PopupPage.addOverlay(self.overlay = new PopupPage.Overlay(self.frame, -2, -2, G.Gravity.CENTER_HORIZONTAL | G.Gravity.BOTTOM));
				}
				if (!CA.settings.noAnimation) {
					var animation = new G.TranslateAnimation(0, 0, 8 * G.dp + self.text.getHeight(), 0);
					animation.setInterpolator(new G.DecelerateInterpolator(1.0));
					animation.setDuration(100);
					self.text.startAnimation(animation);
				}
			}
			self.hide = function() {
				if (!self.overlay) return;
				if (CA.settings.noAnimation) {
					PopupPage.removeOverlay(self.overlay);
					self.overlay = null;
				} else {
					var animation = new G.TranslateAnimation(0, 0, 0, 8 * G.dp + self.text.getHeight());
					animation.setInterpolator(new G.AccelerateInterpolator(2.0));
					animation.setDuration(100);
					animation.setFillEnabled(true);
					animation.setFillAfter(true);
					self.text.startAnimation(animation);
					gHandler.postDelayed(self.lastCbk = new java.lang.Runnable(function() {try { //防止Animation被取消
						self.lastCbk = null;
						PopupPage.removeOverlay(self.overlay);
						self.overlay = null;
					} catch(e) {erp(e)}}), 150);
				}
			}
			self.flash = function() {
				var animation = new G.TranslateAnimation(0, 8 * G.dp, 0, 0);
				animation.setInterpolator(new G.CycleInterpolator(2));
				animation.setDuration(300);
				self.text.startAnimation(animation);
			}
			self.toast = function(s) {
				if (self.lastCbk) gHandler.removeCallbacks(self.lastCbk);
				self.text.clearAnimation();
				if (!self.overlay) self.show();
				self.text.setText(Common.toString(s));
				if (self.lastToast == s) {
					self.flash();
				}
				self.lastToast = s;
				gHandler.postDelayed(self.lastCbk = new java.lang.Runnable(function() {try {
					self.lastCbk = null;
					self.hide();
					self.lastToast = "";
				} catch(e) {erp(e)}}), 2000);
			}
			self.frame = new G.FrameLayout(ctx);
			self.text = new G.TextView(ctx);
			self.text.setBackgroundColor(Common.argbInt(0xc0, 0, 0, 0));
			self.text.setTextColor(G.Color.WHITE);
			self.text.setTextSize(14);
			self.text.setGravity(G.Gravity.CENTER);
			self.text.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.text.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2, G.Gravity.CENTER_HORIZONTAL | G.Gravity.BOTTOM));
			self.text.getLayoutParams().setMargins(8 * G.dp, 8 * G.dp, 8 * G.dp, 8 * G.dp);
			self.frame.addView(self.text);
			if (G.style == "Material") self.text.setElevation(8 * G.dp);
		}
		self.toast(str);
	} catch(e) {erp(e)}})},

	fileCopy : function(src, dest) {
		const BUFFER_SIZE = 4096;
		var fi, fo, buf, hr;
		var fd = (dest instanceof java.io.File ? dest : new java.io.File(dest)).getParentFile();
		if (fd) fd.mkdirs();
		fi = new java.io.FileInputStream(src);
		fo = new java.io.FileOutputStream(dest);
		buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, BUFFER_SIZE);
		while ((hr = fi.read(buf)) > 0) fo.write(buf, 0, hr);
		fi.close();
		fo.close();
	},

	readFile : function(path, defaultValue, gzipped, error) {
		try{
			var rd, s = [], q;
			if (gzipped) {
				rd = new java.io.BufferedReader(new java.io.InputStreamReader(new java.util.zip.GZIPInputStream(new java.io.FileInputStream(path))));
			} else {
				rd = new java.io.BufferedReader(new java.io.FileReader(path));
			}
			while (q = rd.readLine()) s.push(q);
			rd.close();
			return s.join("\n");
		} catch(e) {
			if (error) error.error = e;
			return defaultValue;
		}
	},

	saveFile : function(path, text, gzipped) {
		var wr;
		var f = new java.io.File(path).getParentFile();
		if (f) f.mkdirs();
		if (gzipped) {
			wr = new java.util.zip.GZIPOutputStream(new java.io.FileOutputStream(path));
		} else {
			wr = new java.io.FileOutputStream(path);
		}
		wr.write(new java.lang.String(text).getBytes());
		wr.close();
	},

	getFileSize : function(f, showBytes) {
		var l = Number(f.length()), r;
		if (l < 1000) {
			r = l + " 字节";
		} else if (l >= 1000 && l < 1024000) {
			r = (l / 1024).toFixed(2) + " KB";
		} else if (l >= 1024000 && l < 1048576000) {
			r = (l / 1048576).toFixed(2) + " MB";
		} else {
			r = (l / 1073741824).toFixed(2) + " GB";
		}
		if (showBytes) r += " (" + l.toLocaleString() + " 字节)";
		return r;
	},

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

	toString : function(s) {
		return s instanceof java.lang.CharSequence ? s : String(s);
	},

	toastSystem : function self(s, dur) {G.ui(function() {try {
		if (self.last) self.last.cancel();
		(self.last = G.Toast.makeText(ctx, Common.toString(s), dur ? 1 : 0)).show();
	} catch(e) {erp(e)}})},

	postIME : function(v, delay) {
		v.postDelayed(function() {try {
			v.requestFocus();
			ctx.getSystemService(ctx.INPUT_METHOD_SERVICE).showSoftInput(v, G.InputMethodManager.SHOW_IMPLICIT);
		} catch(e) {erp(e)}}, isNaN(delay) ? 0 : delay);
	},

	hideIME : function(v) {
		var imm = ctx.getSystemService(ctx.INPUT_METHOD_SERVICE);
		if (v) {
			imm.hideSoftInputFromWindow(v.getWindowToken(), 0);
		} else {
			if (imm.isActive()) imm.toggleSoftInput(0, imm.HIDE_NOT_ALWAYS);
		}
	},

	hasClipboardText : function() {
		if (android.os.Build.VERSION.SDK_INT >= 11) {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).hasPrimaryClip();
		} else {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).hasText();
		}
	},
	getClipboardText : function() {
		if (android.os.Build.VERSION.SDK_INT >= 11) {
			var clip = ctx.getSystemService(ctx.CLIPBOARD_SERVICE).getPrimaryClip();
			if (!clip) return null;
			return clip.getItemAt(0).coerceToText(ctx);
		} else {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).getText();
		}
	},
	setClipboardText : function(text) {
		if (android.os.Build.VERSION.SDK_INT >= 11) {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).setPrimaryClip(android.content.ClipData.newPlainText("", text));
		} else {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).setText(text);
		}
	},

	getMetrics : function() {
		var display = ctx.getSystemService(ctx.WINDOW_SERVICE).getDefaultDisplay(), out = new android.util.DisplayMetrics();
		display.getMetrics(out);
		var r = [out.widthPixels, out.heightPixels], rot = ctx.getResources().getConfiguration().orientation;
		if (rot == android.content.res.Configuration.ORIENTATION_LANDSCAPE) r.reverse();
		rot = display.getRotation();
		if (rot == G.Surface.ROTATION_90 || rot == G.Surface.ROTATION_270) r.reverse();
		return r;
	},
	getScreenHeight : function() {
		return this.getMetrics()[1];
	},
	getScreenWidth : function() {
		return this.getMetrics()[0];
	},

	replaceSelection : function(s, text) {
		var start = G.Selection.getSelectionStart(s);
		var end = G.Selection.getSelectionEnd(s);
		var t;
		if (start > end) {
			t = start; start = end; end = t;
		}
		if (start < 0) return;
		s.replace(start, end, text);
	},
	
	toFixedNumber : function(number, bits) {
		var pw = Math.pow(10, bits);
		return Math.floor(number * pw) / pw;
	},
	
	addSet : function(s, value) {
		var p = s.indexOf(value);
		if (p < 0) {
			s.push(value);
			return true;
		} else {
			return false;
		}
	},
	removeSet : function(s, value) {
		var p = s.indexOf(value);
		if (p >= 0) {
			s.splice(p, 1);
			return true;
		} else {
			return false;
		}
	},
	inSet : function(s, value) {
		return s.indexOf(value) >= 0;
	},
	exchangeProperty : function(o, i, j) {
		var t = o[i];
		o[i] = o[j];
		o[j] = t;
	}
});