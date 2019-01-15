"IGNORELN_START";
CA.Library.inner["default"] = Loader.fromFile("builtinLibrarys/default.json");
CA.Library.inner["addition"] = Loader.fromFile("builtinLibrarys/addition.json");
CA.Library.inner["basicedu"] = Loader.fromFile("builtinLibrarys/basicedu.json");

Common.themelist = {
	"light" : {
		"name" : "默认风格"
	},
	"dark" : {
		"name" : "夜间风格",
		"bgcolor" : "#202020",
		"float_bgcolor" : "#404040",
		"message_bgcolor" : "#202020",
		"textcolor" : "#FFFFFF",
		"promptcolor" : "#C0C0C0",
		"highlightcolor" : "#FFFF00",
		"criticalcolor" : "#FFB040",
		"go_bgcolor" : "#616161",
		"go_textcolor" : "#FAFAFA",
		"go_touchbgcolor" : "#EEEEEE",
		"go_touchtextcolor" : "#000000"
	}
	/* 新建主题格式
	"light" : {						//主题ID ： light
		"name" : "默认风格",			//主题名称
		"bgcolor" : "#FAFAFA",		//主界面背景色
		"float_bgcolor" : "#F5F5F5",	//浮动栏（即滑动时与屏幕保持静止的栏）背景色
		"message_bgcolor" : "#FAFAFA",	//浮动界面背景色
		"textcolor" : "#212121",		//普通文本颜色
		"promptcolor" : "#9E9E9E",	//提示文本颜色
		"highlightcolor" : "#0000FF",	//高亮文本颜色
		"criticalcolor" : "#FF0000",	//警示文本颜色
		"go_bgcolor" : "#EEEEEE",	//GO按钮（主要动作按钮）背景色
		"go_textcolor" : "#000000",	//GO按钮文本颜色
		"go_touchbgcolor" : "#616161",	//GO按钮按下时背景色
		"go_touchtextcolor" : "#FAFAFA"	//GO按钮按下时文本颜色
	}
	*/
};

CA.tips = CA.defalutTips = [
	//by Yiro
	"不到万不得已不要把execute指令写入重复命令方块！",
	"善用gamerule指令让你的世界更加精彩~",
	"矿车也属于实体！~",
	"夜视+失明能做出很棒的视觉效果！~",

	//by o绿叶o
	"混凝土方块没有花纹！",
	"可以试试彩色床，转换一下心情～",
	"萤石太好看，所以需要遮住@_@",
	"PE版里没有红石BUD！",
	"输入/summon ~ ~ ~ TNT有惊喜(ಡωಡ)",
	"log除了日志，还有原木的意思@_@",
	"如果穿着附有冰霜行者的鞋子，高处跳水，水不会结冰。",
	"听说下雨天，钓竿和水塘更配哦～",
	"鸡的模型很小，是1/4个方块。",
	"如果莫名其妙被闪电劈中，要怀疑自己是不是说错了话(ಡωಡ)",
	"射出的箭在水中下落时，会很好看(>﹏<)",
	"PE版里红石会自动连接活塞。",
	"村民都是奸商！！！",
	"亮度太低是种不了作物的(ง •̀_•́)ง",
	"冰会融化，浮冰不会。",
	"女巫不止在沼泽生成。",
	"炼药锅可以在雨天存储水。",
	"马、驴需要金萝卜才能生出骡？自己试试不就知道了。",
	"僵尸马不会自然生成。",
	"尽量不要垂直往下挖，否则后果自负（x_x；）",
	"下雪时，树叶会变白٩(๑^o^๑)۶",
	"音符盒的音色取决于它下面的方块。",
	"混凝土、物品栏的花纹都是沙子的花纹……←_←",
	"石镐可以挖掉青金石。",
	"黄金工具的效率更高，但耐久度很低。",

	//by ProjectXero
	"潜影贝只是站错了阵营的好孩子～"
];
"IGNORELN_END";