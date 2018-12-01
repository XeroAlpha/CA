MapScript.loadModule("PopupPage", (function() {
	var id = 0;
	var r = function(mainView, name, modal) {
		this.mainView = mainView;
		this.name = name || ("Unnamed@" + id);
		this.id = id++;
		this.modal = modal;
		this._enterAnimation = r.fadeInAnimation;
		this._exitAnimation = r.fadeOutAnimation;
		this.listener = {};
		this.init();
	}
	if (MapScript.host == "Android") {
		r.fullscreen = true;
		r.focusable = true;
		r.initialize = function() {G.ui(function() {try {
			var vcfg = G.ViewConfiguration.get(ctx);
			var longPressTimeout = vcfg.getLongPressTimeout();
			var touchSlop = vcfg.getScaledTouchSlop();
			r.defaultWindow = ScriptActivity.createFrameLayout({
				dispatchKeyEvent : function(event) {
					var state = r.defaultWindow.getKeyDispatcherState();
					if (event.getKeyCode() == event.KEYCODE_BACK) {
						if (!state) return 0;
						if (event.getAction() == event.ACTION_DOWN && event.getRepeatCount() == 0) {
							state.startTracking(event, this);
							return 1;
						} else if (event.getAction() == event.ACTION_UP) {
							if (state.isTracking(event) && !event.isCanceled()) {
								r.back(r.defaultContainer);
								return 1;
							}
						}
					}
					return 0;
				},
				dispatchTouchEvent : function(e) {
					switch (e.getAction()) {
						case e.ACTION_DOWN:
						if (!r.focusable) {
							r.focusable = true;
							r.resizeView.setVisibility(G.View.VISIBLE);
							r.setFocusable(r.defaultWindow, true);
							r.trigger("focus");
						}
						break;
						case e.ACTION_OUTSIDE:
						if (r.focusable) {
							r.focusable = false;
							r.resizeView.setVisibility(G.View.GONE);
							r.setFocusable(r.defaultWindow, false);
							r.trigger("blur");
						}	
						break;
					}
					return 0;
				}
			});
			r.defaultWindow.setRoundRectRadius(8 * G.dp, 2);
			r.defaultWindow.setContentDescription("DefaultWindow");
			r.longClick = new java.lang.Runnable({run : function() {try {
				if (r.longClicked) r.setFullScreen(true);
				r.longClicked = false;
			} catch(e) {erp(e)}}});
			r.defaultDecorLinear = new G.LinearLayout(ctx);
			r.defaultDecorLinear.setOrientation(G.LinearLayout.VERTICAL);
			r.defaultDecorLinear.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1));
			r.headerView = new G.LinearLayout(ctx);
			r.headerView.setOrientation(G.LinearLayout.HORIZONTAL);
			r.headerView.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			r.titleView = new G.TextView(ctx);
			r.titleView.setText("CA");
			r.titleView.setPadding(5 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
			r.titleView.setSingleLine(true);
			r.titleView.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2, 1));
			r.titleView.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				switch (e.getAction()) {
					case e.ACTION_MOVE:
					if (touch.stead) {
						if (Math.abs(touch.lx - e.getRawX()) + Math.abs(touch.ly - e.getRawY()) < touchSlop) {
							break;
						}
						touch.stead = false;
					}
					r.updateView(r.defaultWindow, r.x = e.getRawX() + touch.offx, r.y = e.getRawY() + touch.offy, r.width, r.height);
					break;
					case e.ACTION_DOWN:
					touch.offx = r.x - (touch.lx = e.getRawX());
					touch.offy = r.y - (touch.ly = e.getRawY());
					touch.stead = true;
					Common.applyStyle(v, "button_reactive_pressed", 2);
					break;
					case e.ACTION_UP:
					case e.ACTION_CANCEL:
					Common.applyStyle(v, "button_reactive", 2);
				}
				return true;
			} catch(e) {return erp(e), false}}}));
			r.headerView.addView(r.titleView);
			r.resizeView = new G.TextView(ctx);
			r.resizeView.setText("■");
			r.resizeView.setPadding(5 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
			r.resizeView.setSingleLine(true);
			r.resizeView.setGravity(G.Gravity.RIGHT);
			r.resizeView.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
			r.resizeView.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				switch (e.getAction()) {
					case e.ACTION_MOVE:
					if (touch.stead) {
						if (Math.abs(touch.lx - e.getRawX()) + Math.abs(touch.ly - e.getRawY()) < touchSlop) {
							break;
						}
						r.longClicked = false;
						touch.stead = false;
					}
					break;
					case e.ACTION_DOWN:
					touch.offwidth = r.width - (touch.lx = e.getRawX());
					touch.offheight = r.height + (touch.ly = e.getRawY());
					touch.offy = r.y - touch.ly;
					touch.stead = true;
					v.postDelayed(r.longClick, longPressTimeout);
					r.longClicked = true;
					Common.applyStyle(v, "button_reactive_pressed", 2);
					//r.defaultStub.setVisibility(G.View.VISIBLE);
					//r.defaultContainer.setVisibility(G.View.GONE);
					break;
					case e.ACTION_UP:
					case e.ACTION_CANCEL:
					r.longClicked = false;
					Common.applyStyle(v, "button_reactive", 2);
					//r.defaultStub.setVisibility(G.View.GONE);
					//r.defaultContainer.setVisibility(G.View.VISIBLE);
					r.updateView(r.defaultWindow, r.x,
						r.y = e.getRawY() + touch.offy,
						r.width = Math.max(e.getRawX() + touch.offwidth, r.minWidth),
						r.height = Math.max(touch.offheight - e.getRawY(), r.minHeight));
					r.trigger("resize");
				}
				return true;
			} catch(e) {return erp(e), false}}}));
			r.headerView.addView(r.resizeView);
			r.headerView.measure(0, 0);
			r.minWidth = r.headerView.getMeasuredWidth();
			r.minHeight = r.headerView.getMeasuredHeight();
			r.defaultDecorLinear.addView(r.headerView);
			r.defaultContainer = new G.FrameLayout(ctx);
			r.defaultContainer.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -1));
			r.defaultContainer.addOnLayoutChangeListener(new G.View.OnLayoutChangeListener({onLayoutChange : function(view, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) {try {
				var i, w = right - left, h = bottom - top, ow = oldRight - oldLeft, oh = oldBottom - oldTop;
				if (w == ow && h == oh) return;
				for (i = r.defaultStack.length - 1; i >= 0; i--) {
					e = r.defaultStack[i];
					e.page.trigger("resize", w, h);
				}
			} catch(e) {erp(e)}}}));
			r.defaultDecorLinear.addView(r.defaultContainer);
			//r.defaultStub = new G.FrameLayout(ctx);
			//r.defaultStub.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -1));
			//r.defaultStub.setVisibility(G.View.GONE);
			//r.defaultDecorLinear.addView(r.defaultStub);
			r.defaultWindow.addView(r.defaultDecorLinear);
			r.floatWindow = r.floatContainer = ScriptActivity.createFrameLayout({
				dispatchKeyEvent : function(event) {
					var state = r.floatWindow.getKeyDispatcherState();
					if (event.getKeyCode() == event.KEYCODE_BACK) {
						if (!state) return 0;
						if (event.getAction() == event.ACTION_DOWN && event.getRepeatCount() == 0) {
							state.startTracking(event, this);
							return 1;
						} else if (event.getAction() == event.ACTION_UP) {
							if (state.isTracking(event) && !event.isCanceled()) {
								r.back(r.defaultContainer);
								return 1;
							}
						}
					}
					return 0;
				},
				dispatchTouchEvent : function(event) {
					return 0;
				}
			});
			r.floatWindow.setContentDescription("FloatWindow");
			r.floatContainer.addOnLayoutChangeListener(new G.View.OnLayoutChangeListener({onLayoutChange : function(view, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) {try {
				var i, w = right - left, h = bottom - top, ow = oldRight - oldLeft, oh = oldBottom - oldTop;
				if (w == ow && h == oh) return;
				for (i = r.floatStack.length - 1; i >= 0; i--) {
					e = r.floatStack[i];
					e.page.trigger("resize", w, h);
				}
			} catch(e) {erp(e)}}}));
			r.thread = java.lang.Thread.currentThread();
		} catch(e) {erp(e)}})}
		r.checkThread = function() {
			if (r.thread != java.lang.Thread.currentThread()) {
				Log.throwError(new Error("You can only touch page on the main thread."));
			}
		}
		r.updateDefault = function() {
			if (this.fullscreen) {
				this.headerView.setVisibility(G.View.GONE);
			} else {
				Common.applyStyle(this.headerView, "bar_float_second");
				Common.applyStyle(r.titleView, "button_reactive", 2);
				Common.applyStyle(r.resizeView, "button_reactive", 2);
				//Common.applyStyle(r.defaultStub, "container_default");
				this.headerView.setVisibility(G.View.VISIBLE);
			}
		}
		r.setFullScreen = function(isFullScreen) {
			if (isFullScreen) {
				this.fullscreen = true;
				this.updateView(this.defaultWindow, 0, 0, -1, -1);
				r.updateDefault();
			} else {
				if (isNaN(r.x)) this.initPosition();
				this.fullscreen = false;
				this.updateView(this.defaultWindow, r.x, r.y, r.width, r.height);
				r.updateDefault();
			}
			r.trigger("fullscreenChanged", isFullScreen);
		}
		r.isFullScreen = function(bool) {
			return this.fullscreen;
		}
		r.initPosition = function() {
			var metrics = Common.getMetrics();
			this.x = metrics[0] * 0.25;
			this.y = metrics[1] * 0.25;
			this.width = metrics[0] * 0.5;
			this.height = metrics[1] * 0.5;
		}
		r.defaultVisible = false;
		r.floatVisible = false;
		r.defaultStack = [];
		r.floatStack = [];
		r.visible = true;
		r.prototype = {
			init : function() {},
			enter : function(noAnimation) {
				var self = this;
				if (this.showing) return this;
				this.showing = true;
				r.showPage(this);
				r.pushPage(this.name, this);
				if (!noAnimation && this._enterAnimation) {
					this.currentAnimation = this._enterAnimation(this.mainView, function() {
						this.currentAnimation = null;
						r.pageShown(self);
					});
				}
				return this;
			},
			exit : function(noAnimation) {
				var self = this;
				if (!this.currentContainer) return this;
				r.popPage(this);
				this.showing = false;
				if (!noAnimation && this._exitAnimation) {
					this.currentAnimation = this._exitAnimation(this.mainView, function() {
						this.currentAnimation = null;
						self.dismiss();
					});
				} else {
					this.dismiss();
				}
				return this;
			},
			resizable : function() {
				return this.currentContainer == r.defaultContainer;
			},
			dismiss : function() {
				if (!this.currentContainer) return this;
				r.hidePage(this);
				r.trigger("pageHide", this);
				return this;
			},
			requestShow : function() {
				this.mainView.setVisibility(G.View.VISIBLE);
				return this;
			},
			requestHide : function() {
				this.mainView.setVisibility(G.View.GONE);
				return this;
			},
			getWidth : function() {
				return this.currentContainer.getWidth();
			},
			getHeight : function() {
				return this.currentContainer.getHeight();
			},
			getMetrics : function() {
				return [this.getWidth(), this.getHeight()];
			}
		}
		r.buildLayoutParams = function(view, x, y, width, height) {
			var p = view.getLayoutParams() || new G.WindowManager.LayoutParams(), title = view.getContentDescription();
			p.gravity = G.Gravity.LEFT | G.Gravity.TOP;
			p.flags |= p.FLAG_NOT_TOUCH_MODAL | p.FLAG_WATCH_OUTSIDE_TOUCH;
			p.type = CA.supportFloat ? (android.os.Build.VERSION.SDK_INT >= 26 ? G.WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : G.WindowManager.LayoutParams.TYPE_PHONE) : G.WindowManager.LayoutParams.TYPE_APPLICATION_PANEL;
			p.token = ctx.getWindow().getDecorView().getWindowToken();
			p.format = G.PixelFormat.TRANSLUCENT;
			p.height = height;
			p.width = width;
			p.x = x;
			p.y = y;
			if (title) p.setTitle(title);
			return p;
		}
		r.setFocusable = function(view, focusable) {
			var p = view.getLayoutParams() || new G.WindowManager.LayoutParams();
			if (focusable) {
				p.flags &= ~p.FLAG_NOT_FOCUSABLE;
			} else {
				p.flags |= p.FLAG_NOT_FOCUSABLE;
			}
			PWM.wm.updateViewLayout(view, p);
		}
		r.showView = function(view, x, y, width, height) {
			PWM.wm.addView(view, r.buildLayoutParams(view, x, y, width, height));
		};
		r.hideView = function(view) {
			PWM.wm.removeViewImmediate(view);
		};
		r.updateView = function(view, x, y, width, height) {
			PWM.wm.updateViewLayout(view, r.buildLayoutParams(view, x, y, width, height));
		};
		r.back = function(source) {
			var stack = source == r.floatContainer ? r.floatStack : r.defaultStack, cancelEvent = false;
			if (stack.length) {
				stack[stack.length - 1].page.trigger("back", function() {
					cancelEvent = true;
				});
				if (!cancelEvent) stack[stack.length - 1].page.exit();
			}
		}
		r.showPage = function(page) {
			r.checkThread();
			if (page.currentContainer) page.currentContainer.removeView(page.mainView);
			page.currentContainer = this.visible ? this.defaultContainer : this.floatContainer;
			page.currentContainer.addView(page.mainView);
			if (this.visible && !this.defaultVisible) {
				if (this.fullscreen) {
					this.showView(this.defaultWindow, 0, 0, -1, -1);
					r.updateDefault();
				} else {
					if (isNaN(r.x)) this.initPosition();
					this.showView(this.defaultWindow, r.x, r.y, r.width, r.height);
					r.updateDefault();
				}
				this.defaultVisible = true;
				this.updateOverlays();
				this.trigger("addPopup");
			} else if (!this.visible && !this.floatVisible) {
				this.showView(this.floatWindow, 0, 0, -1, -1);
				this.floatVisible = true;
				this.updateOverlays();
				this.trigger("addPopup");
			}
		}
		r.hidePage = function(page, notRemoveWindow) {
			r.checkThread();
			var stack = page.currentContainer == this.floatContainer ? this.floatStack : this.defaultStack;
			page.currentContainer.removeView(page.mainView);
			if (stack.length == 0 && !notRemoveWindow) {
				if (page.currentContainer == this.defaultContainer && this.defaultVisible) {
					this.hideView(this.defaultWindow);
					this.trigger("removePopup");
					this.defaultVisible = false;
					this.updateOverlays();
					if (!this.visible) this.show();
				} else if (page.currentContainer == this.floatContainer && this.floatVisible) {
					this.hideView(this.floatWindow);
					this.trigger("removePopup");
					this.floatVisible = false;
					this.updateOverlays();
				}
			}
		}
		r.pushPage = function(name, page) {
			var t, stack = page.currentContainer == this.floatContainer ? this.floatStack : this.defaultStack;
			if (this.busy) return;
			if (stack.length) {
				t = stack[stack.length - 1];
				t.page.trigger("pause");
				TCAgent.onPageEnd(ctx, t.name);
			}
			stack.push(t = {
				name : name,
				page : page
			});
			page.trigger("enter");
			TCAgent.onPageStart(ctx, name);
			this.trigger("pushPage", name, page);
		}
		r.popPage = function(page) {
			var t, i, stack = page.currentContainer == this.floatContainer ? this.floatStack : this.defaultStack;
			if (this.busy) return;
			for (i = stack.length - 1; i >= 0; i--) {
				if (stack[i].page != page) continue;
				t = stack[i];
				stack.splice(i, 1);
				t.page.trigger("exit");
				TCAgent.onPageEnd(ctx, t.name);
				if (i > 0 && this.visible) {
					t = stack[i - 1];
					t.page.trigger("resume");
					TCAgent.onPageStart(ctx, t.name);
					while (--i >= 0) {
						stack[i].page.requestShow();
						if (!stack[i].page.dialog) break;
					}
				}
				break;
			}
			this.trigger("popPage", page);
		}
		r.pageShown = function(page) {
			var i, stack = page.currentContainer == this.floatContainer ? this.floatStack : this.defaultStack;
			if (stack.length > 1) {
				if (!page.dialog) {
					i = stack.length - 1;
					while (i-- > 0) stack[i].page.requestHide();
				}
			}
			this.trigger("pageShown", page);
		}
		r.show = function() {
			var i, e;
			if (this.visible) return;
			this.visible = true;
			r.checkThread();
			if (this.floatStack.length) {
				this.hideView(this.floatWindow);
				this.floatVisible = false;
				for (i = 0; i < this.floatStack.length; i++) {
					this.showPage(this.floatStack[i].page);
					this.defaultStack.push(this.floatStack[i]);
				}
				this.floatStack.length = 0;
			} else {
				if (this.defaultStack.length) this.defaultStack[this.defaultStack.length - 1].page.trigger("resume");
			}
			this.defaultWindow.setVisibility(G.View.VISIBLE);
			this.updateOverlays();
			this.trigger("show");
		}
		r.hide = function() {
			var i, e;
			if (!this.visible) return;
			r.checkThread();
			if (this.defaultStack.length) this.defaultStack[this.defaultStack.length - 1].page.trigger("pause");
			this.defaultWindow.setVisibility(G.View.GONE);
			this.visible = false;
			this.updateOverlays();
			this.trigger("hide");
		}
		r.dismiss = function() {
			var i, e;
			r.checkThread();
			this.busy = true;
			for (i = this.floatStack.length - 1; i >= 0; i--) {
				e = this.floatStack[i];
				e.page.trigger("exit");
				TCAgent.onPageEnd(ctx, e.name);
				this.hidePage(e.page, true);
				e.page.showing = false;
			}
			for (i = this.defaultStack.length - 1; i >= 0; i--) {
				e = this.defaultStack[i];
				e.page.trigger("exit");
				TCAgent.onPageEnd(ctx, e.name);
				this.hidePage(e.page, true);
				e.page.showing = false;
			}
			this.defaultStack.length = this.floatStack.length = 0;
			if (this.defaultVisible) {
				this.hideView(this.defaultWindow);
				this.trigger("removePopup");
				this.defaultVisible = false;
			}
			if (this.floatVisible) {
				this.hideView(this.floatWindow);
				this.trigger("removePopup");
				this.floatVisible = false;
			}
			this.updateOverlays();
			this.busy = false;
			this.trigger("dismiss");
		}
		r.reset = function() {
			this.dismiss();
			this.trigger("reset");
			this.clearListeners();
		}
		r.getCount = function() {
			return this.defaultStack.length + this.floatStack.length;
		}
		r.debug = function() {
			var s = [];
			s.push("PageManager[visible=" + this.visible + "]");
			s.push("DefaultWindowPageManager[showing=" + this.defaultVisible + ",fullscreen=" + this.fullscreen + "]");
			this.defaultStack.forEach(function(e, i) {
				s.push(i + ":" + e.name + "[" +
					(e.page.modal ? "M" : "") +
					"]" + e.page.mainView);
			});
			s.push("FloatWindowPageManager[showing=" + this.floatVisible + ",fullscreen=true]");
			this.floatStack.forEach(function(e, i) {
				s.push(i + ":" + e.name + "[" +
					(e.page.modal ? "M" : "") +
					"]" + e.page.mainView);
			});
			return s.join("\n");
		}
		r.getActiveContainer = function() {
			return this.floatVisible ? this.floatContainer : this.defaultVisible && this.visible ? this.defaultContainer : null;
		}
		r.supportResize = true;
	} else {
		r.isFullScreen = function() {
			return true;
		}
		r.prototype = {
			init : function() {
				var self = this;
				this.popup = new G.PopupWindow(this.mainView, -1, -1);
				this.popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
					r.popPage(self);
					self.showing = false;
				} catch(e) {erp(e)}}}));
				if (!this.modal) this.popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
				this.popup.setFocusable(true);
				this.popup.setSoftInputMode(G.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
				Common.applyPopup(this.popup);
			},
			enter : function(noAnimation) {
				var self = this;
				if (this.showing) this.popup.dismiss();
				this.popup.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.LEFT | G.Gravity.TOP, 0, 0);
				if (!noAnimation && this._enterAnimation) {
					this._enterAnimation(this.mainView, function() {
						r.pushPage(self.name, self);
					});
				} else {
					r.pushPage(this.name, this);
				}
				this.showing = true;
				return this;
			},
			exit : function(noAnimation) {
				var self = this;
				if (!this.showing) return this;
				if (!noAnimation && this._exitAnimation) {
					this._exitAnimation(this.mainView, function() {
						self.popup.dismiss();
					});
				} else {
					this.popup.dismiss();
				}
				return this;
			},
			resizable : function() {
				return false;
			},
			dismiss : function() {
				return this.exit(true);
			},
			requestShow : function() {
				this.mainView.getRootView().setVisibility(G.View.VISIBLE);
				return this;
			},
			requestHide : function() {
				this.mainView.getRootView().setVisibility(G.View.GONE);
				return this;
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
		};
		r.visible = true;
		r.stack = [];
		r.pushPage = function(name, page) {
			var t;
			if (this.busy) return;
			if (this.stack.length && this.stack[this.stack.length - 1].visible) {
				this.stack[this.stack.length - 1].page.trigger("pause");
			}
			this.stack.push(t = {
				name : name,
				page : page,
				visible : true
			});
			page.trigger("enter");
			this.trigger("pushPage", name, page);
			this.trigger("addPopup");
		}
		r.popPage = function(page) {
			var i;
			if (this.busy) return;
			for (i = this.stack.length - 1; i >= 0; i--) {
				if (this.stack[i].page != page) continue;
				this.stack.splice(i, this.stack.length - i).forEach(function(e) {
					e.page.trigger("exit");
				}, this);
				if (i > 0 && this.visible) {
					this.stack[i - 1].page.trigger("resume");
				}
				break;
			}
			this.trigger("popPage", page);
			this.trigger("removePopup");
		}
		r.show = function() {
			var i, e;
			if (this.visible) return;
			if (this.stack.length) this.stack[this.stack.length - 1].page.trigger("resume");
			for (i = 0; i < this.stack.length ; i++) {
				e = this.stack[i];
				if (e.visible) continue;
				e.page.requestShow();
				e.visible = true;
			}
			this.visible = true;
			this.trigger("show");
		}
		r.hide = function() {
			var i, e;
			if (!this.visible) return;
			if (this.stack.length) this.stack[this.stack.length - 1].page.trigger("pause");
			for (i = this.stack.length - 1; i >= 0; i--) {
				e = this.stack[i];
				if (!e.visible) continue;
				e.page.requestHide();
				e.visible = false;
			}
			this.visible = false;
			this.trigger("hide");
		}
		r.dismiss = function() {
			var i, e;
			this.busy = true;
			for (i = this.stack.length - 1; i >= 0; i--) {
				e = this.stack[i];
				e.page.trigger("exit");
				e.page.exit();
			}
			this.stack.length = 0;
			this.busy = false;
			this.trigger("dismiss");
		}
		r.reset = function() {
			this.dismiss();
			this.trigger("reset");
			this.clearListeners();
		}
		r.getCount = function() {
			return this.stack.length;
		}
		r.debug = function() {
			var s = [];
			s.push("PopupWindowPageManager[visible=" + this.visible + "]");
			this.stack.forEach(function(e, i) {
				s.push(i + ":" + e.name + "[" +
					(e.visible ? "V" : "") +
					(e.page.showing ? "S" : "") +
					(e.page.modal ? "M" : "") +
					"]" + e.page.mainView);
			});
			return s.join("\n");
		}
		r.getActiveContainer = function() {
			return null;
		}
		r.supportResize = false;
	}
	r.prototype.show = r.enter;
	r.prototype.hide = r.exit;
	r.prototype.enterAnimation = function(f) {
		this._enterAnimation = f;
		return this;
	};
	r.prototype.exitAnimation = function(f) {
		this._exitAnimation = f;
		return this;
	};
	EventSender.init(r.prototype);
	r.listener = {};
	r.isBusy = function() {
		return this.busy;
	};
	r.showDialog = function(name, layout, width, height, modal) {
		var frame, popup, hasMargins = false;
		frame = new G.FrameLayout(ctx);
		frame.setBackgroundColor(Common.argbInt(0x80, 0, 0, 0));
		frame.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
			if (e.getAction() == e.ACTION_DOWN && !modal) {
				if (e.getX() < layout.getLeft() || e.getX() >= layout.getRight() ||
					e.getY() < layout.getTop() || e.getY() >= layout.getBottom()) {
					popup.exit();
				}
			}
			return true;
		} catch(e) {return erp(e), true}}}));
		layout.setLayoutParams(new G.FrameLayout.LayoutParams(width, height, G.Gravity.CENTER));
		frame.addView(layout);
		if (G.style == "Material") layout.setElevation(16 * G.dp);
		popup = new r(frame, name, modal);
		popup.on("resume", function() {
			frame.setBackgroundColor(Common.argbInt(0x80, 0, 0, 0));
		});
		popup.on("pause", function() {
			frame.setBackground(null);
		});
		popup.on("resize", function(event, w, h) {
			var newHasMargins = w > 40 * G.dp && h > 40 * G.dp;
			if (hasMargins == newHasMargins) return;
			hasMargins = newHasMargins;
			if (newHasMargins) {
				layout.getLayoutParams().setMargins(20 * G.dp, 20 * G.dp, 20 * G.dp, 20 * G.dp);
			} else {
				layout.getLayoutParams().setMargins(0, 0, 0, 0);
			}
			layout.requestLayout();
		});
		popup.dialog = true;
		popup.enter();
		popup.trigger("resize", popup.getWidth(), popup.getHeight());
		return popup;
	};
	r.overlays = [];
	r.Overlay = function(view, width, height, gravity, x, y) {
		this.view = view;
		this.width = width || -1;
		this.height = height || -1;
		this.gravity = gravity || (G.Gravity.LEFT | G.Gravity.TOP);
		this.x = x || 0;
		this.y = y || 0;
		this.update();
	}
	r.Overlay.prototype = {
		attach : function(container) {
			if (container) {
				container.addView(this.view, new G.FrameLayout.LayoutParams(this.width, this.height, this.gravity));
				this.view.setTranslationX(this.x);
				this.view.setTranslationY(this.y);
				this.container = container;
			} else {
				this.popup = new G.PopupWindow(this.view, this.width, this.height);
				Common.applyPopup(this.popup);
				this.popup.setFocusable(false);
				this.popup.setTouchable(false);
				this.popup.showAtLocation(ctx.getWindow().getDecorView(), this.gravity, this.x, this.y);
				PWM.addFloat(this.popup);
			}
		},
		detach : function() {
			if (this.popup) {
				if (this.popup.isShowing()) this.popup.dismiss();
				this.popup = null;
			}
			if (this.container) {
				this.container.removeView(this.view);
				this.container = null;
			}
		},
		update : function(force) {
			var newContainer = r.getActiveContainer();
			//this.view.bringToFront();
			if (!force && this.container == newContainer) return;
			this.detach();
			this.attach(newContainer);
		}
	}
	r.addOverlay = function(overlay) {
		overlay.update(true);
		r.overlays.push(overlay);
		return overlay;
	}
	r.removeOverlay = function(overlay) {
		var i = r.overlays.indexOf(overlay);
		if (i >= 0) {
			overlay.detach();
			r.overlays.splice(i, 1);
		}
	}
	r.updateOverlays = function() {
		var i;
		for (i = 0; i < r.overlays.length; i++) {
			r.overlays[i].update();
		}
	}
	EventSender.init(r);
	r.fadeInAnimation = function(v, callback) {
		trans = new G.AlphaAnimation(0, 1);
		trans.setDuration(150);
		trans.setAnimationListener(new G.Animation.AnimationListener({
			onAnimationEnd : function(a) {try {
				if (callback) callback();
			} catch(e) {erp(e)}},
		}));
		v.startAnimation(trans);
		return new r.ViewAnimationController(v, trans);
	}
	r.fadeOutAnimation = function(v, callback) {
		trans = new G.AlphaAnimation(1, 0);
		trans.setDuration(150);
		trans.setAnimationListener(new G.Animation.AnimationListener({
			onAnimationEnd : function(a) {try {
				if (callback) callback();
			} catch(e) {erp(e)}},
		}));
		v.startAnimation(trans);
		return new r.ViewAnimationController(v, trans);
	}
	r.ViewAnimationController = function(v, ani) {
		this.view = v;
		this.animation = ani;
	}
	r.ViewAnimationController.prototype = {
		cancel : function() {
			this.view.clearAnimation();
		}
	}
	return r;
})());