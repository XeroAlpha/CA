MapScript.loadModule("PopupWindow", (function() {
	var id = 0;
	var r = function(mainView, name) {
		this.mainView = mainView;
		this.name = name || ("Unnamed@" + id);
		this.id = id++;
		this.listener = {};
		this.attributes = {
			x : 0, y : 0,
			height : -2, width : -2,
			gravity : G.Gravity.START | G.Gravity.TOP,
			touchable : true,
			focusable : true,
			modal : false,
			needIME : undefined, //三种模式 true false undefined(default)
			outsideTouch : false
		};
		this.init();
	}
	if (MapScript.host == "Android") {
		r.prototype = {
			init : function() {
				var self = this;
				this.decorView = ScriptInterface.createFrameLayout({
					dispatchKeyEvent : function(event) {
						var state = r.defaultWindow.getKeyDispatcherState();
						if (event.getKeyCode() == event.KEYCODE_BACK) {
							if (!state) return 0;
							if (event.getAction() == event.ACTION_DOWN && event.getRepeatCount() == 0) {
								state.startTracking(event, self.decorView);
								return 1;
							} else if (event.getAction() == event.ACTION_UP) {
								if (state.isTracking(event) && !event.isCanceled()) {
									if (!self.attributes.modal) self.hide();
									return 1;
								}
							}
						}
						return 0;
					},
					dispatchTouchEvent : function(e) {
						var consumed = false;
						self.trigger("touch", e, function() {
							consumed = true;
						});
						return consumed ? 1 : 0;
					}
				});
				this.decorView.setContentDescription("PopupWindow@" + this.name + "/" + this.id);
			},
			show : function(attr) {
				if (this.showing) return this;
				this.trigger("show");
				this.showing = true;
				if (attr) this.attr(attr);
				this.decorView.addView(this.mainView, new G.FrameLayout.LayoutParams(this.attributes.width == -2 ? -2 : -1, this.attributes.height == -2 ? -2 : -1));
				r.showView(this.decorView, this.attributes);
				return this;
			},
			hide : function() {
				var self = this;
				if (!this.showing) return this;
				this.trigger("hide");
				this.showing = false;
				r.hideView(this.decorView);
				this.decorView.removeView(this.mainView);
				return this;
			},
			update : function(attr) {
				if (attr) this.attr(attr);
				if (this.showing) {
					r.updateView(this.decorView, this.attributes);
				}
				return this;
			},
			bringToFront : function() {
				if (this.showing) {
					PWM.wm.removeViewImmediate(this.decorView);
					PWM.wm.addView(this.decorView, this.decorView.getLayoutParams());
				}
			},
			getWidth : function() {
				return this.mainView.getWidth();
			},
			getHeight : function() {
				return this.mainView.getHeight();
			},
			getMetrics : function() {
				return [this.getWidth(), this.getHeight()];
			}
		}
		r.buildLayoutParams = function(view, attributes) {
			var p = view.getLayoutParams() || new G.WindowManager.LayoutParams(), title = view.getContentDescription();
			p.gravity = attributes.gravity;
			p.flags = r.computeFlags(attributes, p.flags);
			p.type = G.supportFloat ? (android.os.Build.VERSION.SDK_INT >= 26 ? G.WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : G.WindowManager.LayoutParams.TYPE_PHONE) : G.WindowManager.LayoutParams.TYPE_APPLICATION_PANEL;
			if (ctx instanceof android.app.Activity) p.token = ctx.getWindow().getDecorView().getWindowToken();
			p.format = G.PixelFormat.TRANSLUCENT;
			p.height = attributes.height;
			p.width = attributes.width;
			p.x = attributes.x;
			p.y = attributes.y;
			if (title) p.setTitle(title);
			return p;
		}
		r.computeFlags = function(w, f) {
			var c = G.WindowManager.LayoutParams;
			f &= ~(c.FLAG_NOT_FOCUSABLE | c.FLAG_NOT_TOUCHABLE | c.FLAG_WATCH_OUTSIDE_TOUCH | c.FLAG_ALT_FOCUSABLE_IM);
			if (!w.touchable) f |= c.FLAG_NOT_TOUCHABLE;
			if (!w.focusable) {
				f |= c.FLAG_NOT_FOCUSABLE;
				if (w.needIME) f |= c.FLAG_ALT_FOCUSABLE_IM;
			} else {
				if (w.needIME == false) f |= c.FLAG_ALT_FOCUSABLE_IM
			}
			if (w.outsideTouch) f |= c.FLAG_WATCH_OUTSIDE_TOUCH;
			return f;
		}
		r.showView = function(view, attributes) {
			PWM.wm.addView(view, r.buildLayoutParams(view, attributes));
		};
		r.hideView = function(view) {
			PWM.wm.removeViewImmediate(view);
		};
		r.updateView = function(view, attributes) {
			PWM.wm.updateViewLayout(view, r.buildLayoutParams(view, attributes));
		};
	} else { //暂不维护
		r.prototype = {
			init : function() {
				var self = this;
				this.popupWnd = new G.PopupWindow(ctx);
				this.popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
					self.trigger("hide");
				} catch(e) {erp(e)}}}));
			},
			show : function(attr) {
				if (attr) this.attr(attr);
				r.configueWnd(this.popupWnd, this.attributes);
				this.popupWnd.showAtLocation(ctx.getWindow().getDecorView(), this.attributes.gravity, this.attributes.x, this.attributes.y);
				return this;
			},
			hide : function() {
				this.popupWnd.showAtLocation(ctx.getWindow().getDecorView(), this.attributes.gravity, this.attributes.x, this.attributes.y);
				return this;
			},
			update : function(attr) {
				if (attr) this.attr(attr);
				if (this.showing) {
					r.updateView(this.decorView, this.attributes);
				}
				return this;
			},
			bringToFront : function() {
				if (!this.popupWnd.isShowing()) return;
				var v = this.popupWnd.getContentView(), wp;
				if (!this.popupWnd) return;
				v = v.getRootView();
				wp = v.getLayoutParams();
				PWM.wm.removeViewImmediate(v);
				PWM.wm.addView(v, wp);
			},
			getWidth : function() {
				return this.mainView.getWidth();
			},
			getHeight : function() {
				return this.mainView.getHeight();
			},
			getMetrics : function() {
				return [this.getWidth(), this.getHeight()];
			}
		}
		r.configueWnd = function(popup, attrs) {
			popup.setWindowLayoutType(G.supportFloat ? (android.os.Build.VERSION.SDK_INT >= 26 ? G.WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : G.WindowManager.LayoutParams.TYPE_PHONE) : G.WindowManager.LayoutParams.TYPE_APPLICATION_PANEL);
			popup.setHeight(attrs.height);
			popup.setWidth(attrs.width);
			popup.setTouchable(attrs.touchable);
			popup.setFocusable(attrs.focusable);
			popup.setOutsideTouchable(attrs.outsideTouch);
			popup.setInputMethodMode(attrs.needIME ? popup.INPUT_METHOD_NEEDED : attrs.needIME == false ? popup.INPUT_METHOD_NOT_NEEDED : popup.INPUT_METHOD_FROM_FOCUSABLE);
		}
	}
	r.applyAttributes = function(target, source) {
		var i;
		for (i in target) {
			if (i in source) target[i] = source[i];
		}
	}
	r.prototype.attr = function(name, value) {
		if (arguments.length == 1) {
			if (typeof name == "object") {
				r.applyAttributes(this.attributes, name);
			} else {
				return this.attributes[name];
			}
		} else if (arguments.length > 1) {
			return this.attributes[name] == value;
		}
	}
	r.prototype.toString = function() {
		return "[PopupWindow " + this.name + "/" + this.id + "]";
	}
	EventSender.init(r.prototype);
	return r;
})());