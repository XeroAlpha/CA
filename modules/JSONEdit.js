MapScript.loadModule("JSONEdit", {
	edit : null,
	pathbar : null,
	list : null,
	path : [],
	showAll : false,
	listItems : Object.keys,
	isObject : function(o) {
		return o instanceof Object;
	},
	show : function(o) {
		var i;
		o = Object(o);
		var name = o.rootname ? o.rootname : "根";
		var data = o.source;
		if (data === null) {
			return false;
		}
		this.showAll = Boolean(o.showAll);
		this.listItems = o.showAll ? function(o) {
			try {
				return Object.getOwnPropertyNames(o);
			} catch(e) {
				return Object.keys(o);
			}
		} : Object.keys;
		this.isObject = o.showAll ? function(o) {
			if (o == null) return false;
			return typeof o == "object" || typeof o == "function";
		} : function(o) {
			return o instanceof Object;
		};
		if (!this.isObject(o.source)) {
			this.showData("编辑“" + name + "”", data, function(newValue) {
				o.source = newValue;
				if (o.update) o.update();
			});
			return true;
		}
		this.path.length = 0;
		this.path.push({
			name : name,
			data : data,
			pos : 0
		});
		if (o.path) {
			for (i in o.path) {
				this.path.push({
					name : String(o.path[i]),
					data : this.isObject(data = data[o.path[i]]) ? data : {},
					pos : 0
				});
			}
		}
		this.updateListener = o.update ? function() {
			o.update();
		} : function() {};
		this.showEdit();
		this.refresh();
		return true;
	},
	create : function(callback, rootname) {
		this.showNewItem(function(data) {
			if (JSONEdit.isObject(data)) {
				JSONEdit.show({
					source : data,
					rootname : rootname,
					update : function() {
						callback(data);
					}
				});
			} else {
				return callback(data);
			}
		});
	},
	main : function self() {
		if (!self.menu) {
			self.saveMenu = [{
				text : "继续编辑",
				description : "继续编辑JSON",
				onclick : function(v, tag) {
					if (!JSONEdit.show(tag.par)) {
						Common.toast("该JSON没有可以编辑的地方");
						return true;
					}
				}
			},{
				text : "复制",
				description : "复制JSON",
				onclick : function(v, tag) {
					Common.setClipboardText(JSON.stringify(tag.data, null, "\t"));
					Common.toast("JSON已复制至剪贴板");
				}
			},{
				text : "保存",
				description : "将JSON的更改保存至之前的文件",
				onclick : function(v, tag) {
					if (tag.path) {
						MapScript.saveJSON(tag.path, tag.data);
						Common.toast("保存成功！");
					} else {
						Common.toast("请先另存为该文件");
					}
					return true;
				}
			},{
				text : "另存为",
				description : "将JSON保存到一个新文件",
				onclick : function(v, tag) {
					Common.showFileDialog({
						type : 1,
						callback : function(f) {
							try {
								MapScript.saveJSON(tag.path = f.result.getAbsolutePath(), tag.data);
								Common.toast("另存为成功");
							} catch(e) {
								Common.toast("文件保存失败，无法保存\n" + e);
							}
						}
					});
					return true;
				}
			},{
				text : "关闭",
				onclick : function(v, tag) {}
			}];
			self.menu = [{
				text : "新建",
				description : "新建一个JSON",
				onclick : function() {
					JSONEdit.create(function cb(o) {
						Common.showOperateDialog(self.saveMenu, {
							data : o,
							path : null,
							par : {
								source : o,
								update : function() {
									cb(this.source);
								}
							}
						});
					});
				}
			},{
				text : "打开",
				description : "从文件打开一个JSON",
				onclick : function() {
					Common.showFileDialog({
						type : 0,
						callback : function(f) {
							var o;
							try {
								o = {
									data : MapScript.readJSON(f.result.getAbsolutePath(), null),
									path : f.result.getAbsolutePath()
								}
								if (!JSONEdit.show(o.par = {
									source : o.data,
									update : function() {
										o.data = this.source;
										Common.showOperateDialog(self.saveMenu, o);
									}
								})) Common.showOperateDialog(self.saveMenu, o);
							} catch(e) {
								Common.toast("不是正确的JSON\n" + e);
							}
						}
					});
				}
			},{
				text : "取消",
				onclick : function(v, tag) {}
			}];
		}
		Common.showOperateDialog(self.menu);
	},

	showEdit : function self() {G.ui(function() {try {
		if (!self.main) {
			self.drawDivider = function(height) {
				var width = Math.floor(height / 2);
				var bmp = G.Bitmap.createBitmap(width, height, G.Bitmap.Config.ARGB_8888);
				var cv = new G.Canvas(bmp);
				var pa = new G.Paint();
				pa.setStrokeCap(G.Paint.Cap.BUTT);
				pa.setStyle(G.Paint.Style.STROKE)
				pa.setColor(Common.theme.promptcolor);
				pa.setStrokeWidth(2);
				pa.setAntiAlias(true);

				var ph = new G.Path();
				ph.moveTo(0, 0);
				ph.lineTo(width, width);
				ph.lineTo(0, height);
				cv.drawPath(ph, pa);

				return new G.BitmapDrawable(ctx.getResources(), bmp);
			}

			self.main = new G.LinearLayout(ctx);
			self.main.setOrientation(G.LinearLayout.VERTICAL);

			self.header = new G.LinearLayout(ctx);
			self.header.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			self.header.setOrientation(G.LinearLayout.HORIZONTAL);
			Common.applyStyle(self.header, "bar_float");

			self.back = new G.TextView(ctx);
			self.back.setText("< 返回");
			self.back.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
			self.back.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			Common.applyStyle(self.back, "button_critical", 2);
			self.back.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.popup.exit();
				return true;
			} catch(e) {erp(e)}}}));
			self.header.addView(self.back);

			self.hscr = new G.HorizontalScrollView(ctx);
			self.hscr.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -1));
			self.hscr.setHorizontalScrollBarEnabled(false);

			JSONEdit.pathbar = new G.LinearLayout(ctx);
			self.back.measure(0, 0);
			JSONEdit.pathbar.setDividerDrawable(self.drawDivider(self.back.getMeasuredHeight()));
			JSONEdit.pathbar.setShowDividers(G.LinearLayout.SHOW_DIVIDER_MIDDLE);
			JSONEdit.pathbar.setPadding(10 * G.dp, 0, 10 * G.dp, 0);
			JSONEdit.pathbar.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1));
			self.hscr.addView(JSONEdit.pathbar);
			self.header.addView(self.hscr);
			self.main.addView(self.header);

			self.create = new G.TextView(ctx);
			self.create.setText("添加 / 粘贴 ...");
			self.create.setGravity(G.Gravity.CENTER);
			self.create.setPadding(20 * G.dp, 20 * G.dp, 20 * G.dp, 20 * G.dp);
			self.create.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
			Common.applyStyle(self.create, "textview_default", 3);

			JSONEdit.list = new G.ListView(ctx);
			JSONEdit.list.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -1));
			JSONEdit.list.addHeaderView(self.create);
			Common.applyStyle(JSONEdit.list, "message_bg");
			JSONEdit.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				if (view == self.create) {
					JSONEdit.showNewItem(function(newItem) {
						var data = JSONEdit.path[JSONEdit.path.length - 1].data;
						if (Array.isArray(data)) {
							data.push(newItem);
							JSONEdit.refresh();
						} else if (JSONEdit.isObject(data)) {
							Common.showInputDialog({
								title : "请输入键名",
								callback : function(s) {
									if (!s) {
										Common.toast("键名不能为空");
									} else if (s in data) {
										Common.toast("键名已存在");
									} else {
										data[s] = newItem;
										JSONEdit.refresh();
									}
								}
							});
						} else {
							Common.toast("当前位置无法插入项目，请检查当前位置是否正确");
						}
					});
					return true;
				}

				var name = parent.getAdapter().getItem(pos);
				var data = JSONEdit.path[JSONEdit.path.length - 1].data[name];
				JSONEdit.path[JSONEdit.path.length - 1].pos = JSONEdit.list.getFirstVisiblePosition();
				if (JSONEdit.isObject(data)) {
					JSONEdit.path.push({
						name : String(name),
						data : data,
						pos : 0
					});
					JSONEdit.refresh();
					self.hscr.post(function() {try {
						self.hscr.fullScroll(G.View.FOCUS_RIGHT);
					} catch(e) {erp(e)}});
				} else if (data != null) {
					JSONEdit.showData("编辑“" + name + "”", data, function(newValue) {
						JSONEdit.path[JSONEdit.path.length - 1].data[name] = newValue;
						JSONEdit.refresh();
					});
				}
			} catch(e) {erp(e)}}}));
			JSONEdit.list.setOnItemLongClickListener(new G.AdapterView.OnItemLongClickListener({onItemLongClick : function(parent, view, pos, id) {try {
				if (view == self.create) {
					return true;
				}
				JSONEdit.showItemAction(parent.getAdapter().getItem(pos));
				return true;
			} catch(e) {return erp(e), true}}}));
			if (G.style == "Material") {
				JSONEdit.list.setFastScrollEnabled(true);
				JSONEdit.list.setFastScrollAlwaysVisible(false);
			}
			self.main.addView(JSONEdit.list);

			self.onBack = function() {
				if (JSONEdit.path.length > 1) {
					JSONEdit.path.pop();
					JSONEdit.refresh();
				} else {
					self.popup.exit();
				}
			}
			EventSender.init(self);
			self.listener = {};

			self.popup = new PopupPage(self.main, "jsonedit.Main");
			self.popup.on("back", function(name, cancelDefault) {
				self.onBack();
				cancelDefault();
			});
			self.popup.on("exit", function() {
				if (JSONEdit.updateListener) JSONEdit.updateListener();
			});
			PWM.registerResetFlag(self, "main");
		}
		JSONEdit.edit = self.popup.enter();
	} catch(e) {erp(e)}})},
	hideEdit : function() {G.ui(function() {try {
		if (JSONEdit.edit) JSONEdit.edit.exit();
		JSONEdit.edit = null;
	} catch(e) {erp(e)}})},
	showData : function(msg, data, callback) {G.ui(function() {try {
		var scr, layout, title, text, ret, exit, popup;
		scr = new G.ScrollView(ctx);
		Common.applyStyle(scr, "message_bg");
		layout = new G.LinearLayout(ctx);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
		title = new G.TextView(ctx);
		title.setText(msg);
		title.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
		title.setPadding(0, 0, 0, 10 * G.dp);
		Common.applyStyle(title, "textview_default", 4);
		layout.addView(title);
		if (typeof data == "boolean") {
			ret = new G.CheckBox(ctx);
			ret.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2, 0));
			ret.getLayoutParams().setMargins(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp)
			ret.setChecked(data);
			ret.setText("True / False");
		} else {
			ret = new G.EditText(ctx);
			ret.setText(String(data));
			ret.setSingleLine(false);
			ret.setMinWidth(0.5 * Common.getScreenWidth());
			ret.setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
			ret.setLayoutParams(new G.LinearLayout.LayoutParams(-2, 0, 1.0));
			if (typeof data == "number") ret.setInputType(G.InputType.TYPE_CLASS_NUMBER | G.InputType.TYPE_NUMBER_FLAG_SIGNED | G.InputType.TYPE_NUMBER_FLAG_DECIMAL);
			ret.setSelection(ret.length());
			Common.applyStyle(ret, "edittext_default", 2);
			Common.postIME(ret);
		}
		layout.addView(ret);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("确定");
		exit.setGravity(G.Gravity.CENTER);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		Common.applyStyle(exit, "button_critical", 3);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			var t;
			if (callback) {
				if (typeof data == "boolean") {
					callback(Boolean(ret.isChecked()));
				} else if (typeof data == "number") {
					t = Number(ret.getText());
					if (isFinite(t)) {
						callback(t);
					} else {
						Common.toast("非法的数字格式");
					}
				} else {
					callback(String(ret.getText()));
				}
			}
			popup.exit();
			return true;
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		scr.addView(layout);
		popup = PopupPage.showDialog("jsonedit.DataEditor", scr, -2, -2);
	} catch(e) {erp(e)}})},
	showBatchEdit : function(data, callback) {G.ui(function() {try {
		var frame, layout, title, text, ret, exit, popup;
		layout = new G.LinearLayout(ctx);
		layout.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1, G.Gravity.CENTER));
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
		Common.applyStyle(layout, "message_bg");
		layout.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {
			return true;
		}}));
		ret = new G.EditText(ctx);
		ret.setText(JSONEdit.showAll ? MapScript.toSource(data) : JSON.stringify(data, null, 4) || "<非法JSON>");
		ret.setSingleLine(false);
		ret.setGravity(G.Gravity.LEFT | G.Gravity.TOP);
		ret.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1.0));
		Common.applyStyle(ret, "edittext_default", 2);
		layout.addView(ret);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("保存");
		exit.setGravity(G.Gravity.CENTER);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		Common.applyStyle(exit, "button_critical", 3);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			var t;
			if (callback) {
				try {
					callback(JSON.parse(ret.getText()));
					popup.exit();
				} catch(e) {
					Common.toast("解析JSON出错\n" + e);
				}
			}
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		Common.initEnterAnimation(layout);
		popup = new PopupPage(layout, "jsonedit.BatchEdit");
		popup.enter();
	} catch(e) {erp(e)}})},
	showNewItem : function self(callback) {
		if (!self.menu) {
			self.menu = [{
				text : "空对象(默认)",
				description : "{} : 用于存储键值对",
				onclick : function(v, tag) {
					tag.callback({});
				}
			},{
				text : "空数组",
				description : "[] : 用于存储有序条目",
				onclick : function(v, tag) {
					tag.callback([]);
				}
			},{
				text : "字符串",
				description : "\"...\" : 用于存储文本",
				onclick : function(v, tag) {
					JSONEdit.showData("新建字符串", "", function(newValue) {
						tag.callback(newValue);
					});
				}
			},{
				text : "数字",
				description : "1234.5 : 用于存储数字",
				onclick : function(v, tag) {
					JSONEdit.showData("新建数字", 0, function(newValue) {
						tag.callback(newValue);
					});
				}
			},{
				text : "布尔值",
				description : "true / false : 用于存储一个表示是或否的值",
				onclick : function(v, tag) {
					JSONEdit.showData("新建布尔值", true, function(newValue) {
						tag.callback(newValue);
					});
				}
			},{
				text : "空引用",
				description : "null : 用于存储一个表示不可用或不存在的值",
				onclick : function(v, tag) {
					tag.callback(null);
				}
			},{
				gap : G.dp * 10
			},{
				text : "从剪贴板粘贴",
				description : "从剪贴板中导入JSON",
				onclick : function(v, tag) {
					if (!Common.hasClipboardText()) {
						Common.toast("剪贴板为空");
						return true;
					}
					try {
						tag.callback(JSON.parse(Common.getClipboardText()));
					} catch(e) {
						Common.toast("解析JSON出错\n" + e);
					}
				}
			},{
				text : "手动输入",
				description : "手动输入JSON",
				onclick : function(v, tag) {
					Common.showInputDialog({
						title : "手动输入JSON",
						callback : function(s) {
							try {
								tag.callback(JSON.parse(s));
							} catch(e) {
								Common.toast("解析JSON出错\n" + e);
							}
						}
					});
				}
			}];
		}
		Common.showOperateDialog(self.menu, {callback : callback});
	},
	showItemAction : function self(name) {
		if (!self.menu) {
			self.menu = [{
				text : "复制",
				onclick : function(v, tag) {
					Common.setClipboardText(MapScript.toSource(tag.data));
					JSONEdit.refresh();
				}
			},{
				text : "剪切",
				onclick : function(v, tag) {
					Common.setClipboardText(MapScript.toSource(tag.data));
					if (Array.isArray(tag.src)) {
						cd.splice(parseInt(tag.name), 1);
					} else {
						delete tag.src[tag.name];
					}
					JSONEdit.refresh();
				}
			},{
				text : "替换",
				onclick : function(v, tag) {
					JSONEdit.showNewItem(function(newItem) {
						tag.src[tag.name] = newItem;
						JSONEdit.refresh();
					});
				}
			},{
				text : "删除",
				onclick : function(v, tag) {
					if (Array.isArray(tag.src)) {
						tag.src.splice(parseInt(tag.name), 1);
					} else {
						delete tag.src[tag.name];
					}
					JSONEdit.refresh();
				}
			},{
				text : "批量编辑",
				onclick : function(v, tag) {
					JSONEdit.showBatchEdit(tag.data, function(v) {
						tag.src[tag.name] = v;
						JSONEdit.refresh();
					});
				}
			}];
			self.objMenu = [{
				text : "重命名",
				onclick : function(v, tag) {
					Common.showInputDialog({
						title : "重命名",
						callback : function(s) {
							tag.src[s] = tag.src[tag.name];
							delete tag.src[tag.name];
							JSONEdit.refresh();
						},
						defaultValue : tag.name
					});
				}
			}].concat(self.menu);
			self.arrMenu = [{
				text : "插入（上方）",
				onclick : function(v, tag) {
					JSONEdit.showNewItem(function(newItem) {
						tag.src.splice(parseInt(tag.name), 0, newItem);
						JSONEdit.refresh();
					});
				}
			}].concat(self.menu);
		}
		var cd = JSONEdit.path[JSONEdit.path.length - 1].data;
		Common.showOperateDialog(Array.isArray(cd) ? self.arrMenu : JSONEdit.isObject(cd) ? self.objMenu : obj.menu, {
			name : name,
			src : cd,
			data : cd[name]
		});
	},
	pathClick : new G.View.OnClickListener({onClick : function(v) {try {
		var i = JSONEdit.pathbar.indexOfChild(v);
		JSONEdit.path.splice(i + 1);
		JSONEdit.refresh();
	} catch(e) {erp(e)}}}),
	viewMaker : function(holder, par) {
		var hl, vl, name, data, more;
		hl = new G.LinearLayout(ctx);
		hl.setOrientation(G.LinearLayout.HORIZONTAL);
		hl.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
		hl.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
		vl = new G.LinearLayout(ctx);
		vl.setOrientation(G.LinearLayout.VERTICAL);
		vl.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2, 1.0));
		vl.getLayoutParams().gravity = G.Gravity.CENTER;
		name = holder.name = new G.TextView(ctx);
		name.setEllipsize(G.TextUtils.TruncateAt.END);
		name.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		Common.applyStyle(name, "textview_default", 3);
		vl.addView(name);
		data = holder.data = new G.TextView(ctx);
		data.setMaxLines(2);
		data.setEllipsize(G.TextUtils.TruncateAt.END);
		data.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		Common.applyStyle(data, "textview_prompt", 1);
		vl.addView(data);
		hl.addView(vl);
		more = new G.TextView(ctx);
		more.setText(">");
		more.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
		more.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2, 0));
		more.getLayoutParams().gravity = G.Gravity.CENTER;
		Common.applyStyle(more, "button_secondary", 4);
		more.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			JSONEdit.showItemAction(holder.e);
		} catch(e) {erp(e)}}}));
		hl.addView(more);
		return hl;
	},
	viewBinder : function(holder, e, i, a, par) {
		holder.name.setText(Array.isArray(par) && !JSONEdit.showAll ? "#" + (parseInt(e) + 1) : String(e));
		holder.data.setText(JSONEdit.getDesp(par[e]));
		holder.e = e;
	},
	getDesp : function(o) {
		try {
			if (Array.isArray(o)) {
				return o.length ? o[0] + "等" + o.length + "个项目" : "0个项目";
			} else if (o instanceof Object && typeof o !== "function" && !(o instanceof java.lang.String)) {
				return this.listItems(o).length + "个键值对";
			} else if (o === null) {
				return "空引用(null)";
			} else return String(o);
		} catch(e) {
			return "<未知的项目>";
		}
	},
	refresh : function() {G.ui(function() {try {
		var lbl, i, e, ci = JSONEdit.path[JSONEdit.path.length - 1], cd = ci.data, items;
		JSONEdit.pathbar.removeAllViews();
		for (i in JSONEdit.path) {
			e = JSONEdit.path[i];
			lbl = new G.TextView(ctx);
			lbl.setText(String(e.name));
			lbl.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			lbl.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			lbl.setOnClickListener(JSONEdit.pathClick);
			Common.applyStyle(lbl, "item_default", 2);
			JSONEdit.pathbar.addView(lbl);
		}
		items =  JSONEdit.listItems(cd);
		//items.sort();
		JSONEdit.list.setAdapter(new SimpleListAdapter(items, JSONEdit.viewMaker, JSONEdit.viewBinder, cd));
		JSONEdit.list.post(function() {try {
			JSONEdit.list.setSelection(ci.pos);
		} catch(e) {erp(e)}});
	} catch(e) {erp(e)}})},
	traceGlobal : function() {
		this.show({
			source : eval.call(null, "this"),
			rootname : "全局对象",
			showAll : true
		});
	},
	trace : function(obj) {
		this.show({
			source : obj,
			rootname : "Trace",
			showAll : true
		});
	}
});