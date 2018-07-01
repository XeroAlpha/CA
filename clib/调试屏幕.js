(function() {try {

if (Date.parse(CA.publishDate) < Date.parse("2018-06-30")) return {
	"name": "调试屏幕",
	"author": "ProjectXero",
	"description": "您的命令助手版本过低，无法启用调试屏幕。\n在屏幕上显示游戏相关信息。",
	"uuid": "5a204d07-4b6d-4c51-9470-a2d8c8676ab8",
	"version": [0, 6],
	"require": []
};

MapScript.loadModule("F3", {
	running : false,
	locked : false,
	eventLimit : 50,
	tk : 0,
	eventTypes : {
		TapBlock : true,
		DestroyBlock : true,
		AttackEntity : true
	},
	initialize : function() {
		if (MCAdapter.inLevel) this.newLevel();
	},
	newLevel : function() {
		if (CA.settings._F3_style) Menu.style = CA.settings._F3_style;
		if (CA.settings._F3_side) Menu.side = CA.settings._F3_side;
		if (CA.settings._F3_eventLimit) this.eventLimit = CA.settings._F3_eventLimit;
		if (CA.settings._F3_eventTypes) this.eventTypes = CA.settings._F3_eventTypes;
		if (Menu.style == "menu") {
			F3.showIcon();
		} else {
			this.showMenu(CA.settings._F3_openedMenu);
			CA.settings._F3_openedMenu = true;
		}
		MCAdapter.updateListener["F3.ticker"] = this.ticker.bind(this);
	},
	leaveGame : function() {
		delete MCAdapter.updateListener["F3.ticker"];
		this.hideMenu();
		this.hideIcon();
	},
	useItem : function(x, y, z, itemid, blockid, side, itemDamage, blockDamage) {
		this.logEvent("TapBlock", {
			pos : [x, y, z],
			block : blockid + ":" + blockDamage + ">" + side,
			carry : itemid + ":" + itemDamage
		});
	},
	destroyBlock : function(x, y, z, side) {
		this.logEvent("DestroyBlock", {
			pos : [x, y, z]
		});
	},
	attackHook : function(attacker, victim) {
		this.logEvent("AttackEntity", {
			attacker : attacker,
			victim : victim
		});
	},
	ticker : function() {
		if (!this.running || this.locked) return;
		var pp = MCAdapter.getInfo("playerposition"),
			pr = MCAdapter.getInfo("playerrotation"),
			pbp = MCAdapter.getInfo("pointedblockpos"),
			pbi = MCAdapter.getInfo("pointedblockinfo"),
			lb = MCAdapter.getInfo("levelbiome"),
			ll = MCAdapter.getInfo("levelbrightness"),
			lt = MCAdapter.getInfo("leveltime");
		this.items.x = pp[0].toFixed(5);
		this.items.y = (pp[1] - 1.619999885559082).toFixed(5);
		this.items.z = pp[2].toFixed(5);
		this.items.rx = pr[0].toFixed(5);
		this.items.ry = pr[1].toFixed(5);
		this.items.b = lb;
		this.items.bl = ll;
		this.items.t = lt;
		if (pbp[1] >= 0) {
			this.items.lx = pbp[0];
			this.items.ly = pbp[1];
			this.items.lz = pbp[2];
			this.items.lb = pbi[0];
			this.items.ld = pbi[1];
			this.items.ls = pbi[2];
		} else {
			this.items.lx = this.items.ly = this.items.lz = this.items.lb = this.items.ld = this.items.ls = null;
		}
		Menu.notifyChange();
	},
	showIcon : function self() {G.ui(function() {try {
		if (F3.icon) return;
		if (!self.view) {
			self.view = new G.TextView(ctx);
			self.view.setText("D");
			self.view.setTextSize(Common.theme.textsize[4]);
			self.view.setBackgroundColor(Common.theme.go_bgcolor);
			self.view.setTextColor(Common.theme.go_textcolor);
			self.view.setAlpha(0.7);
			self.view.setGravity(G.Gravity.CENTER);
			self.view.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				F3.showMenu(false);
				F3.hideIcon();
			} catch(e) {erp(e)}}}));
			self.view.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				switch (e.getAction()) {
					case e.ACTION_MOVE:
					if (touch.stead && Math.abs(touch.lx - e.getRawX()) + Math.abs(touch.ly - e.getRawY()) < 20 * G.dp) break;
					touch.stead = false;
					F3.icon.update(self.cx = e.getRawX() + touch.offx, self.cy = e.getRawY() + touch.offy, -1, -1);
					break;
					case e.ACTION_DOWN:
					touch.offx = self.cx - (touch.lx = e.getRawX());
					touch.offy = self.cy - (touch.ly = e.getRawY());
					touch.stead = true;
					v.setBackgroundColor(Common.theme.go_touchbgcolor);
					v.setTextColor(Common.theme.go_touchtextcolor);
					break;
					case e.ACTION_UP:
					case e.ACTION_CANCEL:
					v.setBackgroundColor(Common.theme.go_bgcolor);
					v.setTextColor(Common.theme.go_textcolor);
				}
				return !touch.stead;
			} catch(e) {erp(e)}}}));
		}
		F3.icon = new G.PopupWindow(self.view, 32 * G.dp, 32 * G.dp);
		if (CA.supportFloat) F3.icon.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		F3.icon.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.LEFT | G.Gravity.TOP, self.cx ? self.cx : (self.cx = Common.getScreenWidth()), self.cy ? self.cy : (self.cy = 0.5 * Common.getScreenHeight() - 16 * G.dp));
	} catch(e) {erp(e)}})},
	hideIcon : function() {G.ui(function() {try {
		if (F3.icon) F3.icon.dismiss();
		F3.icon = null;
	} catch(e) {erp(e)}})},
	showMenu : function(hide) {
		if (Menu.style == "menu") {
			Menu.side = G.Gravity.RIGHT | G.Gravity.BOTTOM;
		} else if (Menu.side == (G.Gravity.RIGHT | G.Gravity.BOTTOM)) {
			Menu.side = G.Gravity.RIGHT;
		}
		Menu.show("调试屏幕", this.menu, this.menuListener, hide);
		if (hide) Common.toast("调试屏幕 by ProjectXero\n您可以从屏幕" + F3.getGravityText(Menu.side) + "滑出调试屏幕");
	},
	hideMenu : function() {
		Menu.hideAll();
	},
	copyWithToast : function(s) {
		Common.setClipboardText(s);
		Common.toast("内容已复制：" + s);
	},
	getGravityText : function(side) {
		switch (side) {
			case G.Gravity.LEFT:
			return "左侧";
			case G.Gravity.RIGHT:
			return "右侧";
			case G.Gravity.TOP:
			return "上方";
			case G.Gravity.BOTTOM:
			return "下方";
			default:
			return "一侧";
		}
	},
	showCopyPosition : function(x, y, z) {
		Menu.show("坐标", [{
			text : "X: " + x,
			onClick : function() {
				F3.copyWithToast(String(x));
			}
		}, {
			text : "Y: " + y,
			onClick : function() {
				F3.copyWithToast(String(y));
			}
		}, {
			text : "Z: " + z,
			onClick : function() {
				F3.copyWithToast(String(z));
			}
		}, {
			space : 10,
		}, {
			text : "复制命令形式：<X> <Y> <Z>",
			onClick : function() {
				F3.copyWithToast([x, y, z].join(" "));
			}
		}, {
			text : "复制选择器形式：x=<X>,y=<Y>,z=<Z>",
			onClick : function() {
				F3.copyWithToast(["x=" + x, "y=" + y, "z=" + z].join(","));
			}
		}]);
	},
	showCopyRotation : function(rx, ry) {
		Menu.show("视角", [{
			text : "RX: " + rx,
			onClick : function() {
				F3.copyWithToast(String(rx));
			}
		}, {
			text : "RY: " + ry,
			onClick : function() {
				F3.copyWithToast(String(ry));
			}
		}, {
			space : 10,
		}, {
			text : "复制选择器形式：rx=<X>,ry=<Y>",
			onClick : function() {
				F3.copyWithToast(["rx=" + rx, "ry=" + ry].join(","));
			}
		}]);
	},
	logEvent : function self(name, args) {
		if (!self.onclick) {
			self.onclick = function() {
				Menu.show(this.eventName, this.argsMenu);
			}
		}
		if (this.locked) return;
		if (!this.eventTypes[name]) return;
		var s = [name], a = [];
		for (i in args) {
			s.push(i + ":" + args[i]);
			a.push(this.convertEventArg(i, args[i]));
		}
		this.eventBuffer.unshift({
			text : s.join("\n"),
			eventName : name,
			argsMenu : a,
			onClick : self.onclick
		});
		if (this.eventBuffer.length > this.eventLimit) this.eventBuffer.length = this.eventLimit;
		if (this.running) this.refreshEvents();
	},
	refreshEvents : function() {G.ui(function() {try {
		if (!Menu.isCurrentMenu(F3.menu)) return;
		var s = Menu.getIndex("eventHead") + 1, e = Menu.getIndex("eventEnd");
		var k = Menu.control();
		k.splice.apply(k, [s, e - s].concat(F3.eventBuffer));
	} catch(e) {erp(e)}})},
	convertEventArg : function self(name, arg) {
		if (!self.strArg) {
			self.strArg = function() {
				F3.copyWithToast(this.data);
			}
			self.posArg = function() {
				F3.showCopyPosition(this.data[0], this.data[1], this.data[2]);
			}
		}
		if (typeof arg == "string") {
			return {
				text : name + ": " + arg,
				data : arg,
				onClick : self.strArg
			};
		} else if (Array.isArray(arg) && arg.length == 3) {
			return {
				text : name + ":(" + arg.join(",") + ")",
				data : arg,
				onClick : self.posArg
			};
		} else return self(name, String(arg));
	},
	items : {},
	eventBuffer : [],
	menuListener : {
		onShow : function(resolvedMenu) {
			F3.running = true;
			F3.refreshEvents();
			if (Menu.style == "menu") F3.hideIcon();
		},
		onExit : function() {
			F3.running = false;
			if (Menu.style == "menu") F3.showIcon();
		},
		onPause : function() {
			F3.running = false;
		},
		onResume : function(resolvedMenu) {
			F3.running = true;
			F3.refreshEvents();
		},
		onDrawerClose : function() {
			F3.running = false;
		},
		onDrawerOpen : function() {
			F3.running = true;
			F3.refreshEvents();
		}
	},
	menu : [{
		text : "锁定",
		checked : function() {
			return F3.locked;
		},
		set : function(v) {
			F3.locked = v;
		}
	}, {
		text : function() {
			return "X: " + F3.items.x + "\nY: " + F3.items.y + "\nZ: " + F3.items.z;
		},
		onClick : function() {
			F3.showCopyPosition(F3.items.x, F3.items.y, F3.items.z);
		}
	}, {
		text : function() {
			return "RX: " + F3.items.rx + "\nRY: " + F3.items.ry;
		},
		onClick : function() {
			F3.showCopyRotation(F3.items.rx, F3.items.ry);
		}
	}, {
		text : function() {
			return "Biome: " + F3.items.b + "\nBrightness: " + F3.items.bl;
		}
	}, {
		text : function() {
			var s = ["PointTo"];
			if (F3.items.ly) s.push("Block: " + [F3.items.lx, F3.items.ly, F3.items.lz].join(",") + ":" + F3.items.lb + ":" + F3.items.ld + ">" + F3.items.ls);
			if (F3.items.puid) s.push("Entity: " + F3.items.puid + " (" + F3.items.pt + ")");
			if (s.length > 1) return s.join("\n");
			return "PointTo: None";
		},
		onClick : function() {
			if (F3.items.ly) {
				F3.showCopyPosition(F3.items.lx, F3.items.ly, F3.items.lz);
			}
		}
	}, {
		space : 10
	}, {
		text : "事件日志",
		highlight : true,
		id : "eventHead"
	}, {
		text : "清空事件日志",
		id : "eventEnd",
		onClick : function() {
			F3.eventBuffer.length = 0;
			F3.refreshEvents();
		}
	}, {
		space : 10
	}, {
		text : "设置",
		onClick : function() {
			Menu.show("设置", F3.manage, {
				onExit : function() {
					Menu.reset();
					CA.settings._F3_style = Menu.style;
					CA.settings._F3_side = parseInt(Menu.side);
					CA.settings._F3_eventLimit = parseInt(F3.eventLimit);
					CA.settings._F3_eventTypes = F3.eventTypes;
					CA.trySave();
					F3.showMenu();
				}
			});
		}
	}],
	manage : [{
		text : "样式",
		highlight : true
	},{
		text : "Menu",
		value : "menu",
		option : "style",
		checked : function() {
			return Menu.style == this.value;
		},
		set : function(v) {
			Menu.style = v;
		}
	},{
		text : "Drawer",
		value : "drawer",
		option : "style",
		checked : function() {
			return Menu.style == this.value;
		},
		set : function(v) {
			Menu.style = v;
		}
	},{
		space : 10
	},{
		text : "位置（仅Drawer样式下可用）",
		highlight : true
	}, function() {
		var bit = {
			"左" : G.Gravity.LEFT,
			"右" : G.Gravity.RIGHT,
			"上" : G.Gravity.TOP,
			"下" : G.Gravity.BOTTOM
		};
		return Object.keys(bit).map(function(e) {
			return {
				text : e,
				value : bit[e],
				option : "side",
				checked : function() {
					return Menu.side == this.value;
				},
				set : function(v) {
					Menu.side = v;
				}
			};
		});
	}, {
		space : 10
	}, {
		text : "事件限制",
		highlight : true
	}, {
		text : "最大数量",
		input : "number",
		get : function() {
			return F3.eventLimit;
		},
		set : function(v) {
			F3.eventLimit = parseInt(v);
		}
	}, function() {
		return Object.keys(F3.eventTypes).map(function(e) {
			return {
				text : e,
				checked : function() {
					return F3.eventTypes[e] == true;
				},
				set : function(v) {
					F3.eventTypes[e] = v == true;
				}
			};
		});
	}, {
		space : 10
	}, {
		prompt : "调试屏幕 V 0.6\n本模块由@ProjectXero制作"
	}]
});

