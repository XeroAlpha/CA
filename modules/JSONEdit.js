MapScript.loadModule("JSONEdit", {
	edit : null,
	pathbar : null,
	list : null,
	path : [],
	clipboard : undefined,
	showAll : false,
	listItems : Object.keys,
	isObject : function(o) {
		return o instanceof Object;
	},
	onCreate : function() {
		Intl.mapNamespace(this, "intl", "jsonEdit");
	},
	show : function(o) {
		var i;
		o = Object(o);
		var name = o.rootname ? o.rootname : this.intl.root;
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
			if (o instanceof java.lang.CharSequence) return false;
			return typeof o == "object" || typeof o == "function";
		} : function(o) {
			return o instanceof Object;
		};
		if (!this.isObject(o.source)) {
			this.showData(this.intl.resolve("editData", name), data, function(newValue) {
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
			self.intl = Intl.getNamespace("jsonEdit.main");
			self.saveMenu = [{
				text : self.intl.edit,
				description : self.intl.edit_desc,
				onclick : function(v, tag) {
					if (!JSONEdit.show(tag.par)) {
						Common.toast(self.intl.nowhereEditable);
						return true;
					}
				}
			}, {
				text : self.intl.copy,
				description : self.intl.copy_desc,
				onclick : function(v, tag) {
					Common.setClipboardText(JSON.stringify(tag.data, null, "\t"));
					Common.toast(self.intl.copy_success);
				}
			}, {
				text : self.intl.save,
				description : self.intl.save_desc,
				hidden : function(tag) {
					return !tag.path;
				},
				onclick : function(v, tag) {
					try {
						MapScript.saveJSON(tag.path, tag.data);
						Common.toast(self.intl.save_success);
					} catch(e) {
						Common.toast(self.intl.resolve("save_failed", e));
					}
					return true;
				}
			}, {
				text : self.intl.saveAs,
				description : self.intl.saveAs_desc,
				onclick : function(v, tag) {
					Common.showFileDialog({
						type : 1,
						callback : function(f) {
							try {
								MapScript.saveJSON(tag.path = f.result.getAbsolutePath(), tag.data);
								Common.toast(self.intl.saveAs_success);
							} catch(e) {
								Common.toast(self.intl.resolve("save_failed", e));
							}
						}
					});
					return true;
				}
			}, {
				text : Common.intl.close,
				onclick : function(v, tag) {}
			}];
			self.menu = [{
				text : self.intl.new,
				description : self.intl.new_desc,
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
			}, {
				text : self.intl.open,
				description : self.intl.open_desc,
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
								Common.toast(JSONEdit.intl.resolve("invaildJSON", e));
							}
						}
					});
				}
			}, {
				text : Common.intl.close,
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
			self.back.setText("< " + Common.intl.back);
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
			self.create.setText(JSONEdit.intl.addItem);
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
								title : JSONEdit.intl.inputKeyName,
								callback : function(s) {
									if (!s) {
										Common.toast(JSONEdit.intl.keyNameEmpty);
									} else if (s in data) {
										Common.toast(JSONEdit.intl.keyNameExists);
									} else {
										try {
											data[s] = newItem;
										} catch(e) {
											Common.toast(e);
										}
										JSONEdit.refresh();
									}
								}
							});
						} else {
							Common.toast(JSONEdit.intl.unableToInsert);
						}
					});
					return true;
				}

				var name = parent.getAdapter().getItem(pos), data;
				try {
					data = JSONEdit.path[JSONEdit.path.length - 1].data[name];
				} catch(e) {
					Common.toast(e);
				}
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
					JSONEdit.showData(JSONEdit.intl.resolve("editData", name), data, function(newValue) {
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
				JSONEdit.list.setVerticalScrollbarPosition(G.View.SCROLLBAR_POSITION_LEFT);
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
			ret.setText(JSONEdit.intl.booleanCheckbox);
		} else {
			ret = new G.EditText(ctx);
			ret.setText(Common.toString(data));
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
		exit.setText(Common.intl.ok);
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
						Common.toast(JSONEdit.intl.irregularNumber);
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
	showRawEdit : function(data, callback) {G.ui(function() {try {
		var frame, layout, title, text, ret, exit, popup, datastr;
		try {
			datastr = JSONEdit.showAll ? MapScript.toSource(data) : JSON.stringify(data, null, 4);
		} catch(e) {
			Log.e(e);
		}
		if (!datastr) {
			Common.toast(JSONEdit.intl.cannotStringify);
			return;
		}
		layout = new G.LinearLayout(ctx);
		layout.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1, G.Gravity.CENTER));
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
		Common.applyStyle(layout, "message_bg");
		layout.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {
			return true;
		}}));
		ret = new G.EditText(ctx);
		ret.setText(datastr);
		ret.setSingleLine(false);
		ret.setGravity(G.Gravity.LEFT | G.Gravity.TOP);
		ret.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1.0));
		Common.applyStyle(ret, "edittext_default", 2);
		layout.addView(ret);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText(Common.intl.ok);
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
					Common.toast(JSONEdit.intl.resolve("cannotParse", e));
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
			self.intl = Intl.getNamespace("jsonEdit.type");
			self.menu = [{
				text : self.intl.emptyObject,
				description : self.intl.object_desc,
				onclick : function(v, tag) {
					tag.callback({});
				}
			}, {
				text : self.intl.emptyArray,
				description : self.intl.array_desc,
				onclick : function(v, tag) {
					tag.callback([]);
				}
			}, {
				text : self.intl.string,
				description : self.intl.string_desc,
				onclick : function(v, tag) {
					JSONEdit.showData(JSONEdit.intl.resolve("newValue", self.intl.string), "", function(newValue) {
						tag.callback(newValue);
					});
				}
			}, {
				text : self.intl.number,
				description : self.intl.number_desc,
				onclick : function(v, tag) {
					JSONEdit.showData(JSONEdit.intl.resolve("newValue", self.intl.number), 0, function(newValue) {
						tag.callback(newValue);
					});
				}
			}, {
				text : self.intl.boolean,
				description : self.intl.boolean_desc,
				onclick : function(v, tag) {
					JSONEdit.showData(JSONEdit.intl.resolve("newValue", self.intl.boolean), true, function(newValue) {
						tag.callback(newValue);
					});
				}
			}, {
				text : self.intl.null,
				description : self.intl.null_desc,
				onclick : function(v, tag) {
					tag.callback(null);
				}
			}, {
				gap : G.dp * 10
			}, {
				text : self.intl.clipboard,
				description : self.intl.clipboard_desc,
				onclick : function(v, tag) {
					if (!JSONEdit.clipboard) {
						Common.toast(JSONEdit.intl.emptyClipboard);
						return true;
					}
					tag.callback(Object.copy(JSONEdit.clipboard.item));
				}
			}, {
				text : self.intl.raw,
				description : self.intl.raw_desc,
				onclick : function(v, tag) {
					Common.showInputDialog({
						title : self.intl.manualInput_desc,
						callback : function(s) {
							try {
								tag.callback(JSON.parse(s));
							} catch(e) {
								Common.toast(JSONEdit.intl.resolve("cannotParse", e));
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
			self.intl = Intl.getNamespace("jsonEdit.itemMenu");
			self.menu = [{
				text : self.intl.copy,
				onclick : function(v, tag) {
					JSONEdit.clipboard = {
						name : tag.name,
						item : tag.data
					};
					JSONEdit.refresh();
				}
			}, {
				text : self.intl.cut,
				onclick : function(v, tag) {
					JSONEdit.clipboard = {
						name : tag.name,
						item : tag.data
					};
					if (Array.isArray(tag.src)) {
						cd.splice(parseInt(tag.name), 1);
					} else {
						delete tag.src[tag.name];
					}
					JSONEdit.refresh();
				}
			}, {
				text : self.intl.replace,
				onclick : function(v, tag) {
					JSONEdit.showNewItem(function(newItem) {
						try {
							tag.src[tag.name] = newItem;
						} catch(e) {
							Common.toast(e);
						}
						JSONEdit.refresh();
					});
				}
			}, {
				text : self.intl.remove,
				onclick : function(v, tag) {
					if (Array.isArray(tag.src)) {
						tag.src.splice(parseInt(tag.name), 1);
					} else {
						delete tag.src[tag.name];
					}
					JSONEdit.refresh();
				}
			}, {
				text : self.intl.rawEdit,
				onclick : function(v, tag) {
					JSONEdit.showRawEdit(tag.data, function(v) {
						try {
							tag.src[tag.name] = v;
						} catch(e) {
							Common.toast(e);
						}
						JSONEdit.refresh();
					});
				}
			}];
			self.objMenu = [{
				text : self.intl.rename,
				onclick : function(v, tag) {
					Common.showInputDialog({
						title : self.intl.rename,
						callback : function(s) {
							try {
								tag.src[s] = tag.src[tag.name];
								delete tag.src[tag.name];
							} catch(e) {
								Common.toast(e);
							}
							JSONEdit.refresh();
						},
						defaultValue : tag.name
					});
				}
			}].concat(self.menu);
			self.arrMenu = [{
				text : self.intl.insertBefore,
				onclick : function(v, tag) {
					JSONEdit.showNewItem(function(newItem) {
						tag.src.splice(parseInt(tag.name), 0, newItem);
						JSONEdit.refresh();
					});
				}
			}].concat(self.menu);
		}
		var cd = JSONEdit.path[JSONEdit.path.length - 1].data, data;
		try {
			data = JSONEdit.path[JSONEdit.path.length - 1].data[name];
		} catch(e) {
			Common.toast(e);
		}
		Common.showOperateDialog(Array.isArray(cd) ? self.arrMenu : JSONEdit.isObject(cd) ? self.objMenu : obj.menu, {
			name : name,
			src : cd,
			data : data
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
		holder.data.setText(JSONEdit.getDesp(par, e));
		holder.e = e;
	},
	getDesp : function(obj, propertyName) {
		var e;
		try {
			e = obj[propertyName];
			if (Array.isArray(e)) {
				return e.length ? JSONEdit.intl.resolve("arrayDesc", e[0], e.length) : JSONEdit.intl.emptyArrayDesc;
			} else if (e instanceof Object && typeof e !== "function" && !(e instanceof java.lang.CharSequence)) {
				return JSONEdit.intl.resolve("objectDesc", this.listItems(e).length);
			} else if (e === null) {
				return JSONEdit.intl.nullDesc;
			} else return String(e);
		} catch(er) {
			Log.e(er);
			return String(er);
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
			rootname : "Global object",
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