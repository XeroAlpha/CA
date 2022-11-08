({
	UNINITIALIZED : 0,
	ONLY_COMMAND_NAME : 1,
	UNKNOWN_COMMAND : -1,
	COMMAND_WITH_PATTERN : 2,
	UNKNOWN_PATTERN : -2,

	commandText: null,
	input : [],
	output : [],
	cmdname : "",
	prompt : [],
	help : "",
	patterns : [],
	mode : 0,
	last : {},
	callDelay : function self(s) {
		if (CA.settings.iiMode != 2 && CA.settings.iiMode != 3) return;
		if (!self.pool) {
			self.pool = java.util.concurrent.Executors.newCachedThreadPool();
			self.pool.setMaximumPoolSize(1);
			self.pool.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.DiscardPolicy());
		}
		self.pool.execute(function() {
			CA.IntelliSense.proc(s);
		});
	},
	apply : function() {
		if (this.ui) this.show.apply(this);
	},
	proc : function(s) {try {
		if (CA.settings.iiMode != 2 && CA.settings.iiMode != 3 || CA.Library.loadingStatus) return;
		if (this.commandText == s) return;
		this.commandText = s;
		var r = this.procCmd(s);
		this.source = r.source;
		this.cmdname = r.cmdname;
		this.hasSlash = r.hasSlash;
		this.strParam = r.strParam;
		this.input = r.input;
		this.output = r.output;
		this.help = r.help;
		this.prompt = r.prompt;
		this.patterns = r.patterns;
		//应用更改
		this.apply();
	} catch(e) {
		erp(e, true);
		Common.showTextDialog("当前命令库解析出错。\n" + e + (e instanceof Error ? "\n堆栈：\n" + e.stack : ""));
	}},
	procCmd : function(s) {
		var c, ca, t, i, pp, r;

		//分析命令结构 - 拆分
		c = /^(\/)?(\S*)(\s+)?(.*)/.exec(s);
		if (!c) return; //c = [匹配文本, 是否存在/, 命令名称, 是否存在命令名称后的空格, 命令参数]

		r = {
			source : c[0],
			cmdname : c[2],
			hasSlash : Boolean(c[1]),
			strParam : c[4],
			input : [],
			output : {},
			prompt : [],
			patterns : [],
			help : null,
			canFinish : false
		};

		if (c[3]) {
			//分类 - 输入参数中
			if (c[2] in this.library.commands) {
				//分类 - 存在命令
				this.procParams(r);
			} else {
				//分类 - 不存在命令
				//提示命令未找到
				pp = new G.SpannableStringBuilder((c[1] ? "/" : "") + c[2] + " ");
				appendSSB(pp, "...", new G.ForegroundColorSpan(Common.theme.highlightcolor));
				pp.append("\n");
				appendSSB(pp, "无法在库中找到命令“" + c[2] + "”。", new G.ForegroundColorSpan(Common.theme.criticalcolor));
				r.prompt.push(pp);
				r.help = "找不到这样的命令";
				r.mode = this.UNKNOWN_COMMAND;
			}
		} else {
			//分类 - 未输入参数

			//获得可选命令
			t = this.library.command_snap;
			ca = Object.keys(t).filter(function(e, i, a) {
				return e.indexOf(c[2]) >= 0 || t[e].indexOf(c[2]) >= 0;
			}).sort();

			if (ca.length) {
				//分类 - 可选命令长度大于0

				ca.forEach(function(e, i, a) {
					pp = new G.SpannableStringBuilder(c[1] ? "/" : "");
					appendSSB(pp, e, new G.ForegroundColorSpan(Common.theme.highlightcolor));
					t = this.library.commands[e];
					while (t.alias) t = this.library.commands[t.alias];

					//存在无参数用法
					if (!t.noparams) pp.append(" ...");
					if (t.noparams && c[2] == e && t.noparams.description) { //当命令全输入且存在无参数用法时
						r.canFinish = true;
						pp.append("\n");
						appendSSB(pp, t.noparams.description, new G.ForegroundColorSpan(Common.theme.promptcolor));
					} else if ("description" in t) { //存在提示则显示提示
						pp.append("\n");
						appendSSB(pp, t.description, new G.ForegroundColorSpan(Common.theme.promptcolor));
					}
					r.prompt.push(pp);
					r.output[t.description ? e + " - "  + t.description : e] = (r.hasSlash ? "/" : "") + e + (t.noparams ?  "" : " ");
				}, this);

				t = this.library.commands[ca[0]];
				while (t.alias) t = this.library.commands[t.alias];
				r.help = t.help ? t.help : "该命令帮助还未上线";
				r.mode = this.ONLY_COMMAND_NAME;
			} else {
				//分类 - 可选命令长度等于0（无可选命令）
				//提示命令不存在
				pp = new G.SpannableStringBuilder(c[1] ? "/" : "");
				appendSSB(pp, c[2], new G.ForegroundColorSpan(Common.theme.highlightcolor));
				pp.append(" ...\n");
				appendSSB(pp, "无法在库中找到命令“" + c[2] + "”。", new G.ForegroundColorSpan(Common.theme.criticalcolor));
				r.prompt.push(pp);
				r.help = "命令不存在";
				r.mode = this.UNKNOWN_COMMAND;
			}

			//设置列表内容及反应
			r.input = Object.keys(r.output);
		}
		return r;
	},
	procParams : function(c) {
		var i, j, cm = this.library.commands[c.cmdname], ps, pa, ci, cp, t, f = true, k, u, ms, pp, cpl = [], nn = false, erm = [];

		//别名处理
		while (cm.alias) cm = this.library.commands[cm.alias];

		c.help = cm.help ? cm.help : "该命令帮助还未上线";
		ps = cm.patterns;
		c.canFinish = false;

		//对每一种模式进行判断
		for (i in ps) {
			pa = ps[i].params;
			ci = 0;

			//重置提示
			pp = new G.SpannableStringBuilder((c.hasSlash ? "/" : "") + c.cmdname);
			cpl.length = 0;

			//逐部分匹配参数
			for (j = 0; j < pa.length; j++) {
				cp = pa[j];

				//匹配参数
				t = this.matchParam(cp, c.strParam.slice(ci));

				if (t && t.length >= 0 && ((/^\s?$/).test(c.strParam.slice(ci += t.length, ++ci)))) {
					//分类 - 匹配成功
					ci += (/^\s*/).exec(c.strParam.slice(ci))[0].length;

					if (ci > c.strParam.length) {
						//分类 - 到达末尾
						//处理提示与输入
						u = (c.hasSlash ? "/" : "") + c.cmdname + " " + c.strParam.slice(0, ci - t.length - 1);
						if (pa[j + 1] && !pa[j + 1].optional) {
							for (k in t.output) t.output[k] = t.output[k] + " ";
						}
						if (t.length && t.canFinish && pa[j + 1]) nn = true;
						if (t.input) for (k in t.input) if (c.input.indexOf(t.input[k]) < 0) c.input.push(t.input[k]);
						if (t.output) for (k in t.output) if (!(k in c.output)) c.output[k] = u + t.output[k];
						if (t.recommend) for (k in t.recommend) if (!(k in c.output)) c.output[k] = u + t.recommend[k];
						if (t.assist) for (k in t.assist) if (!(k in c.output)) c.output[k] = c.source + t.assist[k];
						if (t.menu) for (k in t.menu) if (!(k in c.output)) c.output[k] = t.menu[k];
						if (t.canFinish && (!pa[j + 1] || pa[j + 1].optional)) c.canFinish = true;
						f = false;
						pp.append(" ");
						pp.append(this.getParamTag(cp, c.strParam.slice(ci - t.length - 1, ci), 1, t));
						for (j++; j < pa.length; j++) {
							pp.append(" ");
							pp.append(this.getParamTag(pa[j], "", 2, null));
						}
						if (t.description || cp.description || ps[i].description || cm.description) appendSSB(pp, "\n" + (t.description ? String(t.description) : cp.description ? String(cp.description) : ps[i].description ? String(ps[i].description) : String(cm.description)), new G.ForegroundColorSpan(Common.theme.promptcolor));
						//详情优先级：匹配函数动态产生 > 当前参数 > 当前用法 > 当前命令 > 不显示

						c.prompt.push(pp);
						c.patterns.push(cpl);
						break;
					} else {
						//分类 - 未到达末尾
						if (!t.canFinish) if (cp.canIgnore) {
							continue;
						} else {
							pp.append(" ");
							pp.append(this.getParamTag(cp, "", 3, t));
							for (k = j + 1; k < pa.length; k++) {
								pp.append(" ");
								pp.append(this.getParamTag(pa[k], "", 2, null));
							}
							erm.push({
								desp : "未结束的参数",
								count : j,
								pp : pp
							});
							break;
						}
						pp.append(" ");
						pp.append(this.getParamTag(cp, c.strParam.slice(ci - t.length - 1, ci - 1), 0));
						cpl.push(t);
					}
				} else {
					//分类 - 匹配失败
					if (cp.canIgnore) {
						continue;
						//忽略参数
					} else {
						pp.append(" ");
						pp.append(this.getParamTag(cp, "", 3, t));
						for (k = j + 1; k < pa.length; k++) {
							pp.append(" ");
							pp.append(this.getParamTag(pa[k], "", 2, null));
						}
						erm.push({
							desp : !t ? null : t.length >= 0 ? "字符多余：" + c.strParam.slice(ci - 1) : t.description,
							count : j,
							pp : pp
						});
						break;
						//下一个模式
					}
				}
				if (cp.repeat) {
					j--; continue;
					//重复
				}
			}
		}
		//如果未找到正确用法
		if (f) {
			c.input = [];
			erm.sort(function(a, b) {
				return b.count - a.count;
			});
			erm.forEach(function(e) {
				e.pp.append("\n");
				appendSSB(e.pp, e.desp ? e.desp : "用法不存在", new G.ForegroundColorSpan(Common.theme.criticalcolor));
				c.prompt.push(e.pp);
			});
			if (!erm.length) {
				pp = new G.SpannableStringBuilder((c.hasSlash ? "/" : "") + c.cmdname + " ");
				appendSSB(pp, "...", new G.ForegroundColorSpan(Common.theme.highlightcolor));
				pp.append("\n");
				appendSSB(pp, "无法在库中找到命令“" + c.cmdname + "”的此类用法。", new G.ForegroundColorSpan(Common.theme.criticalcolor));
				c.prompt.push(pp);
			}
		} else if (nn) {
			c.input.push("  - 下一个参数");
			c.output["  - 下一个参数"] = c.source + " ";
		}
		c.mode = f ? this.UNKNOWN_PATTERN : this.COMMAND_WITH_PATTERN;
	},
	matchParam : function(cp, ps) {
		var i, r, t, t2, t3, t4;
		switch (cp.type) {
			case "text":
			case "rawjson":
			r = {
				length : ps.length,
				canFinish : true
			};
			break;

			case "nbt":
			case "json":
			r = {
				input : ["插入JSON"],
				menu : {
					"插入JSON" : function() {
						CA.IntelliSense.assistJSON(cp);
					}
				},
				length : ps.length,
				canFinish : true
			};
			break;

			case "plain":
			t = cp.name;
			if (cp.prompt) t += " - " + cp.prompt;
			r = {
				input : [t],
				output : {}
			};
			r.output[t] = cp.name;
			if (ps.startsWith(cp.name + " ") || ps == cp.name) {
				r.length = cp.name.length;
				r.canFinish = true;
			} else if (cp.name.indexOf(ps) >= 0 || cp.prompt && cp.prompt.indexOf(ps) >= 0) {
				r.length = ps.length;
				r.canFinish = false;
			} else return {
				description : "不可为" + ps
			};
			break;

			case "selector":
			r = this.procSelector(cp, ps);
			if (!r || !(r.length >= 0)) return r;
			break;

			case "uint":
			t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
			if (!(/^\d*$/).test(t)) return {
				description : t + "不是自然数"
			};
			r = {
				length : t.length,
				canFinish : t.length > 0
			};
			break;

			case "int":
			t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
			if (!(/^(\+|-)?\d*$/).test(t)) return {
				description : t + "不是整数"
			};
			r = {
				length : t.length,
				canFinish : t.length && !isNaN(t)
			};
			break;

			case "float":
			t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
			if (!(t2 = (/^(\+|-)?(\d*\.)?(\d)*$/).exec(t))) return {
				description : t + "不是数值"
			};
			r = {
				length : t.length,
				canFinish : t.length && t2[3]
			};
			break;

			case "relative":
			t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
			if (!(t2 = (/^(~)?((\+|-)?(\d*\.)?(\d)*)$/).exec(t))) return {
				description : t + "不是数值"
			};
			r = {
				length : t.length,
				input : ["~ - 相对标识符"],
				assist : {
					"~ - 相对标识符" : "~"
				},
				canFinish : t2[5] || t2[1] && !t2[2].length
			};
			break;

			case "position":
			r = this.procPosition(cp, ps);
			if (!r || !(r.length >= 0)) return r;
			break;

			case "custom":
			t = new RegExp(cp.input, "").exec(ps);
			if (!t) return {
				description : t + "不满足指定的条件"
			};
			r = {
				length : t[0].length,
				canFinish : new RegExp(cp.finish, "").test(ps)
			};
			break;

			case "enum":
			if (!(t = cp.list instanceof Object ? cp.list : this.library.enums[cp.list])) {
				throw new Error("无法找到指定枚举类型");
			}
			r = {
				output : {},
				canFinish : false,
				length : -1
			};
			if (Array.isArray(t)) { //这个懒得用matchString了
				r.input = t.filter(function(e, i, a) {
					if (ps.startsWith(e + " ") || ps == e) {
						r.length = Math.max(r.length, e.length);
						r.canFinish = true;
					} else if (e.startsWith(ps)) {
						r.length = Math.max(r.length, ps.length);;
					} else return false;
					r.output[e] = e;
					return true;
				});
				r.input.sort();
			} else {
				t2 = [];
				r.input = [];
				Object.keys(t).forEach(function(e, i, a) {
					if (ps.startsWith(e + " ") || ps == e) {
						r.length = Math.max(r.length, e.length);
						r.canFinish = true;
					} else if (e.indexOf(ps) >= 0 || t[e].indexOf(ps) >= 0) {
						r.length = Math.max(r.length, ps.length);
					} else return;
					if (t[e]) {
						r.output[e + " - " + t[e]] = e;
						r.input.push(e + " - " + t[e]);
					} else {
						r.output[e] = e;
						t2.push(e);
					}
				});
				r.input.sort(); t2.sort(); r.input = r.input.concat(t2);
			}
			if (r.length < 0) {
				r.description = ps + "不是有效的元素";
			}
			break;

			case "command":
			t = this.procCmd(ps);
			if (!t) return {
				description : "不是合法的命令格式"
			};
			t2 = t.prompt[0];
			t3 = t2.toString().indexOf("\n");
			r = {
				length : t.mode < 0 ? -1 : t.source.length,
				input : t.input,
				output : {},
				menu : {},
				canFinish : t.canFinish,
				description : String(t2.subSequence(t3 + 1, t2.length())),
				tag : t2.subSequence(0, t3)
			}
			for (i in t.output) {
				if (t.output[i] instanceof Function) {
					r.menu[i] = t.output[i];
				} else {
					r.output[i] = t.output[i];
				}
			}
			break;

			case "subcommand":
			t = {
				source : cp.mainCommand + " " + ps,
				cmdname : cp.mainCommand,
				hasSlash: false,
				strParam : ps,
				input : [],
				output : {},
				prompt : [],
				patterns : [],
				help : null,
				canFinish : false
			};
			this.procParams(t);
			t2 = t.prompt[0];
			t3 = t2.toString().indexOf("\n");
			r = {
				length : t.mode < 0 ? -1 : ps.length,
				input : t.input,
				output : {},
				menu : {},
				canFinish : t.canFinish,
				description : String(t2.subSequence(t3 + 1, t2.length())),
				tag : t2.subSequence(t.cmdname.length + 1, t3)
			}
			for (i in t.output) {
				if (t.output[i] instanceof Function) {
					r.menu[i] = t.output[i];
				} else {
					r.output[i] = t.output[i].slice(t.cmdname.length + 1);
				}
			}
			break;

			case "string":
			t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
			r = {
				length : t.length,
				canFinish : t.length > 0
			};
			break;

			default:
			t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
			r = {
				length : t.length,
				canFinish : true
			};
		}
		if (!cp.suggestion) return r;
		t = cp.suggestion instanceof Object ? cp.suggestion : this.library.enums[cp.suggestion];
		t2 = ps.slice(0, r.length);
		this.matchString(t2, t, r);
		return r;
	},
	getParamTag : function(cp, ms, mt, md) { //匹配模式，匹配字符串，匹配类型（已输入、输入中、未输入、出错），matchParam返回的匹配数据
		var z = cp.name, t, t2;
		if (mt == 1 || mt == 3) {
			switch (cp.type) {
				case "int":
				z += ":整数";
				break;

				case "uint":
				z += ":正整数";
				break;

				case "float":
				case "relative":
				z += ":数值";
				break;

				case "nbt":
				z += ":数据标签";
				break;

				case "rawjson":
				z += ":文本JSON";
				break;

				case "json":
				z += ":JSON";
				break;

				case "selector":
				z += ":实体";
				break;

				case "enum":
				z += ":列表";
				break;

				case "plain":
				break;

				case "custom":
				if (cp.vtype) z += ":" + cp.vtype;
				break;

				case "position":
				if (mt == 3) {
					z += ":x y z";
					break;
				}
				t2 = md.uv ? ["左", "上", "前"] : ["x", "y", "z"];
				t = (/(\S*)\s*(\S*)\s*(\S*)/).exec(ms);
				if (t[1]) t2[0] = t[1];
				if (t[2]) t2[1] = t[2];
				if (t[3]) t2[2] = t[3];
				z += ":" + t2.join(" ");
				break;

				case "command":
				if (md) {
					return md.tag;
				}
				z += ":命令";
				break;

				case "subcommand":
				if (md) {
					return md.tag;
				}
				z += ":子命令";
				break;

				case "text":
				default:
				z += ":文本";
				break;
			}
		}
		if (cp.type != "plain" && !cp.optional && !cp.canIgnore && !cp.chainOptional) z = "<" + z + ">";
		if (cp.optional || cp.canIgnore || cp.chainOptional) z = "[" + z + "]";
		if (cp.type == "custom") {
			if (cp.prefix) z = cp.prefix + z;
			if (cp.suffix) z = z + cp.suffix;
		}
		if (cp.repeat && mt == 1) z = z + " ...";
		z = new G.SpannableString(z);
		if (mt == 2) {
			z.setSpan(new G.ForegroundColorSpan(Common.theme.promptcolor), 0, z.length(), z.SPAN_INCLUSIVE_EXCLUSIVE);
		} else if (mt == 1) {
			z.setSpan(new G.ForegroundColorSpan(Common.theme.highlightcolor), 0, z.length(), z.SPAN_INCLUSIVE_EXCLUSIVE);
		} else if (mt == 3) {
			z.setSpan(new G.ForegroundColorSpan(Common.theme.criticalcolor), 0, z.length(), z.SPAN_INCLUSIVE_EXCLUSIVE);
		}
		return z;
	},
	procSelector : function(cp, ps) {
		var c = (/^@(p|e|a|r|s|)(\[)?([^\s\]]*)(\])?(\s)?/).exec(ps), ml, t, i, pl, ms, rx, ls, cp2, mr, bb, sk = false;
		//[全文, 选择器类型, "[", 修饰符, "]", 后置空格]
		if (!c) {
			//正在输入@ / 输入的是玩家名
			t = {
				length : (ms = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "))).length,
				recommend : {},
				canFinish : ps.length > 0
			};
			if (!(/^[^@\^~]*$/).test(ms) || ms.length && !isNaN(ms)) return {
				description : ms + "不是合法的玩家名或选择器"
			};
			if (cp.target == "entity" || cp.target == "player") {
				t.recommend["@a - 选择所有玩家"] = "@a";
				t.recommend["@p - 选择距离最近的玩家"] = "@p";
				t.recommend["@r - 选择随机玩家"] = "@r";
			}
			if (cp.target == "entity" || cp.target == "nonplayer") t.recommend["@e - 选择所有实体"] = "@e";
			if (cp.target != "nonselector") t.recommend["@s - 选择命令执行者"] = "@s";
			t.input = Object.keys(t.recommend);
			if (MCAdapter.available()) {
				t.output = {};
				pl = MCAdapter.getInfo("playernames");
				if (pl) {
					for (i in pl) if (String(pl[i]).startsWith(ms)) t.output[pl[i]] = String(pl[i]);
					t.input = t.input.concat(Object.keys(t.output));
				}
			} else MCAdapter.applySense(t);
		} else if (c[1].length < 1) {
			//正在输入p/e/a/r
			t = {
				length : 1,
				recommend : {
					"@a - 选择所有玩家" : "@a",
					"@p - 选择距离最近的玩家" : "@p",
					"@r - 选择随机玩家" : "@r",
					"@s - 选择命令执行者" : "@s"
				},
				canFinish : false
			};
			if (cp.target == "entity") t.recommend["@e - 选择所有实体"] = "@e";
			t.input = Object.keys(t.recommend);
		} else if (c[1].length == 1 && !c[2]) {
			//正在输入[ / 结束
			t = {
				length : 2,
				assist : {
					"[...] - 插入参数" : "["
				},
				input : ["[...] - 插入参数"],
				canFinish : true
			};
		} else if(c[2] && !c[4] && !c[5]) {
			//正在输入修饰符
			t = {
				length : 3 + c[3].length,
				recommend : {},
				output : {},
				menu : {},
				input : [],
				canFinish : false
			};
			ml = c[3].split(",");
			pl = {};
			ls = ml.pop();
			bb = ps.slice(0, ps.length - ls.length);
			if (ml.length < 4 && ml.length > 0) {
				sk = true;
				rx = /^(\+|-)?(\d*\.)?\d+$/;
				for (i in ml) { //特殊情况
					sk = sk && rx.test(ml[i]);
				}
			}
			if (!sk) rx = /^([^\=]+)(\=)(.*)$/;
			for (i in ml) { //检验之前的参数，此处需更新
				if (!(ms = rx.exec(ml[i]))) return {
					description : ml[i] + "不是合法的选择器参数对"
				};
				if (sk) continue;
				if (!(cp2 = this.library.selectors[ms[1]])) continue;
				if (cp2.hasInverted && ms[3].search(/^!/) == 0) {
					ms[3] = ms[3].slice(1);
				} else pl[ms[1]] = true;
				mr = this.matchParam(cp2, ms[3] + " ");
				if (!mr || !(mr.length >= 0)) {
					return {
						description : mr ? mr.description : ml[i] + "不是合法的选择器参数对"
					};
				} else if (mr.length < ms[3].length || !mr.canFinish) return {
					description : "未结束的选择器参数：" + ms[3]
				};
			}
			rx = sk ? /^(\+|-)?(\d*\.)?\d*$/ : /^([^\=]*)(\=)?(.*)$/;
			if (!(ms = rx.exec(ls))) return {
				description : ls + "不是合法的选择器参数对"
			};
			if (sk) { // 特殊处理
				t.recommend[", - 下一个参数"] = bb + ls + ",";
				t.output["] - 结束参数"] = bb + ls + "]";
				t.input.push(", - 下一个参数", "] - 结束参数");
				return t;
			}
			if (ms[2]) { // 输入修饰符内容
				if (!ms[1]) return {
					description : ls + "缺少等号"
				};
				bb += ms[1] + ms[2];
				if (cp2 = this.library.selectors[ms[1]]) {
					if (cp2.hasInverted) {
						if (ms[3].startsWith("!")) {
							ms[3] = ms[3].slice(1);
							bb += "!";
						} else {
							if (!ms[3]) {
								t.recommend["! - 反向选择"] = bb + "!";
								t.input.push("! - 反向选择");
							}
						}
					}
					mr = this.matchParam(cp2, ms[3]);
					if (!mr || mr.length < ms[3].length) return {
						description : mr ? mr.description : ls + "不是合法的选择器参数对"
					};
					if (mr.canFinish) {
						t.recommend[", - 下一个参数"] = bb + ms[3] + ",";
						t.output["] - 结束参数"] = bb + ms[3] + "]";
						t.input.push(", - 下一个参数", "] - 结束参数");
					}
					for (i in mr.assist) if (!(i in t.recommend)) t.recommend[i] = ps + mr.assist[i];
					for (i in mr.recommend) if (!(i in t.recommend)) t.recommend[i] = bb + mr.recommend[i];
					for (i in mr.output) if (!(i in t.recommend)) t.recommend[i] = bb + mr.output[i];
					for (i in mr.menu) if (!(i in t.menu)) t.menu[i] = mr.menu[i];
					for (i in mr.input) if (t.input.indexOf(mr.input[i]) < 0) t.input.push(mr.input[i]);
				} else {
					t.recommend[", - 下一个参数"] = bb + ms[3] + ",";
					t.output["] - 结束参数"] = bb + ms[3] + "]";
					t.input.push(", - 下一个参数", "] - 结束参数");
				}
			} else { //输入修饰符名称
				if (ms[1]) {
					t.recommend["= - 输入参数"] = bb + ms[1] + "=";
					t.input.push("= - 输入参数");
				}
				Object.keys(this.library.selectors).forEach(function(e, i, a) {
					if (!e.startsWith(ms[1])) return;
					if (pl[e]) return;
					t.recommend[e + " - " + this.library.selectors[e].name] = bb + e + "=";
					t.input.push(e + " - " + this.library.selectors[e].name);
				}, this);
			}
		} else if (c[4]) {
			//输入完毕
			t = {
				length : (ms = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "))).length,
				canFinish : true
			};
		} else return {
			description : c[0] + "不是合法的选择器"
		};
		return t;
	},
	procPosition : function(cp, ps) {
		var l = ps.split(/\s+/), f = true, uv = false, i, n = Math.min(l.length, 3), t, pp, t2, t3;
		for (i = 0; i < n; i++) {
			if (i == 0 && l[0].startsWith("^") && CA.hasFeature("enableLocalCoord")) uv = true;
			if (!(t = (uv ? /^(?:(\^)((\+|-)?(\d*\.)?\d*))?$/ : /^(~)?((\+|-)?(\d*\.)?\d*)$/).exec(l[i]))) return {
				description : l[i] + "不是合法的坐标值"
			};
			if ((!t[1] || t[2]) && !(/^(\+|-)?(\d*\.)?\d+$/).test(t[2])) if (i == n - 1) {
				f = false;
			} else return {
				description : l[i] + "不是合法的坐标值"
			};
		}
		t = {
			length : n == 3 && l[2].length > 0 ? (/^\S+\s+\S+\s+\S+/).exec(ps)[0].length : ps.length,
			input : [],
			assist : {},
			canFinish : f && n == 3,
			uv : uv
		}
		if (l[n - 1].length > 0) {
			if (n < 3) {
				t.input.push("  - 空格");
				t.assist["  - 空格"] = " ";
			}
		} else {
			if (!uv) {
				t.input.push("~ - 相对坐标");
				t.assist["~ - 相对坐标"] = "~";
			}
			if ((ps.length == 0 || uv) && CA.hasFeature("enableLocalCoord")) {
				t.input.push("^ - 局部坐标(^左 ^上 ^前)");
				t.assist["^ - 局部坐标(^左 ^上 ^前)"] = "^";
			}
		}
		if (MCAdapter.available()) {
			t.output = {};
			pp = MCAdapter.getInfo("playerposition").slice();
			if (pp && pp[1] != 0) {
				pp[1] -= 1.619999885559082;
				t2 = pp.join(" ");
				t.output[t2 + " - 玩家实际坐标"] = t2;
				t2 = [Math.floor(pp[0]), Math.floor(pp[1]), Math.floor(pp[2])].join(" ");
				t.output[t2 + " - 玩家脚部方块坐标"] = t2;
				t2 = [Math.floor(pp[0]), Math.floor(pp[1] + 1), Math.floor(pp[2])].join(" ");
				t.output[t2 + " - 玩家头部方块坐标"] = t2;
				t2 = [Math.floor(pp[0]), Math.floor(pp[1] - 1), Math.floor(pp[2])].join(" ");
				t.output[t2 + " - 玩家脚下方块坐标"] = t2;
				pp = MCAdapter.getInfo("pointedblockpos");
				if (pp && pp[1] >= 0) {
					t2 = pp.join(" ");
					t.output[t2 + " - 玩家指向方块坐标"] = t2;
				}
			}
			t.input = t.input.concat(Object.keys(t.output));
		} else MCAdapter.applySense(t);
		return t;
	},
	matchString : function(ps, a, r) {
		var t, t2, t3;
		if (!(r instanceof Object)) r = {};
		if (!Array.isArray(r.input)) r.input = [];
		if (!(r.output instanceof Object)) r.output = {};
		if (Array.isArray(a)) {
			t = [];
			a.forEach(function(e) {
				if (e.indexOf(ps) < 0) return;
				r.output[e] = e;
				if (r.input.indexOf(e) < 0) t.push(e);
			});
			t.sort();
			r.input = r.input.concat(t);
		} else {
			t = []; t2 = [];
			Object.keys(a).forEach(function(e) {
				if (e.indexOf(ps) < 0 && a[e].indexOf(ps) < 0) return;
				if (a[e]) {
					t3 = e + " - " + a[e];
					r.output[t3] = e;
					if (r.input.indexOf(t3) < 0) t.push(t3);
				} else {
					r.output[e] = e;
					if (r.input.indexOf(e) < 0) t2.push(e);
				}
			});
			t.sort(); t2.sort();
			r.input = r.input.concat(t, t2);
		}
		return r;
	},
	assistJSON : function(param) {
		CA.Assist.editParamJSON({
			param : param
		}, function(text) {
			CA.cmd.getText().append(text);
		});
	},
	showHelp : function() {
		var pp = new G.SpannableStringBuilder();
		this.source = "/help";
		this.cmdname = "help";
		this.hasSlash = true;
		this.strParam = "";
		this.output = {
			"设置" : function() {
				CA.showSettings();
			},
			"关于命令助手..." : function() {
				if (CA.settings.splitScreenMode) return;
				CA.showAssist.linear.setTranslationX(CA.showAssist.tx = -CA.showAssist.screenWidth);
				CA.showAssist.hCheck();
				if (CA.settings.noAnimation) return;
				var animation = new G.TranslateAnimation(G.Animation.ABSOLUTE, CA.showAssist.screenWidth, G.Animation.ABSOLUTE, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0);
				animation.setDuration(200);
				CA.showAssist.linear.startAnimation(animation);
			},
			"查看中文Wiki" : function() {
				try {
					AndroidBridge.startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("https://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4"))
						.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
				} catch(e) {
					Common.showWebViewDialog({
						url : "https://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4"
					});
				}
			},
			"意见反馈" : function() {
				GiteeFeedback.showFeedbacks();
			}
		};
		this.input = Object.keys(this.output);
		pp.append("命令助手 - 设置 & 关于\n");
		appendSSB(pp, "（这个命令的用途是显示帮助，不过你有这个工具就不需要帮助了吧）", new G.ForegroundColorSpan(Common.theme.promptcolor));
		this.prompt = [pp];
		this.help = "https://ca.projectxero.top/blog/about/";
		this.patterns = [];
		return this.apply();
	},
	show : function self() {G.ui(function() {try {
		if (CA.IntelliSense.ui) return;
		if (!self.prompt) {
			self.adptcon = null;
			self.apply = function(z) {G.ui(function() {try {
				self.prompt.setText(z.prompt[0] || "");
				try {
					new java.net.URL(z.help);
					CA.showAssist.postHelp(0, z.help);
				} catch(e) {
					CA.showAssist.postHelp(1, z.help || "暂时没有帮助，以后会加上的啦");
				}
				if (self.adptcon) {
					self.adptcon.setArray(z.input);
				} else {
					var a = new SimpleListAdapter(z.input.slice(), self.vmaker, self.vbinder, null, true);
					self.adptcon = SimpleListAdapter.getController(a);
					self.list.setAdapter(a);
				}
			} catch(e) {erp(e)}})}
			self.vmaker = function(holder) {
				var view = new G.TextView(ctx);
				view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				Common.applyStyle(view, "textview_default", 3);
				return view;
			}
			self.vbinder = function(holder, s, i, a) {
				if (self.keep) {
					holder.self.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
				} else {
					holder.self.setPadding(15 * G.dp, 2 * G.dp, 15 * G.dp, 2 * G.dp);
				}
				holder.self.setText(s);
			}
			self.prompt = new G.TextView(ctx);
			self.prompt.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
			self.prompt.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
			self.prompt.setTypeface(G.Typeface.MONOSPACE || G.Typeface.DEFAULT);
			self.prompt.setLineSpacing(10, 1);
			Common.applyStyle(self.prompt, "textview_default", 2);
			self.list = new G.ListView(ctx);
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				if (pos == 0) {
					CA.IntelliSense.showMoreUsage();
					return;
				}
				var a = CA.IntelliSense.output[CA.IntelliSense.input[pos - parent.getHeaderViewsCount()]];
				if (a instanceof Function) {
					a();
				} else if (a) {
					CA.cmd.setText(String(a));
					CA.showGen.activate(false);
				}
			} catch(e) {erp(e)}}}));
			self.list.setOnItemLongClickListener(new G.AdapterView.OnItemLongClickListener({onItemLongClick : function(parent, view, pos, id) {try {
				if (pos == 0) {
					CA.IntelliSense.showMoreUsage();
					return true;
				}
				var a = CA.IntelliSense.output[CA.IntelliSense.input[pos - parent.getHeaderViewsCount()]];
				if (a && !(a instanceof Function)) {
					var rect, metrics = Common.getMetrics();
					if (self.lastToast) self.lastToast.cancel();
					self.lastToast = G.Toast.makeText(ctx, String(a), 0);
					view.getGlobalVisibleRect(rect = new G.Rect());
					self.lastToast.setGravity(G.Gravity.CENTER, rect.centerX() - metrics[0] / 2, rect.centerY() - metrics[1] / 2);
					self.lastToast.show();
				}
				return true;
			} catch(e) {return erp(e), true}}}));
			self.list.addOnLayoutChangeListener(new G.View.OnLayoutChangeListener({onLayoutChange : function(v, l, t, r, b, ol, ot, or, ob) {try {
				var t = (b - t > Common.theme.textsize[3] * G.sp * 8) || CA.settings.keepWhenIME;
				if (self.keep == t) return;
				self.keep = t;
				if (t) {
					self.prompt.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
				} else {
					self.prompt.setPadding(20 * G.dp, 2 * G.dp, 20 * G.dp, 2 * G.dp);
				}
				v.post(function() {CA.IntelliSense.apply()});
			} catch(e) {erp(e)}}}));
			self.list.addHeaderView(self.prompt);
			self.list.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1));
			if (G.style == "Material") { //Fixed：Android 5.0以下FastScroller会尝试将RhinoListAdapter强转为BaseAdapter
				self.list.setFastScrollEnabled(true);
				self.list.setFastScrollAlwaysVisible(false);
			}
			CA.showAssist.initContent(self.list);
			PWM.registerResetFlag(CA.IntelliSense, "ui");
			PWM.registerResetFlag(self, "prompt");
		}
		CA.showAssist.con.addView(CA.IntelliSense.ui = self.list);
	} catch(e) {erp(e)}})},
	hide : function() {G.ui(function() {try {
		if (!CA.IntelliSense.ui) return;
		CA.showAssist.con.removeView(CA.IntelliSense.ui);
		CA.IntelliSense.ui = null;
	} catch(e) {erp(e)}})},
	showMoreUsage : function() {
		var pp = new G.SpannableStringBuilder(), i, l = CA.IntelliSense.prompt.length;
		pp.append(this.prompt[0]);
		for (i = 1; i < l; i++) {
			pp.append("\n\n");
			pp.append(this.prompt[i]);
		}
		Common.showTextDialog(pp);
	}
})