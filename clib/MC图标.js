Plugins.inject(function(o) {
o.name = "MC图标";
o.author = "ProjectXero";
o.version = [1, 0, 0];
o.uuid = "06b2fb31-668e-4693-92ad-c0ac8da3e7a9";
o.description = "允许命令助手显示MC的图标";
o.update = "https://projectxero.gitee.io/ca/clib/mcicon.json";
o.feature("userExpressionMenuAppendable");
var Icons = [
	{
		"code": 57504,
		"icon": "iVBORw0KGgoAAAANSUhEUgAAABsAAAAPCAYAAAAVk7TYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACcSURBVDhPY2BgYPhPAQZqJQ38JxUcO3YM5kDSbAL5CgS0lUWJxhFhEeSGBsKybZNiwBYuyrbDwCBxmDzMMgcHh//EYmhUYfrMV1fyPzpG9jlVLAP5CGQJPhpkKTbL6uvr/4MwLp9i+AxmCTafwRxBdctGfYYcPyTHGSzF0SU1Dkg+I1SaUFSCgMo6kAGkYFi+IbVwJLecA+kjCQAAAUNrHL1P7cQAAAAASUVORK5CYII="
	},
	{
		"code": 57505,
		"icon": "iVBORw0KGgoAAAANSUhEUgAAABsAAAAPCAYAAAAVk7TYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACgSURBVDhPY2AgHfwHaiEXk2zbf1LBsWPHYI4j3ZUgy7SVRYnGEWERCMvq6+v/E4tBQQizbNukGLCFi7LtMDBIHCZPFctgvvPVlfyPjpF9TpRlDg4O/0EY2dfIPgP5CGQJPhpkKVUtw+YzmCOobtmoz0A5muhkD0ooyAmEqqkRW96jOJ+RWtZRUoKQWjj+B5V1oLxDCoZ6iFS7SC9LYSEHAFvopW83SHYHAAAAAElFTkSuQmCC"
	},
	{
		"code": 57600,
		"icon": "iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABZSURBVChTY2DADv4DhUEYJ/i/SULi/xUtLZwK/+9oiQAruL+xH6tCsIK5uc5whSAT0a0FKwDh6kDd/4k20litA0viUgDW8ejqKphO7Cb8/36HoJdBYYFXEQCftkOMxJyu4AAAAABJRU5ErkJggg=="
	},
	{
		"code": 57601,
		"icon": "iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABJSURBVChTY2CAgP9QDOViiv1/9vzT/x07jyArxBADK4BhkInofLBVmVkFKBIwRSBxZGdgVYTuTioqAtmPjrEECzysYI4F0WAAAGo7iuFT7s+SAAAAAElFTkSuQmCC"
	},
	{
		"code": 57602,
		"icon": "iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACOSURBVChTY2BAAg5aDP+RsbM2639keTgbJPH/z1kMbK/OgqoBrPDfzf//74hB8KNkFAzXAGLAFJ6ZKYrQANQE5oM0AtlgDWDFYBMlwJIQDchsiG1YFcMUImjKFUPdCHQCyFRkkzdWSECcAQJ++pxQBdDQgIUKUBNIIUZ426gwgCXQMSiSsEYMSAM6RlYIAHH+7pVbSXorAAAAAElFTkSuQmCC"
	}
];
o.init = function() {
	CA.PluginExpression.push({
		text : "MC图标",
		get : function() {
			showMCIcons();
		}
	});
}
function fixZero(s, n) {
    s = String(s);
    return n > s.length ? fixZero("0" + s, n) : s;
}
function showMCIcons() {
	var a;
	showIconChooser(a = Icons.map(function(e) {
		var r = new G.SpannableStringBuilder(String.fromCharCode(e.code));
		r.setSpan(toSpan(e.icon), 0, r.length(), r.SPAN_EXCLUSIVE_EXCLUSIVE);
		return { 
			text : r,
			description : e.description
		};
	}), function(i) {
		Common.replaceSelection(CA.cmd.getText(), a[i].text);
	});
}
function vmaker(holder) {
	var view = new G.TextView(ctx);
	view.setPadding(5 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
	view.setGravity(G.Gravity.CENTER);
	view.setLayoutParams(new G.AbsListView.LayoutParams(-2, -2));
	Common.applyStyle(view, "textview_default", 2);
	return view;
}
function vbinder(holder, e) {
	holder.self.setText(Common.toString(e.text));
}
function showIconChooser(l, callback) {G.ui(function() {try {
	var frame, list, popup;
	frame = new G.FrameLayout(ctx);
	Common.applyStyle(frame, "message_bg");
	list = new G.GridView(ctx);
	list.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -2));
	list.setHorizontalSpacing(20 * G.dp);
	list.setVerticalSpacing(20 * G.dp);
	list.setPadding(20 * G.dp, 20 * G.dp, 20 * G.dp, 20 * G.dp);
	list.setGravity(G.Gravity.CENTER);
	list.setNumColumns(-1);
	list.setStretchMode(2);
	list.setAdapter(new SimpleListAdapter(l, vmaker, vbinder));
	list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
		callback(pos, l);
		popup.dismiss();
	} catch(e) {erp(e)}}}));
	frame.addView(list);
	popup = Common.showDialog(frame, -1, -2);
} catch(e) {erp(e)}})}
function toSpan(base64) {
	var bytes = android.util.Base64.decode(base64, 2);
	var bmp = G.BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
	var pt = new G.Paint(), fontsize = Common.theme.textsize[3];
	pt.setAntiAlias(true);
	pt.setTextSize(fontsize * G.sp);
	pt.setTypeface(G.Typeface.MONOSPACE);
	var fm = pt.getFontMetrics();
	var fitHeight = fm.bottom - fm.top;
	var fitWidth = fitHeight / bmp.getHeight() * bmp.getWidth();
	var bmp2 = G.Bitmap.createScaledBitmap(bmp, fitWidth, fitHeight, false);
	return new G.ImageSpan(ctx, bmp2, 0);
}
})