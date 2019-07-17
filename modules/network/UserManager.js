MapScript.loadModule("UserManager", {
	login : function(emailOrName, password) {
		var d;
		try {
			d = JSON.parse(NetworkUtils.postPage("https://ca.projectxero.top/user/login", NetworkUtils.toQueryString({
				name : emailOrName,
				pass : password
			}), "application/x-www-form-urlencoded"));
		} catch(e) {
			throw this.parseError(e);
		}
		this.saveToken(d.result);
	},
	logout :function() {
		this.clearToken();
	},
	register : function(email, name, password) {
		try {
			NetworkUtils.postPage("https://ca.projectxero.top/user/register", NetworkUtils.toQueryString({
				email : email,
				name : name,
				pass : password
			}), "application/x-www-form-urlencoded");
		} catch(e) {
			throw this.parseError(e);
		}
	},
	refreshLogin : function(refreshToken) {
		var d;
		try {
			d = JSON.parse(NetworkUtils.queryPage("https://ca.projectxero.top/user/refresh?" + NetworkUtils.toQueryString({
				token : refreshToken
			})));
		} catch(e) {
			throw this.parseError(e);
		}
		this.saveToken(d.result);
	},
	getUserInfo : function() {
		var d;
		try {
			d = JSON.parse(NetworkUtils.queryPage("https://ca.projectxero.top/user/info?" + NetworkUtils.toQueryString({
				token : this.accessToken
			})));
		} catch(e) {
			throw this.parseError(e);
		}
		return d.result;
	},
	requestResetPassword : function(email, password) {
		try {
			NetworkUtils.postPage("https://ca.projectxero.top/user/forget_password", NetworkUtils.toQueryString({
				email : email,
				pass : password
			}), "application/x-www-form-urlencoded");
		} catch(e) {
			throw this.parseError(e);
		}
	},
	setPassword : function(oldPassword, newPassword) {
		try {
			NetworkUtils.postPage("https://ca.projectxero.top/user/set_password", NetworkUtils.toQueryString({
				accessToken : this.accessToken,
				oldPwd : oldPassword,
				newPwd : newPassword
			}), "application/x-www-form-urlencoded");
		} catch(e) {
			throw this.parseError(e);
		}
	},
	setUsername : function(name) {
		try {
			NetworkUtils.postPage("https://ca.projectxero.top/user/set_username", NetworkUtils.toQueryString({
				accessToken : this.accessToken,
				name : name
			}), "application/x-www-form-urlencoded");
		} catch(e) {
			throw this.parseError(e);
		}
	},
	changeEmail : function(email) {
		try {
			NetworkUtils.postPage("https://ca.projectxero.top/user/change_email", NetworkUtils.toQueryString({
				accessToken : this.accessToken,
				email : email
			}), "application/x-www-form-urlencoded");
		} catch(e) {
			throw this.parseError(e);
		}
	},
	errorMessage : {
		"error.user.info.invalidToken" : "无效的访问令牌",
		"error.user.info.userNotExist" : "用户已被注销",
		"error.user.register.emailOccupied" : "邮箱已被使用",
		"error.user.register.nameOccupied" : "用户名已被占用",
		"error.user.register.abuseEmail" : "请不要向这个邮箱发送过多邮件或发送邮件发送过于频繁",
		"error.user.register.sendEmailFailed" : "发送验证邮件失败",
		"error.user.login.userNotExist" : "用户名或密码不正确",
		"error.user.login.wrongPassword" : "用户名或密码不正确",
		"error.user.refreshLogin.invalidToken" : "刷新令牌不可用",
		"error.user.forgetPwd.userNotExist" : "没有账户和该邮箱绑定",
		"error.user.forgetPwd.abuseEmail" : "请不要向这个邮箱发送过多邮件或发送邮件发送过于频繁",
		"error.user.forgetPwd.sendEmailFailed" : "发送重置密码邮件失败",
		"error.user.setPwd.wrongOldPassword" : "旧密码错误",
		"error.user.setPwd.writeError" : "写入账户记录失败",
		"error.user.setName.nameOccupied" : "用户名被占用",
		"error.user.setName.writeError" : "写入账户记录失败",
		"info.user.changeEmail.sameAddress" : "旧邮箱与新邮箱相同",
		"error.user.changeEmail.emailOccupied" : "该邮箱已与其他账户绑定",
		"error.user.changeEmail.sendEmailFailed" : "发送验证邮件失败"
	},
	parseError : function(e) {
		var json, message;
		if (!e.errorMessage) return e;
		if (e.responseCode == 500) {
			return "内部错误";
		} else if (e.responseCode == 503) {
			return "服务不可用";
		}
		try {
			json = JSON.parse(e.errorMessage);
		} catch(err) {/* Not a json */}
		if (!json) return e;
		message = this.errorMessage[json.error];
		if (!message) {
			message = "未知错误(" + json.error + ")\n" + json;
		}
		return message;
	},
	loadToken : function() {
		var realThis = this, refreshToken;
		this.accessData = CA.settings.userSettings;
		if (this.accessData) {
			refreshToken = this.accessData.refreshToken;
			Threads.run(function() {try {
				realThis.refreshLogin(refreshToken);
			} catch(e) {Log.e(e)}});
		}
	},
	saveToken : function(result) {
		this.accessToken = result.accessToken;
		result.expiredDate = Date.now() + result.expiredIn * 1000;
		this.accessData = CA.settings.userSettings = result;
		this.userInfo = this.getUserInfo();
	},
	clearToken : function() {
		this.accessToken = null;
		this.accessData = CA.settings.userSettings = null;
		this.userInfo = null;
	},
	getCachedUserInfo : function() {
		return this.userInfo;
	},
	parseExpLevel : function(exp) {
		return {
			total : exp,
			level : Math.floor(exp / 500) + 1,
			rest : exp % 500,
			levelExp : 500
		};
	},
	showLogin : function self(callback) { var realThis = this; G.ui(function() {try {
		var username, password, popup;
		popup = PopupPage.showDialog("usermanager.Login", L.ScrollView({
			style : "message_bg",
			child : L.LinearLayout({
				orientation : L.LinearLayout("vertical"),
				padding : [15 * G.dp, 15 * G.dp, 15 * G.dp, 5 * G.dp],
				children : [
					L.TextView({
						text : "登录",
						padding : [0, 0, 0, 10 * G.dp],
						layout : { width : -1, height : -2 },
						gravity : L.Gravity("center"),
						style : "textview_default",
						fontSize : 4
					}),
					username = L.EditText({
						hint : "邮箱或用户名",
						singleLine : true,
						padding : [0, 0, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						inputType : L.InputType("TYPE_CLASS_TEXT|TYPE_TEXT_VARIATION_EMAIL_ADDRESS"),
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					password = L.EditText({
						hint : "密码",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						transformationMethod : L.asClass(L.PasswordTransformationMethod).instance,
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					L.TextView({
						text : "登录",
						padding : [10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp],
						gravity : L.Gravity("center"),
						layout : { width : -1, height : -2 },
						style : "button_critical",
						fontSize : 3,
						onClick : function() {try {
							if (!username.length()) return Common.toast("用户名不能为空");
							if (!password.length()) return Common.toast("密码不能为空");
							Common.showProgressDialog(function(dia) {
								dia.setText("正在登录...");
								try {
									realThis.login(username.text, password.text);
								} catch(e) {
									Log.e(e);
									return Common.toast("登录失败\n" + e);
								}
								G.ui(function() {try {
									popup.exit();
									if (callback) callback();
								} catch(e) {erp(e)}});
							});
						} catch(e) {erp(e)}}
					}),
					L.TextView({
						text : "注册",
						padding : [10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp],
						gravity : L.Gravity("center"),
						layout : { width : -1, height : -2 },
						style : "button_critical",
						fontSize : 3,
						onClick : function() {try {
							popup.exit();
							realThis.showRegister();
						} catch(e) {erp(e)}}
					}),
					L.TextView({
						text : "忘记密码",
						padding : [10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp],
						gravity : L.Gravity("center"),
						layout : { width : -1, height : -2 },
						style : "button_critical",
						fontSize : 3,
						onClick : function() {try {
							popup.exit();
							realThis.showForgetPassword();
						} catch(e) {erp(e)}}
					})
				]
			})
		}), -1, -2);
	} catch(e) {erp(e)}})},
	showRegister : function self() { var realThis = this; G.ui(function() {try {
		var email, username, password, password2, popup;
		popup = PopupPage.showDialog("usermanager.Register", L.ScrollView({
			style : "message_bg",
			child : L.LinearLayout({
				orientation : L.LinearLayout("vertical"),
				padding : [15 * G.dp, 15 * G.dp, 15 * G.dp, 5 * G.dp],
				children : [
					L.TextView({
						text : "注册",
						padding : [0, 0, 0, 10 * G.dp],
						layout : { width : -1, height : -2 },
						gravity : L.Gravity("center"),
						style : "textview_default",
						fontSize : 4
					}),
					email = L.EditText({
						hint : "邮箱",
						singleLine : true,
						padding : [0, 0, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						inputType : L.InputType("TYPE_CLASS_TEXT|TYPE_TEXT_VARIATION_EMAIL_ADDRESS"),
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					username = L.EditText({
						hint : "用户名",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						inputType : L.InputType("TYPE_CLASS_TEXT|TYPE_TEXT_VARIATION_EMAIL_ADDRESS"),
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					password = L.EditText({
						hint : "密码",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						transformationMethod : L.asClass(L.PasswordTransformationMethod).instance,
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					password2 = L.EditText({
						hint : "确认密码",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						transformationMethod : L.asClass(L.PasswordTransformationMethod).instance,
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					L.TextView({
						text : "注册",
						padding : [10 * G.dp, 15 * G.dp, 10 * G.dp, 15 * G.dp],
						gravity : L.Gravity("center"),
						layout : { width : -1, height : -2 },
						style : "button_critical",
						fontSize : 3,
						onClick : function() {try {
							if (!email.length()) return Common.toast("邮箱地址不能为空");
							if (!username.length()) return Common.toast("用户名不能为空");
							if (!password.length()) return Common.toast("密码不能为空");
							if (String(password.text) != String(password2.text)) return Common.toast("两次密码输入不一致");
							Common.showProgressDialog(function(dia) {
								dia.setText("正在发送验证邮件...");
								try {
									realThis.register(email.text, username.text, password.text);
								} catch(e) {
									Log.e(e);
									return Common.toast("注册失败\n" + e);
								}
								G.ui(function() {try {
									popup.exit();
									Common.showTextDialog("一份用于验证的邮件已发送至" + email.text + "\n请在1天内点击邮件内的链接来确认注册");
								} catch(e) {erp(e)}});
							});
						} catch(e) {erp(e)}}
					})
				]
			})
		}), -1, -2);
	} catch(e) {erp(e)}})},
	showForgetPassword : function self() { var realThis = this; G.ui(function() {try {
		var email, password, password2, popup;
		popup = PopupPage.showDialog("usermanager.ForgetPassword", L.ScrollView({
			style : "message_bg",
			child : L.LinearLayout({
				orientation : L.LinearLayout("vertical"),
				padding : [15 * G.dp, 15 * G.dp, 15 * G.dp, 5 * G.dp],
				children : [
					L.TextView({
						text : "忘记密码",
						padding : [0, 0, 0, 10 * G.dp],
						layout : { width : -1, height : -2 },
						gravity : L.Gravity("center"),
						style : "textview_default",
						fontSize : 4
					}),
					email = L.EditText({
						hint : "邮箱",
						singleLine : true,
						padding : [0, 0, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						inputType : L.InputType("TYPE_CLASS_TEXT|TYPE_TEXT_VARIATION_EMAIL_ADDRESS"),
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					password = L.EditText({
						hint : "密码",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						transformationMethod : L.asClass(L.PasswordTransformationMethod).instance,
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					password2 = L.EditText({
						hint : "确认密码",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						transformationMethod : L.asClass(L.PasswordTransformationMethod).instance,
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					L.TextView({
						text : "重置密码",
						padding : [10 * G.dp, 15 * G.dp, 10 * G.dp, 15 * G.dp],
						gravity : L.Gravity("center"),
						layout : { width : -1, height : -2 },
						style : "button_critical",
						fontSize : 3,
						onClick : function() {try {
							if (!email.length()) return Common.toast("邮箱地址不能为空");
							if (!password.length()) return Common.toast("密码不能为空");
							if (String(password.text) != String(password2.text)) return Common.toast("两次密码输入不一致");
							Common.showProgressDialog(function(dia) {
								dia.setText("正在发送重置密码邮件...");
								try {
									realThis.requestResetPassword(email.text, password.text);
								} catch(e) {
									Log.e(e);
									return Common.toast("重置密码失败\n" + e);
								}
								G.ui(function() {try {
									popup.exit();
									Common.showTextDialog("一份用于确认重置密码的邮件已发送至" + email.text + "\n请在1天内点击邮件内的链接来确认重置密码");
								} catch(e) {erp(e)}});
							});
						} catch(e) {erp(e)}}
					})
				]
			})
		}), -1, -2);
	} catch(e) {erp(e)}})},
	showChangePassword : function self() { var realThis = this; G.ui(function() {try {
		var oldpwd, newpwd, newpwd2, popup;
		popup = PopupPage.showDialog("usermanager.ForgetPassword", L.ScrollView({
			style : "message_bg",
			child : L.LinearLayout({
				orientation : L.LinearLayout("vertical"),
				padding : [15 * G.dp, 15 * G.dp, 15 * G.dp, 5 * G.dp],
				children : [
					L.TextView({
						text : "更改密码",
						padding : [0, 0, 0, 10 * G.dp],
						layout : { width : -1, height : -2 },
						gravity : L.Gravity("center"),
						style : "textview_default",
						fontSize : 4
					}),
					oldpwd = L.EditText({
						hint : "旧密码",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						transformationMethod : L.asClass(L.PasswordTransformationMethod).instance,
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					newpwd = L.EditText({
						hint : "新密码",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						transformationMethod : L.asClass(L.PasswordTransformationMethod).instance,
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					newpwd2 = L.EditText({
						hint : "确认新密码",
						singleLine : true,
						padding : [0, 20 * G.dp, 0, 0],
						imeOptions : L.EditorInfo("IME_FLAG_NO_FULLSCREEN"),
						transformationMethod : L.asClass(L.PasswordTransformationMethod).instance,
						style : "edittext_default",
						fontSize : 3,
						layout : { width : -1, height : -2 }
					}),
					L.TextView({
						text : "设置密码",
						padding : [10 * G.dp, 15 * G.dp, 10 * G.dp, 15 * G.dp],
						gravity : L.Gravity("center"),
						layout : { width : -1, height : -2 },
						style : "button_critical",
						fontSize : 3,
						onClick : function() {try {
							if (!oldpwd.length()) return Common.toast("原密码不能为空");
							if (!newpwd.length()) return Common.toast("新密码不能为空");
							if (String(newpwd.text) != String(newpwd2.text)) return Common.toast("两次新密码输入不一致");
							Common.showProgressDialog(function(dia) {
								dia.setText("正在保存密码..");
								try {
									realThis.setPassword(oldpwd.text, newpwd.text);
								} catch(e) {
									Log.e(e);
									return Common.toast("密码保存失败\n" + e);
								}
								G.ui(function() {try {
									popup.exit();
									Common.toast("密码已保存");
								} catch(e) {erp(e)}});
							});
						} catch(e) {erp(e)}}
					})
				]
			})
		}), -1, -2);
	} catch(e) {erp(e)}})},
	showChangeName : function(callback) {
		var realThis = this;
		var userInfo = this.userInfo;
		Common.showInputDialog({
			title : "更改用户名",
			defaultValue : userInfo.name,
			callback : function(s) {
				Common.showProgressDialog(function(dia) {
					dia.setText("正在保存用户名..");
					try {
						realThis.setUsername(s);
						userInfo.name = s;
					} catch(e) {
						Log.e(e);
						return Common.toast("用户名保存失败\n" + e);
					}
					G.ui(function() {try {
						Common.toast("用户名已保存");
						if (callback) callback();
					} catch(e) {erp(e)}});
				});
			}
		});
	},
	getSettingItem : function() {
		var realThis = this;
		return {
			type : "custom",
			get : function() {
				var userInfo = realThis.userInfo;
				if (userInfo) {
					this.name = userInfo.name;
					this.description = userInfo.email;
				} else {
					this.name = "未登录";
					this.description = "点击登录命令助手账号";
				}
				return "";
			},
			onclick : function(fset) {
				if (realThis.userInfo) {
					realThis.showManage(fset);
				} else {
					realThis.showLogin(fset);
				}
			}
		};
	},
	showManage : function(callback) { var realThis = this; G.ui(function() {try {
		var popup, userInfo = realThis.userInfo;
		var exp = realThis.parseExpLevel(userInfo.experience);
		popup = PopupPage.showSideBar("usermanager.Manage", L.ScrollView({
			style : "message_bg",
			fillViewport : true,
			child : L.LinearLayout({
				orientation : L.LinearLayout("vertical"),
				padding : [20 * G.dp, 20 * G.dp, 20 * G.dp, 0],
				layout : { width : -1, height : -1 },
				children : [
					L.TextView({
						text : userInfo.name,
						layout : { width : -1, height : -2 },
						style : "textview_default",
						fontSize : 4
					}),
					L.TextView({
						text : userInfo.email,
						layout : { width : -1, height : -2 },
						padding : [0, 0, 0, 5 * G.dp],
						style : "textview_prompt",
						fontSize : 1
					}),
					L.LinearLayout({
						orientation : L.LinearLayout("horizontal"),
						backgroundColor : Common.theme.promptcolor,
						layout : { width : -1, height : 2 * G.dp },
						weightSum : exp.levelExp,
						child : L.View({
							backgroundColor : Common.theme.highlightcolor,
							layout : { width : 0, height : -1, weight : exp.rest }
						})
					}),
					L.LinearLayout({
						orientation : L.LinearLayout("horizontal"),
						layout : { width : -1, height : -2 },
						padding : [0, 0, 0, 5 * G.dp],
						children : [
							L.TextView({
								text : "Lv. " + exp.level,
								layout : { width : -2, height : -2, weight : 1.0 },
								style : "textview_default",
								fontSize : 1
							}),
							L.TextView({
								text : exp.rest + "/" + exp.levelExp,
								layout : { width : -2, height : -2 },
								style : "textview_default",
								fontSize : 1
							}),
						]
					}),
					L.TextView({
						text : "更改用户名",
						padding : [0, 15 * G.dp, 0, 15 * G.dp],
						gravity : L.Gravity("left"),
						layout : { width : -1, height : -2 },
						style : "button_highlight",
						fontSize : 3,
						onClick : function() {try {
							realThis.showChangeName(callback);
							popup.exit();
						} catch(e) {erp(e)}}
					}),
					L.TextView({
						text : "更改密码",
						padding : [0, 15 * G.dp, 0, 15 * G.dp],
						gravity : L.Gravity("left"),
						layout : { width : -1, height : -2 },
						style : "button_highlight",
						fontSize : 3,
						onClick : function() {try {
							realThis.showChangePassword();
							popup.exit();
						} catch(e) {erp(e)}}
					}),
					L.TextView({
						text : "注销",
						padding : [0, 15 * G.dp, 0, 15 * G.dp],
						gravity : L.Gravity("left"),
						layout : { width : -1, height : -2 },
						style : "button_highlight",
						fontSize : 3,
						onClick : function() {try {
							realThis.logout();
							if (callback) callback();
							popup.exit();
						} catch(e) {erp(e)}}
					}),
					L.Space({
						layout : { width : -1, height : 0, weight : 1.0 }
					}),
					L.TextView({
						text : "关闭",
						padding : [10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp],
						gravity : L.Gravity("center"),
						layout : { width : -1, height : -2 },
						style : "button_critical",
						fontSize : 3,
						onClick : function() {try {
							popup.exit();
						} catch(e) {erp(e)}}
					})
				]
			})
		}), "left", 160 * G.dp, 0.2);
		popup.enter();
	} catch(e) {erp(e)}})},
	initialize : function() {
		this.loadToken();
	}
});