MapScript.loadModule("Menu", {
	side : G.Gravity.RIGHT,
	style : "drawer",
	show : function self(title, menu, listener, drawer) {G.ui(function() {try {
		if (!self.adapter) {
			self.adapter = function(e, i, a) {
				if (e.layout && !e.noCache) {
					self.itemNotifyChange(e);
					return e.layout;
				}
				var z = e._views = {};
				if ("space" in e) {
					e.layout = new G.Space(ctx);
					e.layout.setLayoutParams(new G.AbsListView.LayoutParams(-1, e.space > 0 ? e.space * G.dp : 0));
					e.layout.setFocusable(true);
					return e.layout;
				} else if ("prompt" in e) {
					e.layout = new G.TextView(ctx);
					e.layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
					e.layout.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					e.layout.setText(e.prompt instanceof Function ? e.prompt() : String(e.prompt));
					e.layout.setTextAppearance(ctx, G.R.style.TextAppearance_DeviceDefault_Small);
					e.layout.setFocusable(true);
					return e.layout;
				}
				e.layout = new G.LinearLayout(ctx);
				e.layout.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				e.layout.setPadding(10 * G.dp, 0, 10 * G.dp, 0);
				e.layout.setGravity(G.Gravity.CENTER);
				e.layout.setOrientation(G.LinearLayout.HORIZONTAL);
				if (e.icon) {
					z.icon = new G.ImageView(ctx);
					e.icon(z.icon);
					z.icon.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
					e.layout.addView(z.icon);
				}
				z.text = new G.TextView(ctx);
				z.text.setPadding(10 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
				z.text.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2, 1));
				z.text.setText(e.text instanceof Function ? e.text() : String(e.text));
				z.text.setGravity(G.Gravity.CENTER_VERTICAL | G.Gravity.LEFT);
				z.text.setTextAppearance(ctx, e.larger ? G.R.style.TextAppearance_DeviceDefault_Widget_ActionBar_Menu : G.R.style.TextAppearance_DeviceDefault_Widget_PopupMenu);
				if (e.highlight) z.text.setTextColor(self.colorlist.getColor(3, 0));
				e.layout.addView(z.text);
				if ("option" in e) {
					z.atm = new G.RadioButton(ctx);
					z.atm.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
					z.atm.setPadding(0, 15 * G.dp, 15 * G.dp, 15 * G.dp);
					z.atm.setChecked(e.checked ? Boolean(e.checked()) : e.get ? e.get() == e.value : false);
					z.atm.setOnCheckedChangeListener(new G.CompoundButton.OnCheckedChangeListener({onCheckedChanged : function(v, s) {try {
						if (s) self.radioChecked(e);
						if ("value" in e) {
							if (!s) return;
							e.set(e.value);
						} else {
							e.set(s);
						}
					} catch(e) {erp(e)}}}));
					z.atm.setFocusable(false);
					e.layout.addView(z.atm);
				} else if ("checked" in e) {
					z.atm = new G.CheckBox(ctx);
					z.atm.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
					z.atm.setPadding(0, 15 * G.dp, 15 * G.dp, 15 * G.dp);
					z.atm.setChecked(Boolean(e.checked()));
					z.atm.setOnCheckedChangeListener(new G.CompoundButton.OnCheckedChangeListener({onCheckedChanged : function(v, s) {try {
						e.set(s);
					} catch(e) {erp(e)}}}));
					z.atm.setFocusable(false);
					e.layout.addView(z.atm);
				} else if ("submenu" in e) {
					z.atm = new G.TextView(ctx);
					z.atm.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
					z.atm.setPadding(0, 15 * G.dp, 15 * G.dp, 15 * G.dp);
					z.atm.setText(">");
					z.atm.setTextAppearance(ctx, G.R.style.TextAppearance_DeviceDefault_Small);
					e.layout.addView(z.atm);
				} else if ("input" in e) {
					z.atm = new G.EditText(ctx);
					z.atm.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
					z.atm.setPadding(0, 15 * G.dp, 15 * G.dp, 15 * G.dp);
					z.atm.setSingleLine(true);
					z.atm.setGravity(G.Gravity.CENTER);
					z.atm.setEms(e.ems ? e.ems : 5);
					z.atm.setInputType(G.InputType.TYPE_NULL);
					z.atm.setFocusable(false);
					z.atm.setText(String(e.get()));
					z.atm.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
						Menu.showEditText(e);
						return true;
					} catch(e) {erp(e)}}}));
					z.atm.addTextChangedListener(new G.TextWatcher({
						afterTextChanged : function(s) {try {
							e.set(e.input == "number" ? Number(s) : String(s));
						} catch(e) {erp(e)}}
					}));
					e.layout.addView(z.atm);
				} else if ("max" in e) {
					z.min = e.min instanceof Function ? e.min() : isNaN(e.min) ? 0 : e.min,
					z.max = e.max instanceof Function ? e.max() : isNaN(e.max) ? 100 : e.max,
					z.step = isNaN(e.step) ? 1 : e.step;
					z.head = e.layout;
					e.layout = new G.LinearLayout(ctx);
					e.layout.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					e.layout.setPadding(10 * G.dp, 0, 10 * G.dp, 0);
					e.layout.setOrientation(G.LinearLayout.VERTICAL);
					z.head.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
					z.value = new G.TextView(ctx);
					z.value.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
					z.value.setGravity(G.Gravity.CENTER);
					z.value.setTextAppearance(ctx, G.R.style.TextAppearance_DeviceDefault_Small);
					z.head.addView(z.value);
					e.layout.addView(z.head);
					z.atm = new G.SeekBar(ctx);
					z.atm.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
					z.atm.setPadding(10 * G.dp, 0, 10 * G.dp, 10 * G.dp);
					z.atm.setMax((z.max - z.min) / z.step);
					z.atm.setOnSeekBarChangeListener(new G.SeekBar.OnSeekBarChangeListener({
						onProgressChanged : function(v, progress, fromUser) {try {
							var p = progress * z.step + z.min;
							z.value.setText(e.progress ? e.progress(p) : String(p));
							return true;
						} catch(e) {erp(e)}},
						onStopTrackingTouch : function(v) {try {
							e.set(v.getProgress() * z.step + z.min);
							return true;
						} catch(e) {erp(e)}}
					}));
					z.atm.setProgress((e.get() - z.min) / z.step);
					e.layout.addView(z.atm);
				} else if ("loading" in e) {
					z.atm = new G.ProgressBar(ctx);
					z.atm.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
					z.atm.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
					e.layout.addView(z.atm);
				} else if (!("onClick" in e)) {
					e.layout.setFocusable(true);
				}
				return e.layout;
			}
			self.radioChecked = function(r) {
				self.current.forEach(function(e) {
					if (!("option" in e)) return;
					if (r == e || e.option != r.option) return;
					e._views.atm.setChecked(false);
				});
			}
			self.menustack = [];
			self.current = null;
			self.animateShow = function() {
				var a, k;
				if ((Menu.side & G.Gravity.TOP) == G.Gravity.TOP) {
					k = [0, 0, -1, 0];
				} else if ((Menu.side & G.Gravity.BOTTOM) == G.Gravity.BOTTOM) {
					k = [0, 0, 1, 0];
				} else if ((Menu.side & G.Gravity.LEFT) == G.Gravity.LEFT) {
					k = [-1, 0, 0, 0];
				} else if ((Menu.side & G.Gravity.RIGHT) == G.Gravity.RIGHT) {
					k = [1, 0, 0, 0];
				} else {
					k = [0, 0, 0, 0];
				}
				a = new G.TranslateAnimation(G.Animation.RELATIVE_TO_SELF, k[0], G.Animation.RELATIVE_TO_SELF, k[1], G.Animation.RELATIVE_TO_SELF, k[2], G.Animation.RELATIVE_TO_SELF, k[3]);
				a.setInterpolator(new G.DecelerateInterpolator(2));
				a.setDuration(200);
				a.setStartOffset(100);
				self.inDrawer = false;
				self.linear.setTranslationX(0);
				self.linear.setTranslationY(0);
				self.linear.setVisibility(G.View.VISIBLE);
				self.linear.startAnimation(a);
				self.popup.showAtLocation(ctx.getWindow().getDecorView(), Menu.side, 0, 0);
			}
			self.animateHide = function() {
				var a, k;
				if ((Menu.side & G.Gravity.TOP) == G.Gravity.TOP) {
					k = [0, 0, 0, -1];
				} else if ((Menu.side & G.Gravity.BOTTOM) == G.Gravity.BOTTOM) {
					k = [0, 0, 0, 1];
				} else if ((Menu.side & G.Gravity.LEFT) == G.Gravity.LEFT) {
					k = [0, -1, 0, 0];
				} else if ((Menu.side & G.Gravity.RIGHT) == G.Gravity.RIGHT) {
					k = [0, 1, 0, 0];
				} else {
					k = [0, 0, 0, 0];
				}
				a = new G.TranslateAnimation(G.Animation.RELATIVE_TO_SELF, k[0], G.Animation.RELATIVE_TO_SELF, k[1], G.Animation.RELATIVE_TO_SELF, k[2], G.Animation.RELATIVE_TO_SELF, k[3]);
				a.setInterpolator(new G.AccelerateInterpolator(2));
				a.setDuration(200);
				a.setAnimationListener(new G.Animation.AnimationListener({
					onAnimationEnd : function(a) {
						self.popup.dismiss();
						if (self.menustack.length == 0) self.current = null;
					}
				}));
				self.linear.startAnimation(a);
			}
			self.goBack = function() {
				var l;
				if (Menu.style == "drawer" && self.menustack.length == 1) {
					self.closeDrawer();
					return;
				}
				if (self.menustack[0].listener.onExit) l = self.menustack[0].listener;
				self.menustack.shift();
				if (self.menustack.length > 0) {
					self.openMenu(self.menustack[0], true);
				} else {
					self.current = null;
					self.animateHide();
				}
				if (l) l.onExit();
			}
			self.openMenu = function(o, again) {
				var v;;
				if (self.menustack.length && self.menustack[0].menu != o.menu) {
					self.menustack[0].scrollTop = (v = self.list.getChildAt(0)) == null ? 0 : v.getTop();
					self.menustack[0].scrollPos = self.list.getFirstVisiblePosition(); // To be fix : not work
					if (self.menustack[0].listener.onPause) self.menustack[0].listener.onPause();
				}
				if (!o.adpt) {
					var z = [];
					o.menu.forEach(function self(e) {
						var r;
						if (!(e instanceof Object)) return;
						if (e.hidden && e.hidden()) return;
						if (e instanceof Function) {
							r = e();
							self(r);
						} else if (e instanceof Array) {
							e.forEach(self);
						} else {
							z.push(e);
						}
					});
					o.adpt = new RhinoListAdapter(z, self.adapter, null, true);
				}
				self.current = RhinoListAdapter.getController(o.adpt);
				self.list.setAdapter(o.adpt);
				self.title.setText(o.title);
				self.relayout();
				if (o.scrollTop > 0) self.list.post(function() {try {
					self.list.setSelectionFromTop(o.scrollPos, o.scrollTop);
				} catch(e) {erp(e)}});
				self.linear.clearAnimation();
				if (!self.popup.isShowing()) {
					if (o.drawer && Menu.style == "drawer") {
						self.showDrawer();
					} else {
						self.animateShow();
					}
				}
				if (again) {
					if (o.listener.onResume) o.listener.onResume(z);
				} else {
					self.menustack.unshift(o);
					if (o.listener.onShow) o.listener.onShow(z);
				}
				return self.menustack.length > 1;
			}
			self.itemNotifyChange = function(e) {
				var z = e._views;
				if ("space" in e) {
					return;
				} else if ("prompt" in e) {
					e.layout.setText(e.prompt instanceof Function ? e.prompt() : String(e.prompt));
					return;
				}
				if (e.icon) {
					e.icon(z.icon);
				}
				z.text.setText(e.text instanceof Function ? e.text() : String(e.text));
				if ("option" in e) {
					z.atm.setChecked(e.checked ? Boolean(e.checked()) : e.get ? e.get() == e.value : false);
				} else if ("checked" in e) {
					z.atm.setChecked(Boolean(e.checked()));
				} else if ("input" in e) {
					z.atm.setText(String(e.get()));
				} else if ("max" in e) {
					z.min = e.min instanceof Function ? e.min() : isNaN(e.min) ? 0 : e.min,
					z.max = e.max instanceof Function ? e.max() : isNaN(e.max) ? 100 : e.max,
					z.step = isNaN(e.step) ? 1 : e.step;
					z.atm.setMax((z.max - z.min) / z.step);
					z.atm.setProgress((e.get() - z.min) / z.step);
				}
			}
			self.notifyChange = function() {
				if (!self.current) return;
				self.current.forEach(self.itemNotifyChange);
				self.relayout();
			}
			self.relayout = function() {
				if (Menu.style == "drawer" && (Menu.side & G.Gravity.VERTICAL_GRAVITY_MASK) > 0) return;
				self.bar.measure(0, 0);
				self.list.getLayoutParams().width = Menu.getListMinWidth(self.list, self.bar.getMeasuredWidth(), G.screenWidth);
				self.linear.requestLayout();
				self.linear.invalidate();
			}
			self.setOption = function(option, value) {
				if (!self.current) return;
				self.current.forEach(function(e) {
					if (!e.option || e.option != option || e.value != value) return;
					e._views.atm.setChecked(true);
				});
			}
			self.calcOffset = function(dx, dy) {
				if ((Menu.side & G.Gravity.TOP) == G.Gravity.TOP) {
					return -dy;
				} else if ((Menu.side & G.Gravity.BOTTOM) == G.Gravity.BOTTOM) {
					return dy;
				} else if ((Menu.side & G.Gravity.LEFT) == G.Gravity.LEFT) {
					return -dx;
				} else if ((Menu.side & G.Gravity.RIGHT) == G.Gravity.RIGHT) {
					return dx;
				}
				return 0;
			}
			self.applyOffset = function(off, arr) {
				if ((Menu.side & G.Gravity.TOP) == G.Gravity.TOP) {
					arr[0] = 0; arr[1] = -off;
				} else if ((Menu.side & G.Gravity.BOTTOM) == G.Gravity.BOTTOM) {
					arr[0] = 0; arr[1] = off;
				} else if ((Menu.side & G.Gravity.LEFT) == G.Gravity.LEFT) {
					arr[0] = -off; arr[1] = 0;
				} else if ((Menu.side & G.Gravity.RIGHT) == G.Gravity.RIGHT) {
					arr[0] = off; arr[1] = 0;
				} else {
					arr[0] = 0; arr[1] = 0;
				}
			}
			self.canSlide = function(dx, dy) {
				if ((Menu.side & G.Gravity.TOP) == G.Gravity.TOP) {
					return -dy * 2 > self.linear.getHeight();
				} else if ((Menu.side & G.Gravity.BOTTOM) == G.Gravity.BOTTOM) {
					return dy * 2 > self.linear.getHeight();
				} else if ((Menu.side & G.Gravity.LEFT) == G.Gravity.LEFT) {
					return -dx * 2 > self.linear.getWidth();
				} else if ((Menu.side & G.Gravity.RIGHT) == G.Gravity.RIGHT) {
					return dx * 2 > self.linear.getWidth();
				}
				return false;
			}
			self.closeDrawer = function(push) {
				self.linear.setTranslationX(self.dir[0] * self.linear.getWidth());
				self.linear.setTranslationY(self.dir[1] * self.linear.getHeight());
				var t = new G.TranslateAnimation(self.trans[0] - self.linear.getTranslationX(), 0, self.trans[1] - self.linear.getTranslationY(), 0);
				t.setInterpolator(new G.AccelerateInterpolator(2.0));
				t.setDuration(100);
				t.setAnimationListener(new G.Animation.AnimationListener({
					onAnimationEnd : function(a) {
						self.linear.setVisibility(G.View.GONE);
						self.inDrawer = true;
						if (push && self.menustack[0].listener.onDrawerClose) self.menustack[0].listener.onDrawerClose();
					}
				}));
				self.linear.startAnimation(t);
				self.trans[0] = self.linear.getTranslationX();
				self.trans[1] = self.linear.getTranslationY();
			}
			self.openDrawer = function(pull) {
				self.inDrawer = false;
				self.linear.setTranslationX(0);
				self.linear.setTranslationY(0);
				self.linear.setVisibility(G.View.VISIBLE);
				if (pull && self.menustack[0].listener.onDrawerOpen) self.menustack[0].listener.onDrawerOpen();
				t = new G.TranslateAnimation(self.trans[0], 0, self.trans[1], 0);
				t.setInterpolator(new G.DecelerateInterpolator(2.0));
				t.setDuration(100);
				self.linear.startAnimation(t);
				self.trans[0] = self.trans[1] = 0;
			}
			self.showDrawer = function() {
				self.linear.setVisibility(G.View.GONE);
				self.inDrawer = true;
				self.popup.showAtLocation(ctx.getWindow().getDecorView(), Menu.side, 0, 0);
			}
			self.colorlist = ctx.obtainStyledAttributes([G.R.attr.textColorPrimary, G.R.attr.textColorHintInverse, G.R.attr.textColorPrimaryInverse, G.R.attr.textColorLink]);
			self.frame = new G.FrameLayout(ctx);
			self.linear = new G.LinearLayout(ctx);
			self.linear.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2));
			self.linear.setOrientation(G.LinearLayout.VERTICAL);
			self.bar = new G.FrameLayout(ctx);
			self.bar.setBackgroundColor(self.colorlist.getColor(0, 0));
			self.bar.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			if (G.style == "Material") self.bar.setElevation(8 * G.dp);
			self.bar.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.goBack();
				return true;
			} catch(e) {erp(e)}}}));
			self.back = new G.TextView(ctx);
			self.back.setPadding(15 * G.dp, 15 * G.dp, 30 * G.dp, 15 * G.dp);
			self.back.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2, G.Gravity.LEFT | G.Gravity.CENTER_VERTICAL));
			self.back.setText("◀️");
			self.back.setTextAppearance(ctx, G.R.style.TextAppearance_DeviceDefault_Small);
			self.back.setTextColor(self.colorlist.getColor(1, 0));
			self.back.measure(0, 0);
			self.bar.addView(self.back);
			self.title = new G.TextView(ctx);
			self.title.setPadding(self.back.getMeasuredWidth(), 15 * G.dp, self.back.getMeasuredWidth(), 15 * G.dp);
			self.title.setGravity(G.Gravity.CENTER);
			self.title.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2, G.Gravity.CENTER));
			self.title.setTextAppearance(ctx, G.R.style.TextAppearance_DeviceDefault_Large_Inverse);
			self.title.setTextColor(self.colorlist.getColor(2, 0));
			self.bar.addView(self.title);
			self.linear.addView(self.bar);
			self.list = new G.ListView(ctx);
			self.list.setDividerHeight(0);
			self.list.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1, G.Gravity.RIGHT | G.Gravity.BOTTOM));
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				if (!self.current) return;
				var d = parent.getItemAtPosition(pos);
				if ("input" in d || "checked" in d) {
					d._views.atm.performClick();
				}
				if (d.onClick && d.onClick(pos)) self.goBack();
				if ("submenu" in d && d.submenu) {
					self(String(d.text), d.submenu instanceof Function ? d.submenu() : d.submenu);
				}
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.list);
			self.frame.addView(self.linear);
			if (Menu.style == "menu") {
				self.linear.setBackgroundResource(G.R.drawable.dialog_holo_light_frame);
			} else if (Menu.style == "drawer") {
				var lp = self.linear.getLayoutParams();
				self.linear.setBackgroundColor(self.colorlist.getColor(2, 0));
				if (G.style == "Material") {
					self.linear.setElevation(8 * G.dp);
					if ((Menu.side & G.Gravity.TOP) == G.Gravity.TOP) {
						self.frame.setPadding(0, 0, 0, 8 * G.dp);
						lp.setMargins(0, 0, 0, 8 * G.dp);
						self.dir = [0, -1];
						lp.width = -1;
					} else if ((Menu.side & G.Gravity.BOTTOM) == G.Gravity.BOTTOM) {
						self.frame.setPadding(0, 8 * G.dp, 0, 0);
						lp.setMargins(0, 8 * G.dp, 0, 0);
						self.dir = [0, 1];
						lp.width = -1;
					} else if ((Menu.side & G.Gravity.LEFT) == G.Gravity.LEFT) {
						self.frame.setPadding(0, 0, 8 * G.dp, 0);
						lp.setMargins(0, 0, 8 * G.dp, 0);
						self.dir = [-1, 0];
						lp.height = -1;
					} else if ((Menu.side & G.Gravity.RIGHT) == G.Gravity.RIGHT) {
						self.frame.setPadding(8 * G.dp, 0, 0, 0);
						lp.setMargins(8 * G.dp, 0, 0, 0);
						self.dir = [1, 0];
						lp.height = -1;
					} else {
						self.dir = [0, 0];
					}
				}
				self.trans = [0, 0];
				self.touchListener = new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
					var off, t;
					switch (e.getAction()) {
						case e.ACTION_DOWN:
						if (touch.pull = self.inDrawer) {
							self.linear.setVisibility(G.View.VISIBLE);
							touch.stead = false
							self.inDrawer = false;
							touch.sx = e.getRawX() - self.dir[0] * self.linear.getWidth();
							touch.sy = e.getRawY() - self.dir[1] * self.linear.getHeight();
						} else {
							touch.sx = e.getRawX();
							touch.sy = e.getRawY();
							touch.stead = true;
						}
						case e.ACTION_MOVE:
						off = self.calcOffset(e.getRawX() - touch.sx, e.getRawY() - touch.sy);
						if (off < 0) off = 0;
						if (touch.stead) {
							if (off < 16 * G.dp || self.list.getCount() > 0 && (
								(self.dir[1] > 0 && (self.list.getFirstVisiblePosition() > 0 || self.list.getChildAt(0).getTop() < 0)) ||
								(self.dir[1] < 0 && (self.list.getLastVisiblePosition() < self.list.getCount() - 1 || self.list.getChildAt(self.list.getChildCount() - 1).getBottom() > self.list.getHeight())))) {
								break;
							} else {
								touch.stead = false;
								touch.sx = e.getRawX();
								touch.sy = e.getRawY();
								off = 0;
							}
						}
						self.applyOffset(off, self.trans);
						self.linear.setTranslationX(self.trans[0]);
						self.linear.setTranslationY(self.trans[1]);
						//e.setAction(e.ACTION_CANCEL);
						break;
						case e.ACTION_UP:
						if (touch.stead) return false;
						if (self.canSlide(e.getRawX() - touch.sx, e.getRawY() - touch.sy)) {
							self.closeDrawer(!touch.pull);
						} else {
							self.openDrawer(touch.pull);
						}
					}
					return false;
				} catch(e) {return erp(e), false}}});
				self.list.setOnTouchListener(self.touchListener);
				self.frame.setOnTouchListener(self.touchListener);
				self.bar.setOnTouchListener(self.touchListener);
			}
			if (Menu.style == "drawer") {
				if ((Menu.side & G.Gravity.HORIZONTAL_GRAVITY_MASK) > 0) {
					self.popup = new G.PopupWindow(self.frame, -2, -1);
				} else {
					self.popup = new G.PopupWindow(self.frame, -1, -2);
				}
			} else {
				self.popup = new G.PopupWindow(self.frame, -2, -2);
			}
			if (CA.supportFloat) self.popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		}
		self.openMenu({
			title : menu ? title : "",
			menu : menu ? menu : title,
			listener : listener instanceof Object ? listener : {},
			drawer : drawer
		});
	} catch(e) {erp(e)}})},
	getListMinWidth : function(list, min, max) {
		var a = list.getAdapter(), i, v, m = min > 0 ? min : 0;
		for (i = a.getCount() - 1; i >= 0; i--) {
			v = a.getView(i, null, list);
			v.measure(0, 0);
			m = Math.max(m, v.getMeasuredWidth());
		}
		return Math.min(m + list.getPaddingLeft() + list.getPaddingRight(), max);
	},
	inputType : {
		"number" : G.InputType.TYPE_CLASS_NUMBER | G.InputType.TYPE_NUMBER_FLAG_DECIMAL | G.InputType.TYPE_NUMBER_FLAG_SIGNED,
		"text" : G.InputType.TYPE_CLASS_TEXT | G.InputType.TYPE_TEXT_FLAG_IME_MULTI_LINE | G.InputType.TYPE_TEXT_FLAG_MULTI_LINE
	},
	showEditText : function(e) {
		var dialog = new G.AlertDialog.Builder(ctx), text, imm = ctx.getSystemService(ctx.INPUT_METHOD_SERVICE);
		dialog.setTitle(String(e.text));
		text = new G.EditText(ctx);
		text.setText(e._views.atm.getText());
		text.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
		if (e.input in this.inputType) text.setInputType(this.inputType[e.input]);
		text.setSingleLine(!e.multiline);
		text.setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
		text.setSelection(text.getText().length());
		text.post(function() {
			imm.showSoftInput(text, G.InputMethodManager.SHOW_IMPLICIT);
		});
		dialog.setView(text);
		dialog.setPositiveButton("确认", new android.content.DialogInterface.OnClickListener({
			onClick : function(dia, w) {try {
				Menu.set(e, String(text.getText()));
			} catch(e) {erp(e)}}
		}));
		dialog.setNegativeButton("取消", new android.content.DialogInterface.OnClickListener({
			onClick : function(dia, w) {}
		}));
		dialog.show();
	},
	notifyChange : function() {G.ui(function() {try {
		Menu.show.notifyChange();
	} catch(e) {erp(e)}})},
	set : function(e, value) {G.ui(function() {try {
		if ("checked" in e) {
			e._views.atm.setChecked(Boolean(value));
		} else if ("input" in e) {
			e._views.atm.setText(value);
		}
	} catch(e) {erp(e)}})},
	setOption : function(option, value) {G.ui(function() {try {
		Menu.show.setOption(option, value);
	} catch(e) {erp(e)}})},
	getItems : function(id) {
		if (!this.isShowing()) return null;
		return this.show.current.src.filter(function(e) {
			return e.id === id;
		});
	},
	getIndex : function(id) {
		if (!this.isShowing()) return -1;
		var i, a = this.show.current.src;
		for (i = 0; i < a.length; i++) {
			if (a[i].id === id) return i;
		}
		return -1;
	},
	isCurrentMenu : function(menu) {
		if (!this.show.adapter) return false;
		return this.show.menustack.length > 0 && this.show.menustack[0].menu == menu;
	},
	isInStack : function(menu) {
		if (!this.show.adapter) return false;
		return this.show.menustack.indexOf(menu) >= 0;
	},
	isShowing : function() {
		return this.show.current != null;
	},
	control : function() {
		return this.show.current;
	},
	close : function() {G.ui(function() {try {
		if (Menu.isShowing()) Menu.show.goBack();
	} catch(e) {erp(e)}})},
	hideAll : function() {G.ui(function() {try {
		if (Menu.isShowing()) Menu.show.animateHide();
	} catch(e) {erp(e)}})},
	openDrawer : function() {G.ui(function() {try {
		if (Menu.isShowing() && Menu.show.inDrawer) Menu.show.openDrawer(true);
	} catch(e) {erp(e)}})},
	closeDrawer : function() {G.ui(function() {try {
		if (Menu.isShowing() && !Menu.show.inDrawer) Menu.show.closeDrawer(true);
	} catch(e) {erp(e)}})},
	reset : function() {G.ui(function() {try {
		if (Menu.show.popup) {
			Menu.show.popup.dismiss();
			Menu.show.popup = null;
		}
		Menu.show.adapter = null;
	} catch(e) {erp(e)}})}
});

F3.initialize();

return {
	"name": "调试屏幕",
	"author": "ProjectXero",
	"description": "在屏幕上显示游戏相关信息。",
	"uuid": "5a204d07-4b6d-4c51-9470-a2d8c8676ab8",
	"version": [0, 6],
	"require": [],
	"minCAVersion": "2017-12-15"
};

} catch(e) {
return {
	"name": "调试屏幕",
	"author": "ProjectXero",
	"description": "加载出错：" + e,
	"uuid": "5a204d07-4b6d-4c51-9470-a2d8c8676ab8",
	"version": [0, 6],
	"require": [],
	"menu" : [{
		text : "查看错误",
		onClick : function() {
			erp(e);
		}
	}]
};
}})()