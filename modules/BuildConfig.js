/*LOADER
	source = "var BuildConfig=" + JSON.stringify(variables.buildConfig);
*/
var BuildConfig = (function() {
	function fixZero(s, n) {
		s = String(s);
		return n > s.length ? fixZero("0" + s, n) : s;
	}
	function getDateString(d) {
		return fixZero(d.getFullYear(), 4) + "-" + fixZero(d.getMonth() + 1, 2) + "-" + fixZero(d.getDate(), 2);
	}
	return {
		date : getDateString(new Date()),
		version : "1.2.9",
		versionCode : [1, 2, 9],
		description : "调试版本",
		publishTime : Date.now(),
		variants : "debug"
	};
})();