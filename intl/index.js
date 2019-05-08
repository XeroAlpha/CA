switch (Intl.lookupLang({
	"zh_CN" : {
		language : "zh",
		country : "CN"
	},
	"en_US" : {
		language : "en",
		country : "US"
	}
})) {
	case "en_US":
	"IGNORELN_START";
	Intl.loadLang({
		language : "en",
		country : "US"
	}, Loader.fromFile("./en_US/main.json"), false);
	"IGNORELN_END";
	break;
	default:
	Intl.loadLang({
		language : "zh",
		country : "CN",
		unspecifiedLang : true
	}, {}, false);
}
//这个分号表示这是个代码块而不是表达式;