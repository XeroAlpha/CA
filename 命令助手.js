"ui";

function attackHook(attacker, victim) {}
function chatHook(str) {}
function continueDestroyBlock(x, y, z, side, progress) {}
function destroyBlock(x, y, z, side) {}
function projectileHitEntityHook(projectile, targetEntity) {}
function eatHook(hearts, saturationRatio) {}
function entityAddedHook(entity) {}
function entityHurtHook(attacker, victim, halfhearts) {}
function entityRemovedHook(entity) {}
function explodeHook(entity, x, y, z, power, onFire) {}
function serverMessageReceiveHook(str) {}
function deathHook(attacker, victim) {}
function playerAddExpHook(player, experienceAdded) {}
function playerExpLevelChangeHook(player, levelsAdded) {}
function redstoneUpdateHook(x, y, z, newCurrent, someBooleanIDontKnow, blockId, blockData) {}
function screenChangeHook(screenName) {}
function newLevel() {}
function startDestroyBlock(x, y, z, side) {}
function projectileHitBlockHook(projectile, blockX, blockY, blockZ, side) {}
function modTick() {}
function leaveGame() {}
function useItem(x, y, z, itemid, blockid, side, itemDamage, blockDamage) {}
function initialize() {}

var MapScript = {
	//世界目录
	baseDir : android.os.Environment.getExternalStorageDirectory().getAbsolutePath() + "/games/com.mojang/minecraftWorlds/",

	//可访问钩子
	hooks : ["attackHook", "chatHook", "continueDestroyBlock", "destroyBlock", "projectileHitEntityHook", "eatHook", "entityAddedHook", "entityHurtHook", "entityRemovedHook", "explodeHook", "serverMessageReceiveHook", "deathHook", "playerAddExpHook", "playerExpLevelChangeHook", "redstoneUpdateHook", "screenChangeHook", "newLevel", "startDestroyBlock", "projectileHitBlockHook", "modTick", "leaveGame", "useItem", "initialize"],

	//全局对象
	global : null,

	//已加载模块列表
	modules : [],

	//重置函数代码
	clearCode : function(func) {
		if (!(func in this) || typeof this[func] != "function") return null;
		var q = this[func].toString();
		q = q.slice(q.indexOf("function"), q.indexOf("{"));
		return this[func] = eval("(" + q + "{})");
	},

	//补充函数代码
	addCode : function(func, code) {
		if (!(func in this) || typeof this[func] != "function") return null;
		var q = this[func].toString();
		q = q.slice(q.indexOf("function"), q.lastIndexOf("}"));
		return this[func] = eval("(" + q + code + "})");
	},

	//读取并解析JSON-EX
	readJSON : function(path, defaultValue, gzipped) {
		try{
			if (!(new java.io.File(path)).isFile()) return defaultValue;
			var rd, s = [], q;
			if (gzipped) {
				rd = new java.io.BufferedReader(new java.io.InputStreamReader(new java.util.zip.GZIPInputStream(new java.io.FileInputStream(path))));
			} else {
				rd = new java.io.BufferedReader(new java.io.FileReader(path));
			}
			while (q = rd.readLine()) s.push(q);
			rd.close();
			return eval("(" + s.join("\n") + ")");
		} catch(e) {
			return defaultValue;
		}
	},

	//保存JSON-EX
	saveJSON : function(path, object, gzipped) {
		var wr;
		var f = new java.io.File(path).getParentFile();
		if (f) f.mkdirs();
		if (gzipped) {
			wr = new java.util.zip.GZIPOutputStream(new java.io.FileOutputStream(path));
		} else {
			wr = new java.io.FileOutputStream(path);
		}
		wr.write(new java.lang.String(this.toSource(object)).getBytes());
		wr.close();
	},

	//加载模块
	loadModule : function(name, obj, ignoreHook) {
		var i, sn, dx = this.modules.indexOf(name);
		if (obj === undefined && dx >= 0) {
			delete this.global[name];
		} else if (!(name in this.global) || dx >= 0) {
			this.global[name] = obj;
			if (dx < 0) this.modules.push(name);
			if (!ignoreHook && (obj instanceof Object)) {
				if (typeof obj.onCreate == "function") obj.onCreate();
				sn = this.toSource(name);
				for (i in obj)
					if (typeof obj[i] == "function" && this.hooks.indexOf(i) >= 0 && this.global[i].length == obj[i].length)
						this.addCode.call(this.global, i, "this[" + sn + "]." + i + ".apply(this[" + sn + "],arguments);");
			}
		} else return false;
		return true;
	},

	//返回对象源代码
	toSource : function(obj) {
		var strtok = ["\\\\", "\\n", "\\t", /*"\\b",*/ "\\r", "\\f", "\\\"", "\\\'"];
		var _toJSON = function toJSON(x, lev) {
			var p = "", r, i;
			if (lev < 0) return String(x);
			if (typeof x == "string") {
				for (i = 0; i < strtok.length; i++) x = x.replace(new RegExp(strtok[i], "g"), strtok[i]);
				return "\"" + x + "\"";
			} else if (Array.isArray(x)) {
				r = new Array();
				for (i = 0; i < x.length; i++) r.push(toJSON(x[i], lev - 1));
				p = "[" + r.join(",") + "]";
			} else if (x instanceof Error) {
				p = "new Error(" + toJSON(x.message) + ")";
			} else if (x instanceof RegExp) {
				p = x.toString();
			} else if (x instanceof Date) {
				p = "new Date(" + x.getTime() + ")";
			} else if (x instanceof Function) {
				p = x.toString();
			} else if (x instanceof Object) {
				r = new Array();
				for (i in x) r.push(toJSON(i, lev) + ":" + toJSON(x[i], lev - 1));
				p = "{" + r.join(",") + "}";
			} else {
				p = String(x);
			}
			return p;
		}
		return _toJSON(obj, 32);
	},

	//初始化
	init : function(g) {
		this.global = g;
		if ("module" in g) { //Node.js
			module.exports = function(name) {
				return g[name];
			}
		}
	},

	initialize : function() {
		this.global.initialize();
	}
}
MapScript.init(this);

MapScript.loadModule("ctx", (function(global) {
	if ("ModPE" in global) { //以ModPE脚本加载(BlockLauncher及衍生App)
		MapScript.host = "BlockLauncher";
		return com.mojang.minecraftpe.MainActivity.currentMainActivity.get();
	} else if ("activity" in global) { //以AutoJS脚本加载
		MapScript.host = "AutoJs";
		return activity;
	} else if ("ScriptActivity" in global) { //以AutoJS脚本加载
		MapScript.host = "Android";
		return ScriptActivity;
	} else {
		MapScript.host = "Unknown";
		return com.mojang.minecraftpe.MainActivity.currentMainActivity.get();
	}
})(this));

MapScript.loadModule("erp", function self(error) {
	if (self.count) {
		self.count++;
	} else {
		self.count = 1;
	}
	if (self.count > 10) return;
	ctx.runOnUiThread(new java.lang.Runnable({run : function() {try {
		var dialog = new android.app.AlertDialog.Builder(ctx);
		var tech = ["版本:{DATE}\n", "错误信息:", error, "\n堆栈:", error.stack, "\n来源:", error.fileName, "\n包名:", ctx.getPackageName(), "\nSDK版本：", android.os.Build.VERSION.SDK_INT].join("");
		if (MapScript.host == "BlockLauncher") tech += "\nMinecraft版本:" + ModPE.getMinecraftVersion();
		dialog.setTitle("错误");
		dialog.setCancelable(false);
		dialog.setMessage("您好，" + error.fileName + "出现了一个错误。您可以将这个错误反馈给我们，来推动这个Mod的更新。您也可以选择忽略。作者联系方式：QQ-814518615(Xero)，盒子ID-4717939(ProjectXero)\n\n错误信息：\n" + tech);
		dialog.setPositiveButton("忽略", new android.content.DialogInterface.OnClickListener({
			onClick : function(dia,w) {
				dia.dismiss();
			}
		}));
		dialog.setNegativeButton("立即停止", new android.content.DialogInterface.OnClickListener({
			onClick : function(dia,w) {
				ctx.finish();
			}
		}));
		dialog.setNeutralButton("复制错误信息", new android.content.DialogInterface.OnClickListener({
			onClick : function(dia,w) {try {
				ctx.getSystemService(ctx.CLIPBOARD_SERVICE).setText(tech);
				android.widget.Toast.makeText(ctx, "错误信息已复制", 0).show();
				dia.dismiss();
			} catch(e) {}}
		}));
		dialog.show();
	} catch(e) {}}}));
});

var lto;
ctx.runOnUiThread(function() {try {
	lto = android.widget.Toast.makeText(ctx, "命令助手 by ProjectXero\n基于Rhino (" + MapScript.host + ")\n加载中……", 1);
	lto.setGravity(android.view.Gravity.CENTER, 0, 0);
	lto.show();
} catch(e) {erp(e)}});

MapScript.loadModule("getMinecraftVersion", function self(force) {
	if (!force && self.ver) return self.ver;
	if (typeof ModPE != "undefined") {
		return self.ver = ModPE.getMinecraftVersion();
	} else {
		try {
			return self.ver = String(ctx.getPackageManager().getPackageInfo("com.mojang.minecraftpe", 0).versionName);
		} catch(e) {
			return self.ver = "*";
		}
	}
});

var loadingThread = new java.lang.Thread(new java.lang.Runnable({run : function() {try { //Async Loading

MapScript.loadModule("G", {
	onCreate : function() {
		var t;
		t = ctx.getResources().getDisplayMetrics();
		this.screenHeight = t.heightPixels;
		this.screenWidth = t.widthPixels;
		this.dp = t.density;
		this.sp = t.scaledDensity;
	},
	initialize : function() {
		if (android.os.Build.VERSION.SDK_INT >= 21) {
			this.style = "Material";
			ctx.setTheme(android.R.style.Theme_Material_Light);
		} else if (android.os.Build.VERSION.SDK_INT >= 11) {
			this.style = "Holo";
			ctx.setTheme(android.R.style.Theme_Holo_Light);
			this.ui(function() {try {
				G.Toast.makeText(ctx, "您的Android版本低于5.0，不支持Material Design风格。已使用Holo风格替换，界面可能与预览图不同。", 1).show();
			} catch(e) {erp(e)}});
		} else {
			this.style = "Basic";
			ctx.setTheme(android.R.style.Theme_Light);
			this.ui(function() {try {
				G.Toast.makeText(ctx, "您的Android版本低于3.0，不支持Material Design风格。已使用安卓默认风格替换，界面可能与预览图不同。", 1).show();
			} catch(e) {erp(e)}});
		}
	},
	AbsListView : android.widget.AbsListView,
	AbsoluteLayout : android.widget.AbsoluteLayout,
	AbsoluteSizeSpan : android.text.style.AbsoluteSizeSpan,
	AbsSavedState : android.view.AbsSavedState,
	AbsSeekBar : android.widget.AbsSeekBar,
	AbsSpinner : android.widget.AbsSpinner,
	AccelerateDecelerateInterpolator : android.view.animation.AccelerateDecelerateInterpolator,
	AccelerateInterpolator : android.view.animation.AccelerateInterpolator,
	AcousticEchoCanceler : android.media.audiofx.AcousticEchoCanceler,
	ActionMode : android.view.ActionMode,
	ActionProvider : android.view.ActionProvider,
	Adapter : android.widget.Adapter,
	AdapterView : android.widget.AdapterView,
	AdapterViewAnimator : android.widget.AdapterViewAnimator,
	AdapterViewFlipper : android.widget.AdapterViewFlipper,
	Advanceable : android.widget.Advanceable,
	AlertDialog : android.app.AlertDialog,
	AlignmentSpan : android.text.style.AlignmentSpan,
	AlphaAnimation : android.view.animation.AlphaAnimation,
	AlphabetIndexer : android.widget.AlphabetIndexer,
	AlteredCharSequence : android.text.AlteredCharSequence,
	AnalogClock : android.widget.AnalogClock,
	AndroidCharacter : android.text.AndroidCharacter,
	Animation : android.view.animation.Animation,
	AnimationDrawable : android.graphics.drawable.AnimationDrawable,
	AnimationSet : android.view.animation.AnimationSet,
	AnimationUtils : android.view.animation.AnimationUtils,
	Animator : android.animation.Animator,
	AnimatorInflater : android.animation.AnimatorInflater,
	AnimatorListenerAdapter : android.animation.AnimatorListenerAdapter,
	AnimatorSet : android.animation.AnimatorSet,
	Annotation : android.text.Annotation,
	AnticipateInterpolator : android.view.animation.AnticipateInterpolator,
	AnticipateOvershootInterpolator : android.view.animation.AnticipateOvershootInterpolator,
	ArcShape : android.graphics.drawable.shapes.ArcShape,
	ArgbEvaluator : android.animation.ArgbEvaluator,
	ArrayAdapter : android.widget.ArrayAdapter,
	ArrowKeyMovementMethod : android.text.method.ArrowKeyMovementMethod,
	AsyncPlayer : android.media.AsyncPlayer,
	AudioEffect : android.media.audiofx.AudioEffect,
	AudioFormat : android.media.AudioFormat,
	AudioManager : android.media.AudioManager,
	AudioRecord : android.media.AudioRecord,
	AudioTimestamp : android.media.AudioTimestamp,
	AudioTrack : android.media.AudioTrack,
	AutoCompleteTextView : android.widget.AutoCompleteTextView,
	AutomaticGainControl : android.media.audiofx.AutomaticGainControl,
	AutoText : android.text.AutoText,
	AvoidXfermode : android.graphics.AvoidXfermode,
	BackgroundColorSpan : android.text.style.BackgroundColorSpan,
	Base64 : android.util.Base64,
	Base64InputStream : android.util.Base64InputStream,
	Base64OutputStream : android.util.Base64OutputStream,
	BaseAdapter : android.widget.BaseAdapter,
	BaseExpandableListAdapter : android.widget.BaseExpandableListAdapter,
	BaseInputConnection : android.view.inputmethod.BaseInputConnection,
	BaseKeyListener : android.text.method.BaseKeyListener,
	BaseMovementMethod : android.text.method.BaseMovementMethod,
	BassBoost : android.media.audiofx.BassBoost,
	BidiFormatter : android.text.BidiFormatter,
	Bitmap : android.graphics.Bitmap,
	BitmapDrawable : android.graphics.drawable.BitmapDrawable,
	BitmapFactory : android.graphics.BitmapFactory,
	BitmapRegionDecoder : android.graphics.BitmapRegionDecoder,
	BitmapShader : android.graphics.BitmapShader,
	BlurMaskFilter : android.graphics.BlurMaskFilter,
	BoringLayout : android.text.BoringLayout,
	BounceInterpolator : android.view.animation.BounceInterpolator,
	BulletSpan : android.text.style.BulletSpan,
	Button : android.widget.Button,
	CalendarView : android.widget.CalendarView,
	CamcorderProfile : android.media.CamcorderProfile,
	Camera : android.graphics.Camera,
	CameraProfile : android.media.CameraProfile,
	Canvas : android.graphics.Canvas,
	CharacterPickerDialog : android.text.method.CharacterPickerDialog,
	CharacterStyle : android.text.style.CharacterStyle,
	Checkable : android.widget.Checkable,
	CheckBox : android.widget.CheckBox,
	CheckedTextView : android.widget.CheckedTextView,
	Choreographer : android.view.Choreographer,
	Chronometer : android.widget.Chronometer,
	ClickableSpan : android.text.style.ClickableSpan,
	ClientCertRequest : android.webkit.ClientCertRequest,
	ClipboardManager : android.text.ClipboardManager,
	ClipDrawable : android.graphics.drawable.ClipDrawable,
	CollapsibleActionView : android.view.CollapsibleActionView,
	Color : android.graphics.Color,
	ColorDrawable : android.graphics.drawable.ColorDrawable,
	ColorFilter : android.graphics.ColorFilter,
	ColorMatrix : android.graphics.ColorMatrix,
	ColorMatrixColorFilter : android.graphics.ColorMatrixColorFilter,
	CompletionInfo : android.view.inputmethod.CompletionInfo,
	ComposePathEffect : android.graphics.ComposePathEffect,
	ComposeShader : android.graphics.ComposeShader,
	CompoundButton : android.widget.CompoundButton,
	ConsoleMessage : android.webkit.ConsoleMessage,
	Context : android.content.Context,
	ContextMenu : android.view.ContextMenu,
	ContextThemeWrapper : android.view.ContextThemeWrapper,
	CookieManager : android.webkit.CookieManager,
	CornerPathEffect : android.graphics.CornerPathEffect,
	CorrectionInfo : android.view.inputmethod.CorrectionInfo,
	CursorAdapter : android.widget.CursorAdapter,
	CursorTreeAdapter : android.widget.CursorTreeAdapter,
	CycleInterpolator : android.view.animation.CycleInterpolator,
	DashPathEffect : android.graphics.DashPathEffect,
	DateKeyListener : android.text.method.DateKeyListener,
	DatePicker : android.widget.DatePicker,
	DateSorter : android.webkit.DateSorter,
	DateTimeKeyListener : android.text.method.DateTimeKeyListener,
	DecelerateInterpolator : android.view.animation.DecelerateInterpolator,
	DialerFilter : android.widget.DialerFilter,
	DialerKeyListener : android.text.method.DialerKeyListener,
	DialogInterface : android.content.DialogInterface,
	DigitalClock : android.widget.DigitalClock,
	DigitsKeyListener : android.text.method.DigitsKeyListener,
	DiscretePathEffect : android.graphics.DiscretePathEffect,
	Display : android.view.Display,
	DownloadListener : android.webkit.DownloadListener,
	DragEvent : android.view.DragEvent,
	Drawable : android.graphics.drawable.Drawable,
	DrawableContainer : android.graphics.drawable.DrawableContainer,
	DrawableMarginSpan : android.text.style.DrawableMarginSpan,
	DrawFilter : android.graphics.DrawFilter,
	DynamicDrawableSpan : android.text.style.DynamicDrawableSpan,
	DynamicLayout : android.text.DynamicLayout,
	EasyEditSpan : android.text.style.EasyEditSpan,
	EdgeEffect : android.widget.EdgeEffect,
	Editable : android.text.Editable,
	EditorInfo : android.view.inputmethod.EditorInfo,
	EditText : android.widget.EditText,
	EmbossMaskFilter : android.graphics.EmbossMaskFilter,
	EnvironmentalReverb : android.media.audiofx.EnvironmentalReverb,
	Equalizer : android.media.audiofx.Equalizer,
	ExifInterface : android.media.ExifInterface,
	ExpandableListAdapter : android.widget.ExpandableListAdapter,
	ExpandableListView : android.widget.ExpandableListView,
	ExtractedText : android.view.inputmethod.ExtractedText,
	ExtractedTextRequest : android.view.inputmethod.ExtractedTextRequest,
	FaceDetector : android.media.FaceDetector,
	Filter : android.widget.Filter,
	Filterable : android.widget.Filterable,
	FilterQueryProvider : android.widget.FilterQueryProvider,
	FloatEvaluator : android.animation.FloatEvaluator,
	FocusFinder : android.view.FocusFinder,
	ForegroundColorSpan : android.text.style.ForegroundColorSpan,
	FrameLayout : android.widget.FrameLayout,
	Gallery : android.widget.Gallery,
	GeolocationPermissions : android.webkit.GeolocationPermissions,
	GestureDetector : android.view.GestureDetector,
	GetChars : android.text.GetChars,
	GradientDrawable : android.graphics.drawable.GradientDrawable,
	Gravity : android.view.Gravity,
	GridLayout : android.widget.GridLayout,
	GridLayoutAnimationController : android.view.animation.GridLayoutAnimationController,
	GridView : android.widget.GridView,
	HapticFeedbackConstants : android.view.HapticFeedbackConstants,
	HeaderViewListAdapter : android.widget.HeaderViewListAdapter,
	HeterogeneousExpandableList : android.widget.HeterogeneousExpandableList,
	HideReturnsTransformationMethod : android.text.method.HideReturnsTransformationMethod,
	HorizontalScrollView : android.widget.HorizontalScrollView,
	Html : android.text.Html,
	HttpAuthHandler : android.webkit.HttpAuthHandler,
	IconMarginSpan : android.text.style.IconMarginSpan,
	Image : android.media.Image,
	ImageButton : android.widget.ImageButton,
	ImageFormat : android.graphics.ImageFormat,
	ImageReader : android.media.ImageReader,
	ImageSpan : android.text.style.ImageSpan,
	ImageSwitcher : android.widget.ImageSwitcher,
	ImageView : android.widget.ImageView,
	InputBinding : android.view.inputmethod.InputBinding,
	InputConnection : android.view.inputmethod.InputConnection,
	InputConnectionWrapper : android.view.inputmethod.InputConnectionWrapper,
	InputDevice : android.view.InputDevice,
	InputEvent : android.view.InputEvent,
	InputFilter : android.text.InputFilter,
	InputMethod : android.view.inputmethod.InputMethod,
	InputMethodInfo : android.view.inputmethod.InputMethodInfo,
	InputMethodManager : android.view.inputmethod.InputMethodManager,
	InputMethodSession : android.view.inputmethod.InputMethodSession,
	InputMethodSubtype : android.view.inputmethod.InputMethodSubtype,
	InputQueue : android.view.InputQueue,
	InputType : android.text.InputType,
	InsetDrawable : android.graphics.drawable.InsetDrawable,
	Intent : android.content.Intent,
	Interpolator : android.graphics.Interpolator,
	IntEvaluator : android.animation.IntEvaluator,
	JetPlayer : android.media.JetPlayer,
	JsPromptResult : android.webkit.JsPromptResult,
	JsResult : android.webkit.JsResult,
	KeyCharacterMap : android.view.KeyCharacterMap,
	KeyEvent : android.view.KeyEvent,
	Keyframe : android.animation.Keyframe,
	KeyListener : android.text.method.KeyListener,
	LayerDrawable : android.graphics.drawable.LayerDrawable,
	LayerRasterizer : android.graphics.LayerRasterizer,
	Layout : android.text.Layout,
	LayoutAnimationController : android.view.animation.LayoutAnimationController,
	LayoutDirection : android.util.LayoutDirection,
	LayoutInflater : android.view.LayoutInflater,
	LayoutTransition : android.animation.LayoutTransition,
	LeadingMarginSpan : android.text.style.LeadingMarginSpan,
	LevelListDrawable : android.graphics.drawable.LevelListDrawable,
	LightingColorFilter : android.graphics.LightingColorFilter,
	LinearGradient : android.graphics.LinearGradient,
	LinearInterpolator : android.view.animation.LinearInterpolator,
	LinearLayout : android.widget.LinearLayout,
	LineBackgroundSpan : android.text.style.LineBackgroundSpan,
	LineHeightSpan : android.text.style.LineHeightSpan,
	LinkMovementMethod : android.text.method.LinkMovementMethod,
	ListAdapter : android.widget.ListAdapter,
	ListPopupWindow : android.widget.ListPopupWindow,
	ListView : android.widget.ListView,
	LocaleSpan : android.text.style.LocaleSpan,
	LoginFilter : android.text.LoginFilter,
	LoudnessEnhancer : android.media.audiofx.LoudnessEnhancer,
	MaskFilter : android.graphics.MaskFilter,
	MaskFilterSpan : android.text.style.MaskFilterSpan,
	Matrix : android.graphics.Matrix,
	MediaActionSound : android.media.MediaActionSound,
	MediaCodec : android.media.MediaCodec,
	MediaCodecInfo : android.media.MediaCodecInfo,
	MediaCodecList : android.media.MediaCodecList,
	MediaController : android.widget.MediaController,
	MediaCrypto : android.media.MediaCrypto,
	MediaDrm : android.media.MediaDrm,
	MediaExtractor : android.media.MediaExtractor,
	MediaFormat : android.media.MediaFormat,
	MediaMetadataEditor : android.media.MediaMetadataEditor,
	MediaMetadataRetriever : android.media.MediaMetadataRetriever,
	MediaMuxer : android.media.MediaMuxer,
	MediaPlayer : android.media.MediaPlayer,
	MediaRecorder : android.media.MediaRecorder,
	MediaRouter : android.media.MediaRouter,
	MediaScannerConnection : android.media.MediaScannerConnection,
	MediaSyncEvent : android.media.MediaSyncEvent,
	Menu : android.view.Menu,
	MenuInflater : android.view.MenuInflater,
	MenuItem : android.view.MenuItem,
	MetaKeyKeyListener : android.text.method.MetaKeyKeyListener,
	MetricAffectingSpan : android.text.style.MetricAffectingSpan,
	MimeTypeMap : android.webkit.MimeTypeMap,
	MotionEvent : android.view.MotionEvent,
	MovementMethod : android.text.method.MovementMethod,
	Movie : android.graphics.Movie,
	MultiAutoCompleteTextView : android.widget.MultiAutoCompleteTextView,
	MultiTapKeyListener : android.text.method.MultiTapKeyListener,
	NinePatch : android.graphics.NinePatch,
	NinePatchDrawable : android.graphics.drawable.NinePatchDrawable,
	NoCopySpan : android.text.NoCopySpan,
	NoiseSuppressor : android.media.audiofx.NoiseSuppressor,
	NumberKeyListener : android.text.method.NumberKeyListener,
	NumberPicker : android.widget.NumberPicker,
	ObjectAnimator : android.animation.ObjectAnimator,
	OrientationEventListener : android.view.OrientationEventListener,
	OrientationListener : android.view.OrientationListener,
	OvalShape : android.graphics.drawable.shapes.OvalShape,
	OvershootInterpolator : android.view.animation.OvershootInterpolator,
	OverScroller : android.widget.OverScroller,
	Paint : android.graphics.Paint,
	PaintDrawable : android.graphics.drawable.PaintDrawable,
	PaintFlagsDrawFilter : android.graphics.PaintFlagsDrawFilter,
	ParagraphStyle : android.text.style.ParagraphStyle,
	ParcelableSpan : android.text.ParcelableSpan,
	PasswordTransformationMethod : android.text.method.PasswordTransformationMethod,
	Path : android.graphics.Path,
	PathDashPathEffect : android.graphics.PathDashPathEffect,
	PathEffect : android.graphics.PathEffect,
	PathMeasure : android.graphics.PathMeasure,
	PathShape : android.graphics.drawable.shapes.PathShape,
	PermissionRequest : android.webkit.PermissionRequest,
	Picture : android.graphics.Picture,
	PictureDrawable : android.graphics.drawable.PictureDrawable,
	PixelFormat : android.graphics.PixelFormat,
	PixelXorXfermode : android.graphics.PixelXorXfermode,
	PluginStub : android.webkit.PluginStub,
	Point : android.graphics.Point,
	PointF : android.graphics.PointF,
	PopupMenu : android.widget.PopupMenu,
	PopupWindow : android.widget.PopupWindow,
	PorterDuff : android.graphics.PorterDuff,
	PorterDuffColorFilter : android.graphics.PorterDuffColorFilter,
	PorterDuffXfermode : android.graphics.PorterDuffXfermode,
	PresetReverb : android.media.audiofx.PresetReverb,
	ProgressBar : android.widget.ProgressBar,
	PropertyValuesHolder : android.animation.PropertyValuesHolder,
	QuickContactBadge : android.widget.QuickContactBadge,
	QuoteSpan : android.text.style.QuoteSpan,
	QwertyKeyListener : android.text.method.QwertyKeyListener,
	RadialGradient : android.graphics.RadialGradient,
	RadioButton : android.widget.RadioButton,
	RadioGroup : android.widget.RadioGroup,
	Rasterizer : android.graphics.Rasterizer,
	RasterizerSpan : android.text.style.RasterizerSpan,
	Rating : android.media.Rating,
	RatingBar : android.widget.RatingBar,
	Rect : android.graphics.Rect,
	RectEvaluator : android.animation.RectEvaluator,
	RectF : android.graphics.RectF,
	RectShape : android.graphics.drawable.shapes.RectShape,
	Region : android.graphics.Region,
	RegionIterator : android.graphics.RegionIterator,
	RelativeLayout : android.widget.RelativeLayout,
	RelativeSizeSpan : android.text.style.RelativeSizeSpan,
	RemoteControlClient : android.media.RemoteControlClient,
	RemoteController : android.media.RemoteController,
	RemoteViews : android.widget.RemoteViews,
	RemoteViewsService : android.widget.RemoteViewsService,
	ReplacementSpan : android.text.style.ReplacementSpan,
	ReplacementTransformationMethod : android.text.method.ReplacementTransformationMethod,
	ResourceCursorAdapter : android.widget.ResourceCursorAdapter,
	ResourceCursorTreeAdapter : android.widget.ResourceCursorTreeAdapter,
	Ringtone : android.media.Ringtone,
	RingtoneManager : android.media.RingtoneManager,
	RotateAnimation : android.view.animation.RotateAnimation,
	RotateDrawable : android.graphics.drawable.RotateDrawable,
	RoundRectShape : android.graphics.drawable.shapes.RoundRectShape,
	ScaleAnimation : android.view.animation.ScaleAnimation,
	ScaleDrawable : android.graphics.drawable.ScaleDrawable,
	ScaleGestureDetector : android.view.ScaleGestureDetector,
	ScaleXSpan : android.text.style.ScaleXSpan,
	Scroller : android.widget.Scroller,
	ScrollingMovementMethod : android.text.method.ScrollingMovementMethod,
	ScrollView : android.widget.ScrollView,
	SearchView : android.widget.SearchView,
	SectionIndexer : android.widget.SectionIndexer,
	SeekBar : android.widget.SeekBar,
	Selection : android.text.Selection,
	Shader : android.graphics.Shader,
	Shape : android.graphics.drawable.shapes.Shape,
	ShapeDrawable : android.graphics.drawable.ShapeDrawable,
	ShareActionProvider : android.widget.ShareActionProvider,
	SimpleAdapter : android.widget.SimpleAdapter,
	SimpleCursorAdapter : android.widget.SimpleCursorAdapter,
	SimpleCursorTreeAdapter : android.widget.SimpleCursorTreeAdapter,
	SimpleExpandableListAdapter : android.widget.SimpleExpandableListAdapter,
	SingleLineTransformationMethod : android.text.method.SingleLineTransformationMethod,
	SlidingDrawer : android.widget.SlidingDrawer,
	SoundEffectConstants : android.view.SoundEffectConstants,
	SoundPool : android.media.SoundPool,
	Space : android.widget.Space,
	Spannable : android.text.Spannable,
	SpannableString : android.text.SpannableString,
	SpannableStringBuilder : android.text.SpannableStringBuilder,
	Spanned : android.text.Spanned,
	SpannedString : android.text.SpannedString,
	SpanWatcher : android.text.SpanWatcher,
	Spinner : android.widget.Spinner,
	SpinnerAdapter : android.widget.SpinnerAdapter,
	SslErrorHandler : android.webkit.SslErrorHandler,
	StackView : android.widget.StackView,
	StateListDrawable : android.graphics.drawable.StateListDrawable,
	StaticLayout : android.text.StaticLayout,
	StrikethroughSpan : android.text.style.StrikethroughSpan,
	StyleSpan : android.text.style.StyleSpan,
	SubMenu : android.view.SubMenu,
	SubscriptSpan : android.text.style.SubscriptSpan,
	SuggestionSpan : android.text.style.SuggestionSpan,
	SumPathEffect : android.graphics.SumPathEffect,
	SuperscriptSpan : android.text.style.SuperscriptSpan,
	Surface : android.view.Surface,
	SurfaceHolder : android.view.SurfaceHolder,
	SurfaceTexture : android.graphics.SurfaceTexture,
	SurfaceView : android.view.SurfaceView,
	SweepGradient : android.graphics.SweepGradient,
	Switch : android.widget.Switch,
	TabHost : android.widget.TabHost,
	TableLayout : android.widget.TableLayout,
	TableRow : android.widget.TableRow,
	TabStopSpan : android.text.style.TabStopSpan,
	TabWidget : android.widget.TabWidget,
	TextAppearanceSpan : android.text.style.TextAppearanceSpan,
	TextClock : android.widget.TextClock,
	TextDirectionHeuristic : android.text.TextDirectionHeuristic,
	TextDirectionHeuristics : android.text.TextDirectionHeuristics,
	TextKeyListener : android.text.method.TextKeyListener,
	TextPaint : android.text.TextPaint,
	TextSwitcher : android.widget.TextSwitcher,
	TextureView : android.view.TextureView,
	TextUtils : android.text.TextUtils,
	TextView : android.widget.TextView,
	TextWatcher : android.text.TextWatcher,
	ThumbnailUtils : android.media.ThumbnailUtils,
	TimeAnimator : android.animation.TimeAnimator,
	TimedText : android.media.TimedText,
	TimeInterpolator : android.animation.TimeInterpolator,
	TimeKeyListener : android.text.method.TimeKeyListener,
	TimePicker : android.widget.TimePicker,
	Toast : android.widget.Toast,
	ToggleButton : android.widget.ToggleButton,
	ToneGenerator : android.media.ToneGenerator,
	Touch : android.text.method.Touch,
	TouchDelegate : android.view.TouchDelegate,
	Transformation : android.view.animation.Transformation,
	TransformationMethod : android.text.method.TransformationMethod,
	TransitionDrawable : android.graphics.drawable.TransitionDrawable,
	TranslateAnimation : android.view.animation.TranslateAnimation,
	TwoLineListItem : android.widget.TwoLineListItem,
	TypeEvaluator : android.animation.TypeEvaluator,
	Typeface : android.graphics.Typeface,
	TypefaceSpan : android.text.style.TypefaceSpan,
	UnderlineSpan : android.text.style.UnderlineSpan,
	UpdateAppearance : android.text.style.UpdateAppearance,
	UpdateLayout : android.text.style.UpdateLayout,
	Uri : android.net.Uri,
	URLSpan : android.text.style.URLSpan,
	URLUtil : android.webkit.URLUtil,
	ValueAnimator : android.animation.ValueAnimator,
	ValueCallback : android.webkit.ValueCallback,
	VelocityTracker : android.view.VelocityTracker,
	VideoView : android.widget.VideoView,
	View : android.view.View,
	ViewAnimator : android.widget.ViewAnimator,
	ViewConfiguration : android.view.ViewConfiguration,
	ViewDebug : android.view.ViewDebug,
	ViewFlipper : android.widget.ViewFlipper,
	ViewGroup : android.view.ViewGroup,
	ViewGroupOverlay : android.view.ViewGroupOverlay,
	ViewManager : android.view.ViewManager,
	ViewOverlay : android.view.ViewOverlay,
	ViewParent : android.view.ViewParent,
	ViewPropertyAnimator : android.view.ViewPropertyAnimator,
	ViewStub : android.view.ViewStub,
	ViewSwitcher : android.widget.ViewSwitcher,
	ViewTreeObserver : android.view.ViewTreeObserver,
	Virtualizer : android.media.audiofx.Virtualizer,
	Visualizer : android.media.audiofx.Visualizer,
	WebBackForwardList : android.webkit.WebBackForwardList,
	WebChromeClient : android.webkit.WebChromeClient,
	WebHistoryItem : android.webkit.WebHistoryItem,
	WebResourceRequest : android.webkit.WebResourceRequest,
	WebResourceResponse : android.webkit.WebResourceResponse,
	WebSettings : android.webkit.WebSettings,
	WebStorage : android.webkit.WebStorage,
	WebView : android.webkit.WebView,
	WebViewClient : android.webkit.WebViewClient,
	WebViewDatabase : android.webkit.WebViewDatabase,
	WebViewFragment : android.webkit.WebViewFragment,
	Window : android.view.Window,
	WindowId : android.view.WindowId,
	WindowManager : android.view.WindowManager,
	WrapperListAdapter : android.widget.WrapperListAdapter,
	WrapTogetherSpan : android.text.style.WrapTogetherSpan,
	Xfermode : android.graphics.Xfermode,
	Xml : android.util.Xml,
	YuvImage : android.graphics.YuvImage,
	ZoomButton : android.widget.ZoomButton,
	ZoomButtonsController : android.widget.ZoomButtonsController,
	ZoomControls : android.widget.ZoomControls,
	ui : function(f) {
		ctx.runOnUiThread(f);
	}
});

MapScript.loadModule("CA", {//CommandAssistant 命令助手
	icon : null,
	gen : null,
	con : null,
	cmd : null,
	history : null,
	assist : null,
	fcs : null,
	paste : null,
	
	his : null,
	fav : null,
	cmdstr : "",
	settings : {},
	fine : false,
	
	profilePath : MapScript.baseDir + "xero_commandassist.dat",
	version : "0.9 Beta",
	publishDate : "{DATE}",
	help : '{HELP}',
	tips : [],
	
	initialize : function() {try {
		this.supportFloat = MapScript.host == "AutoJs" || MapScript.host == "Android";
		this.load();
		var a = String(getMinecraftVersion()).split(".");
		a[0] = parseInt(a[0]); a[1] = parseInt(a[1]); a[2] = parseInt(a[2]);
		if (a[0] == 0 && a[1] < 16) {
			Common.showTextDialog("兼容性警告\n\n您的Minecraft PE版本过低（" + getMinecraftVersion() + "），没有命令和命令方块等功能，无法正常使用命令助手。请升级您的Minecraft PE至alpha 0.16.0及以上。");
		} else if ((a[0] == 1 && a[1] == 0 && a[2] < 5) || a[0] == 0) {
			Common.showTextDialog("兼容性警告\n\n您的Minecraft PE版本较低（" + getMinecraftVersion() + "），可以使用命令，但没有命令方块等功能，部分命令助手的功能可能无法使用。推荐升级您的Minecraft PE至1.0.5及以上。");
		}
		this.settings.tipsRead = isNaN(this.settings.tipsRead) ? 0 : (this.settings.tipsRead + 1) % this.tips.length;
		Common.toast("命令助手 " + this.version + " by ProjectXero\n\n" + this.tips[this.settings.tipsRead], 1);
		if (this.settings.showF3) F3.show();
		this.fine = true;
		this.screenChangeHook();
		if (MapScript.host == "AutoJs") {
			this.showAutoJsContent();
		} else if (MapScript.host == "Android") {
			this.showAndroidContent();
		}
	} catch(e) {erp(e)}},
	chatHook : function(s) {try {
		var i;
		if ((/^\//).test(s)) this.addHistory(s);
		if (s == "cadebug") Common.showDebugDialog();
	} catch(e) {erp(e)}},
	screenChangeHook : function self(screenName) {try {
		if (screenName) {
			self.l = screenName;
		} else {
			screenName = self.l;
		}
		if (!this.fine) return;
		if (MapScript.host != "BlockLauncher" || !this.settings.autoHideIcon || (this.settings.topIcon && PWM.getCount() > 0)) return this.showIcon();
		if (screenName == "chat_screen" || screenName == "command_block_screen" || (this.cmdstr.length && screenName == "hud_screen")) {
			this.showIcon();
		} else {
			this.hideIcon();
		}
	} catch(e) {erp(e)}},
	load : function() {
		var f = MapScript.readJSON(this.profilePath, null, true), t;
		if (f && Array.isArray(f.history) && (f.favorite instanceof Object) && (f.settings instanceof Object)) {
			this.his = f.history;
			this.fav = f.favorite;
			this.cmdstr = f.cmd ? String(f.cmd) : "";
			this.settings = f.settings;
			Common.alpha = f.settings.alpha;
			Common.loadTheme(f.theme);
			if (!f.settings.enabledLibrarys) f.settings.enabledLibrarys = Object.keys(this.IntelliSense.inner);
			if (!f.settings.disabledLibrarys) f.settings.disabledLibrarys = [];
			if (f.settings.libPath) {
				this.IntelliSense.enableLibrary(f.settings.libPath);
				delete f.settings.libPath;
			}
			if (f.library) {
				Common.showFileDialog({
					type : 1,
					callback : function(f) {
						var t;
						MapScript.saveJSON(t = String(f.result.getAbsolutePath()), f.l);
						CA.IntelliSense.enableLibrary(t);
						CA.IntelliSense.initLibrary();
						Common.toast("命令库已保存");
					},
					l : f.library
				});
				Common.showTextDialog("兼容性警告\n\n由于版本更新，命令助手已不再支持旧版无文件基础的自定义命令库，请选择一个位置来保存当前的命令库，以避免不必要的数据丢失。\n\n您也可以选择忽略。");
			}
			Object.keys(this.IntelliSense.inner).forEach(function(e) {
				if (this.enabledLibrarys.indexOf(e) < 0 && this.disabledLibrarys.indexOf(e) < 0) this.enabledLibrarys.push(e);
			}, this.settings);
			this.IntelliSense.initLibrary(function(flag) {
				if (!flag) Common.toast("有至少1个命令库无法加载，请在设置中查看详情");
			});
		} else {
			this.his = [
				"/say 你好，我是命令助手！左边是历史，右边是收藏，可以拖来拖去，也可以长按编辑哦"
			];
			this.fav = {
				"获得命令方块" : "/give @p command_block",
				"关闭命令提示" : "/gamerule commandblockoutput false",
				"命令助手设置" : "/help"
			};
			this.cmdstr = "";
			this.settings = {
				barTop : false,
				autoHideIcon : false,
				autoFormatCmd : false,
				showF3 : false,
				alpha : false,
				noAnimation : false,
				senseDelay : false,
				disablePaste : false,
				historyCount : 0,
				splitScreenMode : false,
				keepWhenIME : false,
				topIcon : true,
				iconAlpha : 0,
				tipsRead : 0,
				iiMode : -1,
				enabledLibrarys : Object.keys(this.IntelliSense.inner),
				disabledLibrarys : []
			};
			this.IntelliSense.initLibrary();
			Common.alpha = Boolean(this.settings.alpha);
			Common.loadTheme();
		}
	},
	save : function() {
		var a = {
			history : this.his,
			favorite : this.fav,
			cmd : this.cmdstr,
			settings : this.settings,
			theme : Common.theme.id,
			publishDate : this.publishDate
		};
		a.settings.alpha = Common.alpha;
		MapScript.saveJSON(this.profilePath, a, true);
	},
	addHistory : function(t) {
		var i = this.his.indexOf(String(t));
		if (i >= 0) this.his.splice(i, 1);
		this.his.unshift(String(t));
		if (CA.settings.histroyCount) {
			this.his.splice(CA.settings.histroyCount);
		}
	},
	trySave : function() {
		try {
			this.save();
		} catch(e) {
			Common.showTextDialog("命令助手无法在您的手机上运行：文件写入失败。\n原因可能为：\n1、您的内部存储没有足够的空间\n2、文件被保护\n\n请检查您的系统。\n\n错误原因：" + e);
		}
	},
	showIcon : function self() {G.ui(function() {try {
		if (!self.view) {
			self.view = new G.TextView(ctx);
			self.view.setText("CA");
			self.view.setPadding(5 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
			self.view.setTextSize(Common.theme.textsize[4]);
			self.view.setBackgroundColor(Common.theme.go_bgcolor);
			self.view.setTextColor(Common.theme.go_textcolor);
			self.view.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (isNaN(CA.settings.iiMode) || CA.settings.iiMode < 0) {
					Common.toast("请选择智能模式");
					CA.showModeChooser(function() {
						self.open();
					});
					return;
				}
				self.open();
				return;
			} catch(e) {erp(e)}}}));
			self.view.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				var t;
				switch (e.getAction()) {
					case e.ACTION_MOVE:
					if (touch.stead && Math.abs(touch.lx - e.getRawX()) + Math.abs(touch.ly - e.getRawY()) < 20 * G.dp) break;
					touch.stead = false;
					CA.icon.update(self.cx = e.getRawX() + touch.offx, self.cy = e.getRawY() + touch.offy, -1, -1);
					break;
					case e.ACTION_DOWN:
					touch.offx = self.cx - (touch.lx = e.getRawX());
					touch.offy = self.cy - (touch.ly = e.getRawY());
					touch.stead = true;
					v.setBackgroundColor(Common.theme.go_touchbgcolor);
					v.setTextColor(Common.theme.go_touchtextcolor);
					break;
					case e.ACTION_UP:
					case e.ACTION_CANCEL:
					v.setBackgroundColor(Common.theme.go_bgcolor);
					v.setTextColor(Common.theme.go_textcolor);
					CA.settings.iconX = self.cx;
					CA.settings.iconY = self.cy;
				}
				return !touch.stead;
			} catch(e) {erp(e)}}}));
			self.open = function() {
				if (!CA.settings.topIcon) {
					CA.showGen(CA.settings.noAnimation);
					CA.hideIcon();
					if (CA.paste) CA.hidePaste();
				} else if (PWM.getCount() > 0) {
					if (self.lastState = !self.lastState) {
						PWM.showAll();
					} else {
						PWM.hideAll();
					}
				} else {
					CA.showGen(CA.settings.noAnimation);
				}
				self.refresh();
			}
			self.refresh = function() {
				if (CA.settings.iconAlpha) {
					self.view.setAlpha(CA.settings.iconAlpha / 10);
				} else {
					self.view.setAlpha(self.lastState && PWM.getCount() > 0 ? 0.3 : 0.7);
				}
			}
			self.lastState = true;
		}
		self.refresh();
		if (CA.icon) return;
		if (isNaN(CA.settings.iconX)) {
			self.view.measure(0, 0);
			//ctx.getWindowManager().getDefaultDisplay().getRotation() == G.Surface.ROTATION_90
			CA.settings.iconX = 0;
			CA.settings.iconY = 0.25 * G.screenHeight - 0.5 * self.view.getMeasuredHeight();
		}
		CA.icon = new G.PopupWindow(self.view, -2, -2);
		if (CA.supportFloat) CA.icon.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		CA.icon.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.LEFT | G.Gravity.TOP, self.cx = CA.settings.iconX, self.cy = CA.settings.iconY);
		if (CA.settings.topIcon) PWM.addFloat(CA.icon);
	} catch(e) {erp(e)}})},
	hideIcon : function() {G.ui(function() {try {
		if (CA.icon) CA.icon.dismiss();
		CA.icon = null;
	} catch(e) {erp(e)}})},
	
	showGen : function self(noani) {G.ui(function() {try {
		if (CA.gen) CA.gen.dismiss();
		if (!self.main) {
			self.cmdEdit = [{
				text : "设置",
				description : "IntelliSense、悬浮窗、命令库……",
				onclick : function(v) {
					CA.showSettings();
				}
			},{
				text : "粘贴",
				description : "将剪贴板中的文本粘贴到文本框中",
				onclick : function(v) {
					if (!Common.hasClipboardText()) return;
					var s = CA.cmd.getText(), start, cp;
					var r = new G.SpannableStringBuilder(s);
					r.replace(start = G.Selection.getSelectionStart(s), G.Selection.getSelectionEnd(s), cp = Common.getClipboardText());
					CA.cmd.setText(r);
					CA.cmd.setSelection(start + cp.length());
				}
			},{
				text : "直接编辑",
				description : "直接输入命令，避免IntelliSense带来的延迟",
				onclick : function(v, tag) {
					Common.showInputDialog({
						title : "直接编辑",
						callback : function(s) {
							CA.cmd.setText(String(s).replace(/\n/g, " "));
						},
						defaultValue : tag.cmd
					});
				}
			},{
				text : "编辑样式代码",
				description : "显示样式代码辅助输入框",
				onclick : function(v) {
					CA.showFCS(CA.cmd.getText());
				}
			},{
				text : "插入JSON",
				description : "在命令尾部插入JSON",
				onclick : function(v) {
					JSONEdit.create(function(data) {
						var showMenu = function() {
							Common.showOperateDialog([{
								text : "插入该JSON",
								onclick : function(v) {
									var k = MapScript.toSource(data);
									if ((/\S$/).test(CA.cmd.getText())) {
										k = " " + k;
									}
									CA.cmd.getText().append(CA.cmd.getText() + k);
								}
							},{
								text : "继续编辑",
								onclick : function(v) {
									if (!JSONEdit.show({
										source : data,
										rootname : "新JSON",
										update : function() {
											data = this.source;
											showMenu();
										}
									})) showMenu();
								}
							},{
								text : "取消",
								onclick : function(v) {}
							}]);
						}
						showMenu();
					});
				}
			},{
				text : "清空",
				description : "清空文本，等效于点击输入框右侧的“×”",
				onclick : function(v) {
					CA.cmd.setText("");
				}
			}];
			self.performClose = function() {
				if (CA.settings.noAnimation) {
					CA.hideGen();
					return true;
				}
				var animation = new G.TranslateAnimation(G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, CA.settings.barTop ? -1 : 1);
				animation.setInterpolator(new G.AccelerateInterpolator(2.0));
				animation.setDuration(100);
				animation.setStartOffset(100);
				self.bar.startAnimation(animation);
				animation = new G.TranslateAnimation(G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, CA.settings.barTop ? 1 : -1);
				animation.setInterpolator(new G.AccelerateInterpolator(2.0));
				animation.setDuration(200);
				animation.setAnimationListener(new G.Animation.AnimationListener({
					onAnimationEnd : function(a) {
						CA.hideGen();
					},
					//onAnimationStart : function(a) {},
					//onAnimationRepeat : function(a) {},
				}));
				CA.con.startAnimation(animation);
			}
			self.performCopy = function(s) {
				Common.setClipboardText(String(s));
				CA.addHistory(String(s));
				if (!CA.settings.disablePaste) CA.showPaste(0);
				self.performClose();
			}
			self.activate = function(fl) {
				CA.cmd.requestFocus();
				CA.cmd.setSelection(CA.cmd.getText().length());
				if (fl) ctx.getSystemService(ctx.INPUT_METHOD_SERVICE).showSoftInput(CA.cmd, G.InputMethodManager.SHOW_IMPLICIT);
			}
			
			self.main = new G.LinearLayout(ctx);
			self.main.setOrientation(G.LinearLayout.VERTICAL);
			self.main.setBackgroundColor(G.Color.TRANSPARENT);
			
			self.bar = new G.LinearLayout(ctx);
			self.bar.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			self.bar.setOrientation(G.LinearLayout.HORIZONTAL);
			self.bar.setBackgroundColor(Common.theme.float_bgcolor);
			
			self.add = new G.TextView(ctx);
			self.add.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.add.setText("╋");
			self.add.setTextSize(Common.theme.textsize[3]);
			self.add.setTextColor(Common.theme.textcolor);
			self.add.setGravity(G.Gravity.CENTER);
			self.add.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.add.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (CA.settings.iiMode == 1) {
					CA.Assist.active = true;
					CA.cmd.setFocusable(false);
					CA.cmd.setText(CA.cmdstr);
				} else {
					CA.cmd.setText("/");
					self.activate(true);
				}
			} catch(e) {erp(e)}}}));
			self.bar.addView(self.add);
			
			CA.cmd = new G.EditText(ctx);
			CA.cmd.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -1, 1.0));
			CA.cmd.setHint("命令");
			CA.cmd.setBackgroundColor(G.Color.TRANSPARENT);
			CA.cmd.setTextSize(Common.theme.textsize[3]);
			CA.cmd.setTextColor(Common.theme.textcolor);
			CA.cmd.setHintTextColor(Common.theme.promptcolor);
			CA.cmd.setInputType(G.InputType.TYPE_CLASS_TEXT | G.InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS);
			CA.cmd.setFocusableInTouchMode(true);
			CA.cmd.setPadding(5 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			CA.cmd.setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
			CA.cmd.setTypeface(G.Typeface.MONOSPACE);
			CA.cmd.addTextChangedListener(new G.TextWatcher({
				afterTextChanged : (function() {
					var state = -1;
					var skip = false;
					var rep = function(s) {
						var start = G.Selection.getSelectionStart(s);
						var end = G.Selection.getSelectionEnd(s);
						s.clearSpans();
						FCString.parseFC_(s, G.Color.BLACK);
						skip = true;
						CA.cmd.setText(s);
						skip = false;
						G.Selection.setSelection(CA.cmd.getText(), start, end);
					}
					var gostate0 = function() {
						state = 0;
						CA.hideAssist(); CA.showHistory();
						self.copy.setText("关闭");
						self.add.setVisibility(G.View.VISIBLE);
						self.clear.setVisibility(G.View.GONE);
					}
					var gostate1 = function() {
						state = 1;
						if (CA.settings.iiMode == 2) {
							CA.hideHistory(); CA.showAssist();
							CA.Assist.hide(); CA.IntelliSense.show();
						} else {
							CA.hideAssist(); CA.showHistory();
						}
						self.copy.setText("复制");
						self.add.setVisibility(G.View.GONE);
						self.clear.setVisibility(G.View.VISIBLE);
					}
					var gostate2 = function() {
						state = 2;
						CA.hideHistory(); CA.showAssist();
						CA.Assist.hide(); CA.IntelliSense.show();
						CA.IntelliSense.showHelp();
						self.copy.setText("关闭");
						self.add.setVisibility(G.View.GONE);
						self.clear.setVisibility(G.View.VISIBLE);
					}
					var gostate3 = function() {
						state = 3;
						CA.hideHistory(); CA.showAssist();
						CA.IntelliSense.hide(); CA.Assist.show(); CA.hideFCS();
						self.copy.setText("复制");
						self.add.setVisibility(G.View.GONE);
						self.clear.setVisibility(G.View.GONE);
					}
					return function(s) {
						if (skip) return;
						CA.cmdstr = String(s);
						if (CA.settings.iiMode == 1 && CA.Assist.active) {
							if (state != 3) gostate3();
						} else if (state != 2 && s == "/help") {
							gostate2();
						} else if (state != 1 && s.length() && s != "/help") {
							gostate1();
						} else if (state != 0 && !s.length()) {
							gostate0();
						}
						if (CA.fcs) CA.showFCS(s);
						if (CA.settings.iiMode != 2 || state !== 1) return;
						if (CA.settings.senseDelay) {
							CA.IntelliSense.callDelay(String(s));
						} else {
							CA.IntelliSense.proc(String(s));
						}
						if (CA.settings.autoFormatCmd) rep(s);
					}
				})(),
				//beforeTextChanged : function(s, start, count, after) {},
				//onTextChanged : function(s, start, count, after) {},
			}));
			CA.cmd.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (CA.Assist.active) {
					CA.Assist.active = false;
					CA.cmd.setFocusableInTouchMode(true);
					CA.cmd.setText(CA.cmdstr);
					self.activate(true);
				}
			} catch(e) {erp(e)}}}));
			CA.cmd.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				var t;
				if (touch.ignore && e.getAction() != e.ACTION_DOWN) return true;
				switch (e.getAction()) {
					case e.ACTION_MOVE:
					t = e.getRawY() - touch.sy;
					if (Math.abs(t) + Math.abs(e.getRawX() - touch.sx) > 20 * G.dp && touch.cbk) {
						self.main.removeCallbacks(touch.cbk);
						touch.cbk = null;
					}
					if ((t < 0) == CA.settings.barTop) t = 0;
					if (touch.stead && Math.abs(t) < 20 * G.dp) break;
					touch.stead = false;
					self.main.setTranslationY(t);
					break;
					case e.ACTION_DOWN:
					touch.sx = e.getRawX();
					touch.sy = e.getRawY();
					touch.stead = true;
					touch.ignore = false;
					if (!CA.Assist.active) self.main.postDelayed(touch.cbk = new java.lang.Runnable({run : function() {try {
						Common.showOperateDialog(self.cmdEdit, {
							cmd : String(CA.cmd.getText())
						});
						touch.cbk = null;
						touch(CA.cmd, G.MotionEvent.obtain(0, 0, G.MotionEvent.ACTION_CANCEL, 0, 0, 0, 0, 0, 0, 0, 0, 0));
					} catch(e) {erp(e)}}}), 300);
					break;
					case e.ACTION_CANCEL:
					touch.ignore = true;
					case e.ACTION_UP:
					if (touch.cbk) {
						self.main.removeCallbacks(touch.cbk);
						touch.cbk = null;
					}
					self.main.setTranslationY(0);
					if (e.getAction() == e.ACTION_CANCEL || touch.stead) return false;
					t = e.getRawY() - touch.sy;
					if ((t < 0) == CA.settings.barTop) t = 0;
					if (Math.abs(t) > 0.4 * self.main.getMeasuredHeight()) {
						if (CA.settings.noAnimation) {
							CA.hideGen();
						} else {
							t = new G.TranslateAnimation(G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.ABSOLUTE, t, G.Animation.ABSOLUTE, -self.main.getMeasuredHeight());
							t.setInterpolator(new G.AccelerateInterpolator(2.0));
							t.setDuration(100);
							t.setAnimationListener(new G.Animation.AnimationListener({
								onAnimationEnd : function(a) {
									CA.hideGen();
								}
							}));
							self.main.startAnimation(t);
						}
					} else if (!CA.settings.noAnimation) {
						t = new G.TranslateAnimation(G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.ABSOLUTE, t, G.Animation.RELATIVE_TO_SELF, 0);
						t.setInterpolator(new G.DecelerateInterpolator(2.0));
						t.setDuration(100);
						self.main.startAnimation(t);
					}
					return true;
				}
				return false;
			} catch(e) {erp(e)}}}));
			self.bar.addView(CA.cmd);
			
			self.clear = new G.TextView(ctx);
			self.clear.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.clear.setText("×");
			self.clear.setTextSize(Common.theme.textsize[3]);
			self.clear.setTextColor(Common.theme.promptcolor);
			self.clear.setGravity(G.Gravity.CENTER);
			self.clear.setPadding(5 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.clear.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				CA.cmd.setText("");
				self.activate(false);
				return true;
			} catch(e) {erp(e)}}}));
			self.bar.addView(self.clear);
			
			self.copy = new G.TextView(ctx);
			self.copy.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.copy.setGravity(G.Gravity.CENTER);
			self.copy.setBackgroundColor(Common.theme.go_bgcolor);
			self.copy.setTextSize(Common.theme.textsize[3]);
			self.copy.setTextColor(Common.theme.go_textcolor);
			self.copy.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.copy.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var t = CA.cmd.getText(), i;
				if ((CA.Assist.active || t != "/help") && t.length()) {
					self.performCopy(t);
				} else {
					self.performClose();
				}
				CA.cmd.setText("");
				return true;
			} catch(e) {erp(e)}}}));
			self.copy.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				switch (e.getAction()) {
					case e.ACTION_DOWN:
					v.setBackgroundColor(Common.theme.go_touchbgcolor);
					v.setTextColor(Common.theme.go_touchtextcolor);
					break;
					case e.ACTION_CANCEL:
					case e.ACTION_UP:
					v.setBackgroundColor(Common.theme.go_bgcolor);
					v.setTextColor(Common.theme.go_textcolor);
				}
				return false;
			} catch(e) {erp(e)}}}));
			self.copy.setOnLongClickListener(new G.View.OnLongClickListener({onLongClick : function(v) {try {
				EasterEgg.start();
				return true;
			} catch(e) {erp(e)}}}));
			self.bar.addView(self.copy);
			
			CA.con = new G.FrameLayout(ctx);
			CA.con.setBackgroundColor(Common.theme.bgcolor);
			CA.con.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1));
			
			if (CA.settings.barTop) {
				self.main.addView(self.bar);
				self.main.addView(CA.con);
			} else {
				self.main.addView(CA.con);
				self.main.addView(self.bar);
			}
			if (G.style == "Material") {
				self.bar.setElevation(8 * G.dp);
			}
			
			CA.cmd.setText(CA.cmdstr);
		}
		CA.gen = new G.PopupWindow(self.main, -1, -1);
		if (CA.supportFloat) CA.gen.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		CA.gen.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		CA.gen.setFocusable(true);
		CA.gen.setInputMethodMode(G.PopupWindow.INPUT_METHOD_NEEDED);
		CA.gen.setSoftInputMode(G.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
		CA.gen.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			CA.screenChangeHook();
			CA.trySave();
		} catch(e) {erp(e)}}}));
		CA.gen.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(CA.gen);
		CA.cmd.setText(CA.cmd.getText());
		self.activate(false);
		if (noani) return;
		var animation = new G.TranslateAnimation(G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, CA.settings.barTop ? -1 : 1, G.Animation.RELATIVE_TO_SELF, 0);
		animation.setInterpolator(new G.DecelerateInterpolator(2.0));
		animation.setDuration(100);
		animation.setStartOffset(100);
		self.bar.startAnimation(animation);
		animation = new G.TranslateAnimation(G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, CA.settings.barTop ? 1 : -1, G.Animation.RELATIVE_TO_SELF, 0);
		animation.setInterpolator(new G.DecelerateInterpolator(2));
		animation.setDuration(200);
		CA.con.startAnimation(animation);
	} catch(e) {erp(e)}})},
	hideGen : function() {G.ui(function() {try {
		if (CA.gen) CA.gen.dismiss();
		CA.gen = null;
	} catch(e) {erp(e)}})},
	
	showHistory : function self() {G.ui(function() {try {
		var t;
		if (!self.history) {
			self.historyEdit = [{
				text : "复制",
				onclick : function(v, tag) {
					Common.setClipboardText(tag.cmd);
					Common.toast("已复制到您的剪贴板～");
				}
			},{
				text : "添加收藏",
				onclick : function(v, tag) {
					Common.showInputDialog({
						title : "添加收藏",
						description : "请给这条命令一个名字吧～\n\t有名字的命令才能被收藏",
						callback : function(s) {
							if (s in CA.fav) {
								Common.toast("名字重复了～换一个名字吧");
							} else {
								if (!s) s = tag.cmd;
								CA.fav[s] = tag.cmd;
								CA.showHistory();
							}
						},
						singleLine : true
					});
				}
			},{
				text : "删除",
				onclick : function(v, tag) {
					CA.his.splice(tag.pos, 1);
					Common.toast("删除啦～");
					CA.showHistory();
				}
			}];
			self.favoriteEdit = [{
				text : "复制",
				onclick : function(v, tag) {
					Common.setClipboardText(tag.cmd);
					Common.toast("已复制到您的剪贴板～");
				}
			},{
				text : "编辑名称",
				onclick : function(v, tag) {
					Common.showInputDialog({
						title : "编辑名称",
						callback : function(s) {
							delete CA.fav[tag.name];
							if (!s) s = tag.cmd;
							CA.fav[s] = tag.cmd;
							CA.showHistory();
						},
						singleLine : true,
						defaultValue : tag.name
					});
				}
			},{
				text : "编辑内容",
				onclick : function(v, tag) {
					Common.showInputDialog({
						title : "编辑内容",
						callback : function(s) {
							if (!s) {
								Common.toast("命令不能为空哦～");
							} else {
								CA.fav[tag.name] = s;
								CA.showHistory();
							}
						},
						singleLine : true,
						defaultValue : tag.cmd
					});
				}
			},{
				text : "删除",
				onclick : function(v, tag) {
					delete CA.fav[tag.name];
					Common.toast("删除啦～");
					CA.showHistory();
				}
			}];
			self.linear = new G.LinearLayout(ctx);
			self.linear.setBackgroundColor(G.Color.TRANSPARENT);
			self.linear.setOrientation(G.LinearLayout.HORIZONTAL);
			self.tag1 = new G.TextView(ctx);
			self.tag1.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
			self.tag1.setText("历史");
			self.tag1.setTextSize(Common.theme.textsize[1]);
			self.tag1.setTextColor(Common.theme.promptcolor);
			self.tag1.setGravity(G.Gravity.LEFT);
			self.tag1.setPadding(10 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
			self.tag1.setFocusable(true);
			self.null1 = new G.TextView(ctx);
			self.null1.setLayoutParams(new G.AbsListView.LayoutParams(-1, 0.6 * G.screenHeight));
			self.null1.setText("空空如也");
			self.null1.setTextSize(Common.theme.textsize[4]);
			self.null1.setTextColor(Common.theme.promptcolor);
			self.null1.setGravity(G.Gravity.CENTER);
			self.null1.setFocusable(true);
			self.history = new G.ListView(ctx);
			self.history.setBackgroundColor(G.Color.TRANSPARENT);
			self.history.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				pos -= parent.getHeaderViewsCount();
				if (pos < 0) return;
				CA.cmd.setText(CA.his[pos]);
				CA.showGen.activate(true);
			} catch(e) {erp(e)}}}));
			self.history.setOnItemLongClickListener(new G.AdapterView.OnItemLongClickListener({onItemLongClick : function(parent, view, pos, id) {try {
				pos -= parent.getHeaderViewsCount();
				if (pos < 0) return true;
				Common.showOperateDialog(self.historyEdit, {
					pos : parseInt(pos),
					cmd : CA.his[pos]
				});
				return true;
			} catch(e) {erp(e)}}}));
			self.history.addHeaderView(self.tag1);
			self.linear.addView(self.history);
			self.tag2 = new G.TextView(ctx);
			self.tag2.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
			self.tag2.setText("收藏");
			self.tag2.setTextSize(Common.theme.textsize[1]);
			self.tag2.setTextColor(Common.theme.promptcolor);
			self.tag2.setGravity(G.Gravity.LEFT);
			self.tag2.setPadding(10 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
			self.tag2.setFocusable(true);
			self.null2 = new G.TextView(ctx);
			self.null2.setLayoutParams(new G.AbsListView.LayoutParams(-1, 0.6 * G.screenHeight));
			self.null2.setText("空空如也");
			self.null2.setTextSize(Common.theme.textsize[4]);
			self.null2.setTextColor(Common.theme.promptcolor);
			self.null2.setGravity(G.Gravity.CENTER);
			self.null2.setFocusable(true);
			self.favorite = new G.ListView(ctx);
			self.favorite.setBackgroundColor(G.Color.TRANSPARENT);
			self.favorite.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				pos -= parent.getHeaderViewsCount();
				if (pos < 0) return;
				CA.cmd.setText(CA.fav[parent.getAdapter().getWrappedAdapter().getItem(pos)]);
				CA.showGen.activate(false);
			} catch(e) {erp(e)}}}));
			self.favorite.setOnItemLongClickListener(new G.AdapterView.OnItemLongClickListener({onItemLongClick : function(parent, view, pos, id) {try {
				pos -= parent.getHeaderViewsCount();
				if (pos < 0) return true;
				var t;
				Common.showOperateDialog(self.favoriteEdit, {
					pos : parseInt(pos),
					name : (t = String(parent.getAdapter().getWrappedAdapter().getItem(pos))),
					cmd : CA.fav[t]
				});
				return true;
			} catch(e) {erp(e)}}}));
			self.favorite.addHeaderView(self.tag2);
			self.linear.addView(self.favorite);
			CA.con.addOnLayoutChangeListener(self.layoutListener = new G.View.OnLayoutChangeListener({onLayoutChange : function(v, l, t, r, b, ol, ot, or, ob) {try {
				if (r - l == or - ol) return;
				self.screenWidth = r - l;
				if (CA.settings.splitScreenMode) {
					self.linear.setLayoutParams(new G.FrameLayout.LayoutParams(self.screenWidth, -1));
					self.history.setLayoutParams(new G.LinearLayout.LayoutParams(self.screenWidth * 0.5, -1));
					self.favorite.setLayoutParams(new G.LinearLayout.LayoutParams(self.screenWidth * 0.5, -1));
				} else {
					self.linear.setLayoutParams(new G.FrameLayout.LayoutParams(self.screenWidth * 2, -1));
					self.history.setLayoutParams(new G.LinearLayout.LayoutParams(self.screenWidth, -1));
					self.favorite.setLayoutParams(new G.LinearLayout.LayoutParams(self.screenWidth, -1));
				}
				if (self.tx < 0) self.linear.setTranslationX(self.tx = -self.screenWidth);
			} catch(e) {erp(e)}}}));
			self.hisa = function(s) {
				var layout = new G.LinearLayout(ctx),
					text1 = new G.TextView(ctx),
					text2 = new G.TextView(ctx);
				layout.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
				layout.setOrientation(G.LinearLayout.HORIZONTAL);
				text1.setPadding(15 * G.dp, 15 * G.dp, 0, 15 * G.dp);
				text1.setLayoutParams(new G.LinearLayout.LayoutParams(0, -2, 1.0));
				text1.setText(s);
				text1.setMaxLines(2);
				text1.setEllipsize(G.TextUtils.TruncateAt.END);
				text1.setTextSize(Common.theme.textsize[3]);
				text1.setTextColor(Common.theme.textcolor);
				layout.addView(text1);
				text2.setPadding(15 * G.dp, 0, 15 * G.dp, 0);
				text2.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
				text2.setText("📋");
				text2.setGravity(G.Gravity.CENTER);
				text2.setTextSize(Common.theme.textsize[3]);
				text2.setTextColor(Common.theme.promptcolor);
				text2.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
					CA.showGen.performCopy(s);
					return true;
				} catch(e) {erp(e)}}}));
				layout.addView(text2);
				return layout;
			}
			self.fava = function(s) {
				var layout = new G.LinearLayout(ctx),
					text1 = new G.TextView(ctx),
					text2 = new G.TextView(ctx);
				layout.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
				layout.setOrientation(G.LinearLayout.VERTICAL);
				text1.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 5 * G.dp);
				text1.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
				text1.setText(s);
				text1.setTextSize(Common.theme.textsize[3]);
				text1.setTextColor(Common.theme.textcolor);
				layout.addView(text1);
				text2.setPadding(15 * G.dp, 0, 15 * G.dp, 15 * G.dp);
				text2.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
				text2.setText(CA.fav[s]);
				text2.setEllipsize(G.TextUtils.TruncateAt.END);
				text2.setSingleLine(true);
				text2.setTextSize(Common.theme.textsize[1]);
				text2.setTextColor(Common.theme.promptcolor);
				layout.addView(text2);
				return layout;
			}
			if (!CA.settings.splitScreenMode) {
				var touchSlop = G.ViewConfiguration.get(ctx).getScaledTouchSlop();
				var switchSlop = 80 * G.dp;
				self.scroller = new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
					var t, f;
					switch (e.getAction()) {
						case e.ACTION_MOVE:
						f = true; t = self.x;
						self.x = e.getRawX();
						if (self.vscr && Math.abs(e.getRawX() - self.sx) - Math.abs(e.getRawY() - self.sy) < touchSlop) break;
						//超过范围，开始滑动
						self.vscr = false;
						self.stead = false;
						//计算当前偏移量（当前点X-上个点X）
						self.tx += e.getRawX() - t;
						if (self.tx > 0) {
							self.tx = 0;
						} else if (self.tx < -self.screenWidth) {
							self.tx = -self.screenWidth;
						} else {
							f = false; //未超出范围
						}
						self.linear.setTranslationX(self.tx);
						if (f) break;
						if (self.cancelled) return true;
						e.setAction(e.ACTION_CANCEL);//取回控制权
						self.cancelled = true;
						break;
						case e.ACTION_DOWN:
						//开始点
						self.sx = self.x = e.getRawX();
						self.sy = e.getRawY();
						self.lx = self.tx; //上个偏移量状态
						self.vscr = true;
						self.cancelled = false;
						break;
						case e.ACTION_CANCEL:
						case e.ACTION_UP:
						if (self.vscr) break;
						t = self.tx; //计算偏移量
						self.tx = (Math.abs(t - self.lx) < switchSlop) ? self.lx : t < self.lx ? -self.screenWidth : 0;
						self.linear.setTranslationX(self.tx);
						if (!CA.settings.noAnimation) { //动画
							var animation = new G.TranslateAnimation(G.Animation.ABSOLUTE, t - self.tx, G.Animation.ABSOLUTE, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0);
							animation.setInterpolator(new G.DecelerateInterpolator(1.0));
							animation.setDuration(200);
							self.linear.startAnimation(animation);
						}
						if (self.cancelled) return true;
					}
					return false;
				} catch(e) {erp(e)}}});
				self.history.setOnTouchListener(self.scroller);
				self.favorite.setOnTouchListener(self.scroller);
			}
		}
		self.history.setAdapter(new RhinoListAdapter(CA.his, self.hisa));
		self.favorite.setAdapter(new RhinoListAdapter(t = Object.keys(CA.fav), self.fava));
		if (!CA.his.length) {
			self.history.addHeaderView(self.null1);
		} else {
			self.history.removeHeaderView(self.null1);
		}
		if (!t.length) {
			self.favorite.addHeaderView(self.null2);
		} else {
			self.favorite.removeHeaderView(self.null2);
		}
		if (CA.history) return;
		CA.history = self.linear;
		self.linear.setTranslationX(self.tx = self.lx = 0);
		CA.con.addView(CA.history);
		self.layoutListener.onLayoutChange(CA.con, 0, 0, CA.con.getMeasuredWidth(), CA.con.getMeasuredHeight(), 0, 0, 0, 0);
	} catch(e) {erp(e)}})},
	hideHistory : function() {G.ui(function() {try {
		if (!CA.history) return;
		CA.con.removeView(CA.history);
		CA.history = null;
	} catch(e) {erp(e)}})},
	
	showAssist : function self() {G.ui(function() {try {
		if (CA.assist) return;
		if (!self.con) {
			self.htype = -1;
			self.htext = "";
			self.keep = true;
			self.hUpdate = false;
			self.postHelp = function(type, text) {
				if (type == self.htype && text == self.htext) return;
				self.htype = type;
				self.htext = text;
				self.hUpdate = true;
				self.hCheck();
			}
			self.hCheck = function() {G.ui(function() {try {
				if (!self.hUpdate) return;
				if (CA.settings.splitScreenMode || self.tx < 0) self.hLoad();
			} catch(e) {erp(e)}})}
			self.hLoad = function() {
				switch (self.htype) {
					case 0:
					self.help.loadUrl(self.htext);
					break;
					case 1:
					self.help.loadData(self.htext, "text/html; charset=UTF-8", null);
					break;
					default:
					self.help.loadUrl("about:blank");
					break;
				}
				self.hUpdate = false;
			}
			self.initBrowser = function(wv) {
				var ws = wv.getSettings();
				ws.setSupportZoom(true);
				ws.setJavaScriptEnabled(true);
				ws.setAllowFileAccess(true);
				ws.setAllowFileAccessFromFileURLs(true);
				ws.setAllowUniversalAccessFromFileURLs(true);
				ws.setSaveFormData(true);
				ws.setLoadWithOverviewMode(true);
				ws.setJavaScriptCanOpenWindowsAutomatically(true);
				ws.setLoadsImagesAutomatically(true);
				ws.setAllowContentAccess(true);
				/*ws.setAppCachePath((new java.io.File(ctx.getCacheDir(), "com.xero.ca.webview")).getAbsolutePath());
				ws.setAppCacheEnabled(true);
				ws.setCacheMode(ws.LOAD_CACHE_ELSE_NETWORK);*/
				wv.setWebViewClient(new G.WebViewClient());
			}
			self.initContent = function(v) {
				if (!CA.settings.splitScreenMode) {
					v.setOnTouchListener(self.scroller);
				}
			}
			self.linear = new G.LinearLayout(ctx);
			self.linear.setBackgroundColor(G.Color.TRANSPARENT);
			self.linear.setOrientation(G.LinearLayout.HORIZONTAL);
			self.con = new G.FrameLayout(ctx);
			self.linear.addView(self.con);
			self.help = new G.WebView(ctx);
			self.initBrowser(self.help);
			self.linear.addView(self.help);
			CA.con.addOnLayoutChangeListener(self.layoutListener = new G.View.OnLayoutChangeListener({onLayoutChange : function(v, l, t, r, b, ol, ot, or, ob) {try {
				if (r - l == or - ol) return;
				self.screenWidth = r - l;
				if (CA.settings.splitScreenMode) {
					self.linear.setLayoutParams(new G.FrameLayout.LayoutParams(self.screenWidth, -1));
					self.con.setLayoutParams(new G.LinearLayout.LayoutParams(self.screenWidth * 0.5, -1));
					self.help.setLayoutParams(new G.LinearLayout.LayoutParams(self.screenWidth * 0.5, -1));
				} else {
					self.linear.setLayoutParams(new G.FrameLayout.LayoutParams(self.screenWidth * 2, -1));
					self.con.setLayoutParams(new G.LinearLayout.LayoutParams(self.screenWidth, -1));
					self.help.setLayoutParams(new G.LinearLayout.LayoutParams(self.screenWidth, -1));
				}
				if (self.tx < 0) self.linear.setTranslationX(self.tx = -self.screenWidth);
			} catch(e) {erp(e)}}}));
			if (!CA.settings.splitScreenMode) {
				var touchSlop = G.ViewConfiguration.get(ctx).getScaledTouchSlop();
				var switchSlop = 80 * G.dp;
				self.scroller = new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
					var t, f;
					switch (e.getAction()) {
						case e.ACTION_MOVE:
						f = true; t = self.x;
						self.x = e.getRawX();
						//网页情况下检查网页是否滑到最左侧
						if (self.lx == -self.screenWidth && self.help.getScrollX() != 0) break;
						if (self.vscr && Math.abs(e.getRawX() - self.sx) - Math.abs(e.getRawY() - self.sy) < touchSlop) break;
						self.vscr = false;
						self.stead = false;
						self.tx += e.getRawX() - t;
						if (self.tx > 0) {
							self.tx = 0;
						} else if (self.tx < -self.screenWidth) {
							self.tx = -self.screenWidth;
						} else {
							f = false;
						}
						self.linear.setTranslationX(self.tx);
						if (f) break;
						if (self.cancelled) return true;
						self.hCheck(); //检测是否需要加载网页
						e.setAction(e.ACTION_CANCEL);
						self.cancelled = true;
						break;
						case e.ACTION_DOWN:
						self.sx = self.x = e.getRawX();
						self.sy = e.getRawY();
						self.lx = self.tx;
						self.vscr = true;
						self.cancelled = false;
						break;
						case e.ACTION_CANCEL:
						case e.ACTION_UP:
						if (self.vscr) break;
						t = self.tx;
						self.tx = (Math.abs(t - self.lx) < switchSlop) ? self.lx : t < self.lx ? -self.screenWidth : 0;
						self.linear.setTranslationX(self.tx);
						if (!CA.settings.noAnimation) {
							var animation = new G.TranslateAnimation(G.Animation.ABSOLUTE, t - self.tx, G.Animation.ABSOLUTE, 0, G.Animation.RELATIVE_TO_SELF, 0, G.Animation.RELATIVE_TO_SELF, 0);
							animation.setInterpolator(new G.DecelerateInterpolator(1.0));
							animation.setDuration(200);
							self.linear.startAnimation(animation);
						}
						if (self.cancelled) return true;
					}
					return false;
				} catch(e) {erp(e)}}});
				self.help.setOnTouchListener(self.scroller);
			}
		}
		self.linear.setTranslationX(self.tx = self.lx = 0);
		CA.assist = self.linear;
		CA.con.addView(CA.assist);
		self.layoutListener.onLayoutChange(CA.con, 0, 0, CA.con.getMeasuredWidth(), CA.con.getMeasuredHeight(), 0, 0, 0, 0);
	} catch(e) {erp(e)}})},
	hideAssist : function() {G.ui(function() {try {
		if (!CA.assist) return;
		CA.showAssist.postHelp(-1);
		CA.showAssist.hLoad();
		CA.con.removeView(CA.assist);
		CA.assist = null;
	} catch(e) {erp(e)}})},
	
	showAutoJsContent : function() {G.ui(function() {try {
		ui.layout(
			<vertical gravity="center" padding="10">
				<text id="help" size="16" padding="10"></text>
				<button id="floatena" text="检测悬浮窗权限" />
				<button id="exit" text="退出命令助手" />
			</vertical>
		);
		ui.help.text("现在您应该可以看到悬浮窗了，如果没有看到请打开悬浮窗权限。");
		ui.exit.click(function() {
			ui.finish();
		});
		ui.floatena.click(function() {
			if (Common.canShowFloat()) {
				Common.toast("系统已允许悬浮窗显示");
			} else {
				Common.toast("系统不允许悬浮窗显示，请在设置中启用");
				Common.showAppSettings();
			}
		});
	} catch(e) {erp(e)}})},
	
	showAndroidContent : function() {G.ui(function() {try {
		var layout, help, exit, floatena;
		layout = new G.LinearLayout(ctx);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setGravity(G.Gravity.CENTER);
		layout.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
		layout.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -1));
		help = new G.TextView(ctx);
		help.setTextSize(16);
		help.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
		help.setText("现在您应该可以看到悬浮窗了，如果没有看到请打开悬浮窗权限。");
		help.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
		layout.addView(help);
		floatena = new G.Button(ctx);
		floatena.setText("检测悬浮窗权限");
		floatena.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		floatena.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			if (Common.canShowFloat()) {
				Common.toast("系统已允许悬浮窗显示");
			} else {
				Common.toast("系统不允许悬浮窗显示，请在设置中启用");
				Common.showAppSettings();
			}
		} catch(e) {erp(e)}}}));
		layout.addView(floatena);
		exit = new G.Button(ctx);
		exit.setText("退出命令助手");
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			ctx.finish();
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		ScriptActivity.setContentView(layout);
	} catch(e) {erp(e)}})},
	
	showSettings : function self() {G.ui(function() {try {
		if (!self.data) {
			self.getsettingbool = function() {
				return Boolean(CA.settings[this.id]);
			}
			self.setsettingbool = function(v) {
				CA.settings[this.id] = Boolean(v);
			}
			self.refresh = function() {
				Common.loadTheme(Common.theme.id);
				if (self.refreshed) return;
				self.refreshed = true;
				CA.resetGUI();
				CA.showGen(true);
				if (CA.settings.topIcon) CA.showIcon();
			}
			self.data = [{
				name : "版本",
				type : "tag"
			},{
				name : "当前版本",
				description : "基于Rhino (" + MapScript.host + ")",
				type : "custom",
				get : function() {
					return CA.version;
				}
			},{
				name : "检查更新",
				description : "点击检查更新",
				type : "custom",
				get : function() {
					return Updater.getVersionInfo();
				},
				onclick : function(fset) {
					Updater.checkUpdate(function() {
						G.ui(function() {try {
							fset();
						} catch(e) {erp(e)}});
					});
				}
			},{
				name : "IntelliSense设置",
				type : "tag"
			},{
				name : "智能模式",
				type : "custom",
				get : function() {
					var t = CA.settings.iiMode;
					return t == 1 ? "初学者模式" : t == 2 ? "专家模式" : "关闭";
				},
				onclick : function(fset) {
					CA.showModeChooser(function() {
						CA.resetGUI();
						CA.showGen(true);
						CA.showSettings();
					});
				}
			},{
				id : "senseDelay",
				name : "启用多线程",
				description : "IntelliSense将不会即时输出结果以避免卡顿。",
				type : "boolean",
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				id : "autoFormatCmd",
				name : "启用样式代码显示",
				description : "输入框会自动解释输入命令中的样式代码。",
				type : "boolean",
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				id : "disablePaste",
				name : "禁用命令粘贴提示",
				type : "boolean",
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				name : "悬浮窗设置",
				type : "tag"
			},{
				name : "不透明度",
				type : "seekbar",
				refresh : self.refresh,
				current : function(p) {
					return p == 0 ? "自动" : p + "0%";
				},
				max : 10,
				get : function() {
					return isNaN(CA.settings.iconAlpha) ? 0 : CA.settings.iconAlpha;
				},
				set : function(v) {
					CA.settings.iconAlpha = v;
				}
			},{
				id : "topIcon",
				name : "图标置于顶层",
				description : "点击图标可以暂时隐藏所有界面，再次点击可恢复",
				type : "boolean",
				refresh : self.refresh,
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				id : "autoHideIcon",
				name : "自动隐藏悬浮窗",
				type : "boolean",
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				name : "外观设置",
				type : "tag"
			},{
				name : "界面主题",
				type : "custom",
				get : function() {
					return Common.theme.name;
				},
				onclick : function() {
					Common.showChangeTheme(function() {
						CA.resetGUI();
						CA.showGen(true);
						CA.showSettings();
					}, function() {
						CA.showSettings();
					});
					self.refreshed = true;
					Common.showSettings.popup.dismiss();
				}
			},{
				id : "barTop",
				name : "输入栏置顶",
				description : "命令输入栏会被显示在顶部，兼容旧版UI。",
				type : "boolean",
				refresh : self.refresh,
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				id : "noAnimation",
				name : "关闭动画",
				description : "关闭部分动画以减轻卡顿。",
				type : "boolean",
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				id : "keepWhenIME",
				name : "禁用压缩列表栏",
				description : "当输入法弹出时不再压缩列表栏。",
				type : "boolean",
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				id : "splitScreenMode",
				name : "双栏模式",
				description : "推荐大屏手机/Pad使用",
				type : "boolean",
				refresh : self.refresh,
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				name : "辅助工具",
				type : "tag"
			},{
				id : "showF3",
				name : "显示调试屏幕",
				description : "便于用户获取环境相关信息。",
				type : "boolean",
				refresh : function() {
					(this.get() ? F3.show : F3.hide)();
				},
				get : self.getsettingbool,
				set : self.setsettingbool
			},{
				name : "每日提示",
				type : "custom",
				get : function() {
					return "共" + CA.tips.length + "条";
				},
				onclick : function() {
					Common.showTextDialog(CA.tips.join("\n\n"));
				}
			},{
				name : "用户数据",
				type : "tag"
			},{
				name : "命令库",
				type : "custom",
				get : function() {
					return CA.settings.enabledLibrarys.length + "个已启用";
				},
				onclick : function(fset) {
					CA.showLibraryMan(function() {
						fset();
					});
				}
			},{
				name : "历史记录数量",
				type : "seekbar",
				current : function(p) {
					return p == 0 ? "无限制" : this.list[p] + "条";
				},
				list : [0, 1, 3, 5, 8, 10, 20, 30, 50, 100],
				max : 9,
				get : function() {
					var k = this.list.indexOf(CA.settings.histroyCount);
					return k < 0 ? 0 : this.list[k];
				},
				set : function(v) {
					CA.settings.histroyCount = parseInt(this.list[v]);
					if (CA.settings.histroyCount) CA.his.splice(CA.settings.histroyCount);
				}
			},{
				name : "清空历史",
				type : "custom",
				get : function() {
					return "共有" + CA.his.length + "条记录";
				},
				onclick : function(fset) {
					CA.his = [];
					fset();
					if (CA.history) CA.showHistory();
				}
			},{
				name : "清空收藏",
				type : "custom",
				get : function() {
					return "共有" + Object.keys(CA.fav).length + "条记录";
				},
				onclick : function(fset) {
					CA.fav = {};
					fset();
					if (CA.history) CA.showHistory();
				}
			},{
				name : "恢复默认数据",
				type : "custom",
				onclick : function(fset) {
					CA.resetGUI();
					G.ui(function() {try {
						(new java.io.File(CA.profilePath)).delete();
						CA.initialize();
						Common.toast("命令助手已重新启动");
					} catch(e) {erp(e)}});
				}
			},{
				name : "调试工具",
				type : "tag"
			},{
				name : "JSON编辑器",
				type : "custom",
				get : function() {
					return "";
				},
				onclick : function() {
					JSONEdit.main();
				}
			},{
				name : "命令行",
				type : "custom",
				get : function() {
					return "仅供测试使用，非专业人员请勿打开";
				},
				onclick : function(fset) {
					Common.showDebugDialog();
				}
			}];
		}
		self.refreshed = false;
		Common.showSettings(self.data, function() {
			CA.trySave();
		});
	} catch(e) {erp(e)}})},
	
	resetGUI : function() {
		if (CA.gen) CA.hideGen();
		if (CA.icon) CA.hideIcon();
		if (CA.paste) CA.hidePaste();
		CA.con = null;
		CA.cmd = null;
		CA.history = null;
		CA.assist = null;
		CA.fcs = null;
		CA.paste = null;
		CA.IntelliSense.ui = null;
		CA.showIcon.view = null;
		CA.showGen.main = null;
		CA.showHistory.history = null;
		CA.showAssist.con = null;
		CA.showFCS.prompt = null;
		CA.showPaste.bar = null;
		CA.showLibraryMan.linear = null;
		CA.IntelliSense.show.prompt = null;
		Common.showFileDialog.linear = null;
		Common.showDebugDialog.main = null;
		Common.showSettings.linear = null;
		PWM.reset();
		G.ui(function() {try {
			if (CA.showLibraryMan.popup) CA.showLibraryMan.popup.dismiss();
			if (Common.showFileDialog.popup) Common.showFileDialog.popup.dismiss();
			if (Common.showDebugDialog.popup) Common.showDebugDialog.popup.dismiss();
			if (Common.showSettings.popup) Common.showSettings.popup.dismiss();
		} catch(e) {erp(e)}});
	},
	
	showFCS : function self(v) {G.ui(function() {try {
		var i, j;
		if (!self.prompt) {
			var data = [["§", "§l§§l", "§m§§m", "§n§§n", "§o§§o", "§§k", "§§r"], ["§0§§0", "§1§§1", "§2§§2", "§3§§3", "§4§§4", "§5§§5", "§6§§6", "§7§§7"], ["§8§§8", "§9§§9", "§a§§a", "§b§§b", "§c§§c", "§d§§d", "§e§§e", "§f§§f"]];
			var l, b, lp1, lp2, onclick;
			var frcolor = G.Color.WHITE, bgcolor = G.Color.BLACK;
			
			self.frame = new G.FrameLayout(ctx);
			self.frame.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1));
			
			self.scr = new G.ScrollView(ctx);
			self.scr.setBackgroundColor(G.Color.argb(0xC0, G.Color.red(bgcolor), G.Color.green(bgcolor), G.Color.blue(bgcolor)));
			self.scr.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -2, CA.settings.barTop ? G.Gravity.TOP : G.Gravity.BOTTOM));
			if (G.style == "Material") self.scr.setElevation(10 * G.dp);
			
			self.line = new G.LinearLayout(ctx);
			self.line.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -2));
			self.line.setOrientation(G.LinearLayout.VERTICAL);
			
			self.prompt = new G.TextView(ctx);
			self.prompt.setLayoutParams(lp1 = new G.LinearLayout.LayoutParams(-1, -2));
			self.prompt.setTextColor(frcolor);
			self.prompt.setSingleLine(true);
			self.prompt.setEllipsize(G.TextUtils.TruncateAt.START);
			self.prompt.setTextSize(Common.theme.textsize[2]);
			self.prompt.setPadding(20 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.prompt.setTypeface(G.Typeface.MONOSPACE);
			self.line.addView(self.prompt);
			
			lp2 = new G.LinearLayout.LayoutParams(0, -2, 1);
			onclick = new G.View.OnClickListener({onClick : function(v) {try {
				CA.cmd.getText().replace(G.Selection.getSelectionStart(CA.cmd.getText()), G.Selection.getSelectionEnd(CA.cmd.getText()), v.getText().toString());
				return true;
			} catch(e) {erp(e)}}});
			
			for (i = 0; i < data.length; i++) {
				l = new G.LinearLayout(ctx);
				l.setOrientation(G.LinearLayout.HORIZONTAL);
				for (j = 0; j < data[i].length; j++) {
					b = new G.TextView(ctx);
					b.setTextColor(frcolor);
					b.setTextSize(Common.theme.textsize[2]);
					b.setGravity(G.Gravity.CENTER);
					b.setTypeface(G.Typeface.MONOSPACE);
					b.setPadding(0, 10 * G.dp, 0, 10 * G.dp);
					b.setText(FCString.parseFC(data[i][j]));
					b.setOnClickListener(onclick);
					l.addView(b, lp2);
				}
				self.line.addView(l, lp1);
			}
			self.exit = new G.TextView(ctx);
			self.exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			self.exit.setText("关闭");
			self.exit.setTextSize(Common.theme.textsize[2]);
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setTextColor(frcolor);
			self.exit.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 20 * G.dp);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				CA.hideFCS();
				return true;
			} catch(e) {erp(e)}}}));
			self.line.addView(self.exit);
			
			self.scr.addView(self.line);
			self.frame.addView(self.scr);
		}
		if (v) self.prompt.setText(FCString.parseFC(v));
		if (CA.fcs) return CA.fcs.bringToFront();
		CA.fcs = self.frame;
		CA.con.addView(CA.fcs);
	} catch(e) {erp(e)}})},
	hideFCS : function() {G.ui(function() {try {
		if (!CA.fcs) return;
		CA.con.removeView(CA.fcs);
		CA.fcs = null;
	} catch(e) {erp(e)}})},
	
	showPaste : function self(index) {G.ui(function() {try {
		if (!self.bar) {
			self.bar = new G.LinearLayout(ctx);
			self.bar.setAlpha(0.8);
			self.bar.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			self.bar.setOrientation(G.LinearLayout.HORIZONTAL);
			self.bar.setBackgroundColor(Common.theme.float_bgcolor);
			
			self.buttonlis = new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				switch (e.getAction()) {
					case e.ACTION_DOWN:
					v.setBackgroundColor(Common.theme.go_touchbgcolor);
					v.setTextColor(Common.theme.go_touchtextcolor);
					break;
					case e.ACTION_CANCEL:
					case e.ACTION_UP:
					v.setBackgroundColor(Common.theme.go_bgcolor);
					v.setTextColor(Common.theme.go_textcolor);
				}
				return false;
			} catch(e) {erp(e)}}});
			
			self.refresh = function() {
				self.cmd.setText(CA.his[self.cur]);
				Common.setClipboardText(self.cmd.getText());
			}
			
			self.prev = new G.TextView(ctx);
			self.prev.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.prev.setText("<");
			self.prev.setBackgroundColor(Common.theme.go_bgcolor);
			self.prev.setTextSize(Common.theme.textsize[3]);
			self.prev.setTextColor(Common.theme.go_textcolor);
			self.prev.setGravity(G.Gravity.CENTER);
			self.prev.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.prev.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var t = CA.his.length;
				if (t == 0) return true;
				self.cur = (self.cur + 1) % t;
				self.refresh();
				return true;
			} catch(e) {erp(e)}}}));
			self.prev.setOnTouchListener(self.buttonlis);
			self.bar.addView(self.prev);
			
			self.next = new G.TextView(ctx);
			self.next.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.next.setText(">");
			self.next.setBackgroundColor(Common.theme.go_bgcolor);
			self.next.setTextSize(Common.theme.textsize[3]);
			self.next.setTextColor(Common.theme.go_textcolor);
			self.next.setGravity(G.Gravity.CENTER);
			self.next.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.next.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var t = CA.his.length;
				if (t == 0) return true;
				self.cur = (t + self.cur - 1) % t;
				self.refresh();
				return true;
			} catch(e) {erp(e)}}}));
			self.next.setOnTouchListener(self.buttonlis);
			self.bar.addView(self.next);
			
			self.cmd = new G.EditText(ctx);
			self.cmd.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -1, 1.0));
			self.cmd.setBackgroundColor(G.Color.TRANSPARENT);
			self.cmd.setTextSize(Common.theme.textsize[3]);
			self.cmd.setTextColor(Common.theme.textcolor);
			self.cmd.setSingleLine(true);
			self.cmd.setFocusable(false);
			self.cmd.setHintTextColor(Common.theme.promptcolor);
			self.cmd.setPadding(5 * G.dp, 10 * G.dp, 0, 10 * G.dp);
			self.cmd.setTypeface(G.Typeface.MONOSPACE);
			self.cmd.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				if (e.getAction() == e.ACTION_UP && e.getEventTime() - e.getDownTime() < 100) {
					self.exit.performClick();
					CA.cmd.setText(self.cmd.getText());
					CA.showGen(CA.settings.noAnimation);
					v.postDelayed(new java.lang.Runnable({run : function() {try {
						CA.showGen.activate(true);
					} catch(e) {erp(e)}}}), 500);
				}
				return false;
			} catch(e) {erp(e)}}}));
			self.bar.addView(self.cmd);
			
			self.paste = new G.TextView(ctx);
			self.paste.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.paste.setText("📋");
			self.paste.setTextSize(Common.theme.textsize[3]);
			self.paste.setTextColor(Common.theme.promptcolor);
			self.paste.setGravity(G.Gravity.CENTER);
			self.paste.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.paste.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (MapScript.host == "AutoJs") {
					input(self.cmd.getText().toString());
				} else {
					ctx.updateTextboxText(self.cmd.getText().toString());
				}
			} catch(e) {
				if (MapScript.host == "AutoJs") {
					Common.toast("请打开无障碍服务");
				} else {
					Common.toast("当前版本暂不支持粘贴命令");
				}
			}}}));
			self.bar.addView(self.paste);
			
			self.exit = new G.TextView(ctx);
			self.exit.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setBackgroundColor(Common.theme.go_bgcolor);
			self.exit.setText("关闭");
			self.exit.setTextSize(Common.theme.textsize[3]);
			self.exit.setTextColor(Common.theme.go_textcolor);
			self.exit.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				CA.hidePaste();
				return true;
			} catch(e) {erp(e)}}}));
			self.exit.setOnTouchListener(self.buttonlis);
			self.bar.addView(self.exit);
		}
		self.cur = index;
		self.refresh();
		if (CA.paste) return;
		CA.paste = new G.PopupWindow(self.bar, -1, -2);
		if (CA.supportFloat) CA.paste.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		CA.paste.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.TOP, 0, 0);
	} catch(e) {erp(e)}})},
	hidePaste : function() {G.ui(function() {try {
		if (CA.paste) CA.paste.dismiss();
		CA.paste = null;
	} catch(e) {erp(e)}})},
	
	showLibraryMan : function self(callback) {G.ui(function() {try {
		if (!self.linear) {
			self.contextMenu = [{
				text : "从文件中导入",
				description : "导入外置命令库",
				onclick : function(v, tag) {
					Common.showFileDialog({
						type : 0,
						callback : function(f) {
							self.postTask(function(cb) {
								if (!CA.IntelliSense.enableLibrary(String(f.result.getAbsolutePath()))) {
									Common.toast("无法导入该命令库，可能文件不存在");
									cb(false);
									return;
								}
								cb(true, function() {
									Common.toast("导入成功！");
								});
							});
						}
					});
				}
			},{
				text : "刷新",
				description : "刷新所有的命令库",
				onclick : function(v, tag) {
					self.postTask(function(cb) {
						cb(true, function() {
							Common.toast("刷新成功");
						});
					});
				}
			},{
				text : "忽略版本",
				description : "暂时忽略版本限制",
				onclick : function(v, tag) {
					self.postTask(function(cb) {
						CA.IntelliSense.ignoreVersion = true;
						cb(true, function() {
							Common.toast("版本限制已关闭，重新打开游戏即可恢复。");
						});
					});
				}
			},{
				text : "恢复默认",
				description : "将命令库恢复为默认命令库",
				onclick : function(v, tag) {
					self.postTask(function(cb) {
						CA.settings.enabledLibrarys.length = CA.settings.disabledLibrarys.length = 0;
						CA.IntelliSense.enableLibrary("default");
						cb(true, function() {
							Common.toast("已恢复为默认命令库");
						});
					});
				}
			}];
			self.itemMenu = [{
				text : "移除",
				description : "将该命令库从列表中移除",
				onclick : function(v, tag) {
					if (tag.data.mode == 0) {
						Common.toast("内置命令库无法删除");
						return true;
					}
					self.postTask(function(cb) {
						CA.IntelliSense.removeLibrary(tag.data.src);
						cb(true, function() {
							Common.toast("该命令库已从列表中移除");
						});
					});
				}
			},{
				text : "查看信息",
				description : "查看该命令库文件的相关信息",
				onclick : function(v, tag) {
					var f = new java.io.File(tag.data.src), s;
					s = "名称 : " + tag.data.name;
					if (f.isFile()) s += "\n位置 : " + tag.data.src + "\n大小 : " + Common.getFileSize(f, true) + "\n时间 : " + new Date(f.lastModified()).toLocaleString();
					if (!tag.data.disabled && !tag.data.hasError) s += "\n\n" + tag.data.stat.toString();
					Common.showTextDialog(s);
				}
			}];
			self.enabledMenu = [{
				text : "检测更新",
				description : "如果可行，连接服务器检测是否有更新",
				onclick : function(v, tag) {
					if (tag.data.mode == 0 || !tag.data.update) {
						Common.toast("该命令库暂不支持检测更新");
						return true;
					}
					self.postTask(function(cb) {new java.lang.Thread(function() {try {
						var r, d = tag.data, u = d.update, i, f = false, dl;
						try {
							if (typeof u == "function") {
								r = tag.data.update();
							} else if (typeof u == "string") {
								r = JSON.parse(Updater.queryPage(u));
							}
							if (!(r instanceof Object) || !Array.isArray(r.version)) {
								Common.toast("该命令库没有更新数据");
								return cb(false);
							}
							for (i = 0; i < d.version.length; i++) {
								if (d.version[i] > r.version[i]) {
									break;
								} else if (d.version[i] < r.version[i]) {
									f = true;
									break;
								}
							}
							if (f) {
								Common.toast("更新中……\n" + d.version.join(".") + " -> " + r.version.join("."));
								Updater.download(r.url, tag.data.src);
								cb(true, function() {
									Common.toast("更新完成：" + r.version.join("."));
								});
							} else {
								Common.toast("已是最新版本：" + r.version.join("."));
								cb(false);
							}
						} catch(e) {
							Common.toast("检测更新失败\n" + e);
							cb(false);
						}
					} catch(e) {erp(e)}}).start()});
				}
			},{
				text : "编辑",
				description : "用JSON编辑器编辑该命令库",
				onclick : function(v, tag) {
					if (tag.data.mode != 1) {
						Common.toast("命令库已被锁定，无法编辑");
						return true;
					}
					self.postTask(function(cb) {
						var a = MapScript.readJSON(tag.data.src, {});
						if (!(a instanceof Object)) a = {};
						JSONEdit.show({
							source : a,
							rootname : "命令库",
							update : function() {
								try {
									self.processing = true;
									MapScript.saveJSON(tag.data.src, a);
									cb(true, function() {
										Common.toast("加载成功！");
									});
								} catch(e) {
									Common.toast("格式不合法，无法保存\n" + e);
									cb(false);
									return;
								}
							}
						});
					});
				}
			},{
				text : "另存为",
				description : "将该命令库保存到一个新文件里",
				onclick : function(v, tag) {
					if (tag.data.hasError) {
						Common.toast("该命令库有错误，不能另存为");
						return true;
					}
					Common.showFileDialog({
						type : 1,
						callback : function(f) {
							self.postTask(function(cb) {
								var fp = String(f.result.getAbsolutePath());
								try {
									if (tag.data.mode == 0) {
										MapScript.saveJSON(fp, CA.IntelliSense.inner[tag.data.src]);
									} else {
										Common.fileCopy(new java.io.File(tag.data.src), f.result);
									}
									CA.IntelliSense.disableLibrary(fp);
									cb(true, function() {
										Common.toast("当前命令库已另存为" + fp);
									});
								} catch(e) {
									erp(e)
									Common.toast("文件保存失败，无法另存为\n" + e);
									cb(false);
								}
							});
						}
					});
				}
			},{
				text : "创建副本",
				description : "创建该命令库的副本（副本不会被认为与原命令库相同）",
				onclick : function(v, tag) {
					if (tag.data.hasError) {
						Common.toast("该命令库有错误，不能创建副本");
						return true;
					}
					if (tag.data.mode == 2) {
						Common.toast("命令库已被锁定，不能创建副本");
						return true;
					}
					Common.showFileDialog({
						type : 1,
						callback : function(f) {
							self.postTask(function(cb) {
								var fp = String(f.result.getAbsolutePath()), l;
								try {
									if (tag.data.mode == 0) {
										l = Object.copy(CA.IntelliSense.inner[tag.data.src]);
									} else {
										l = MapScript.readJSON(tag.data.src, null);
										if (!(l instanceof Object)) throw "无法读取文件";
									}
									l.name = String(l.name) + " 的副本";
									l.uuid = String(java.util.UUID.randomUUID().toString());
									MapScript.saveJSON(fp, l);
									CA.IntelliSense.enableLibrary(fp);
									cb(true, function() {
										Common.toast("当前命令库的副本已创建" + fp);
									});
								} catch(e) {
									erp(e)
									Common.toast("文件保存失败，无法创建副本\n" + e);
									cb(false);
								}
							});
						}
					});
				}
			},{
				text : "锁定",
				description : "锁定命令库，使其不能被编辑",
				onclick : function(v, tag) {
					if (tag.data.mode != 1) {
						Common.toast("该命令库已被锁定");
						return true;
					}
					if (tag.data.hasError) {
						Common.toast("该命令库有错误，不能锁定");
						return true;
					}
					if (tag.lockConfirmed) {
						tag.lockConfirmed = false;
					} else {
						Common.toast("确认要锁定这个命令库吗？锁定后无法解锁。\n再次点击以确认");
						return tag.lockConfirmed = true;
					}
					self.postTask(function(cb) {
						try {
							CA.IntelliSense.savePrefixed(tag.data.src, MapScript.readJSON(tag.data.src));
							cb(true, function() {
								Common.toast("该命令库已锁定");
							});
						} catch(e) {
							Common.toast("文件保存失败\n" + e);
							cb(false);
						}
					});
				}
			},{
				text : "上移",
				description : "使该命令库较早加载",
				onclick : function(v, tag) {
					if (tag.data.index < 1) {
						Common.toast("该命令库已在顶端，无法继续上移");
						return true;
					}
					self.postTask(function(cb) {
						var a = CA.settings.enabledLibrarys;
						a.splice(tag.data.index - 1, 0, a.splice(tag.data.index, 1)[0]);
						cb(true, function() {});
					});
				}
			},{
				text : "下移",
				description : "使该命令库较晚加载",
				onclick : function(v, tag) {
					if (tag.data.index > CA.settings.enabledLibrarys.length - 2) {
						Common.toast("该命令库已在底端，无法继续下移");
						return true;
					}
					self.postTask(function(cb) {
						var a = CA.settings.enabledLibrarys;
						a.splice(tag.data.index + 1, 0, a.splice(tag.data.index, 1)[0]);
						cb(true, function() {});
					});
				}
			},{
				text : "停用",
				description : "停用该命令库",
				onclick : function(v, tag) {
					self.postTask(function(cb) {
						CA.IntelliSense.disableLibrary(tag.data.src);
						cb(true, function() {
							Common.toast("该命令库已停用");
						});
					});
				}
			}].concat(self.itemMenu);
			self.disabledMenu = [{
				text : "启用",
				description : "启用该命令库",
				onclick : function(v, tag) {
					self.postTask(function(cb) {
						CA.IntelliSense.enableLibrary(tag.data.src);
						cb(true, function() {
							Common.toast("该命令库已启用");
						});
					});
				}
			}].concat(self.itemMenu);
			self.errMenu = [{
				text : "查看堆栈",
				onclick : function(v, tag) {
					if (tag.data.error instanceof Object && tag.data.error.stack) {
						Common.showTextDialog(String(tag.data.error.stack));
					} else {
						Common.toast("错误堆栈不存在");
						return true;
					}
				}
			}].concat(self.enabledMenu);
			self.adapter = function(e, i, a) {
				var layout = new G.LinearLayout(ctx),
					text1 = new G.TextView(ctx),
					text2 = new G.TextView(ctx);
				layout.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
				layout.setOrientation(G.LinearLayout.VERTICAL);
				text1.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 5 * G.dp);
				text1.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
				text1.setText((e.mode == 0 ? "[内置] " : e.mode == 2 ? "[锁定] " : "") + e.name + (e.disabled || e.hasError ? "" : " (已启用)"));
				text1.setTextSize(Common.theme.textsize[3]);
				text1.setTextColor(e.disabled ? Common.theme.promptcolor : e.hasError ? Common.theme.criticalcolor : Common.theme.textcolor);
				text1.setEllipsize(G.TextUtils.TruncateAt.MIDDLE);
				text1.setSingleLine(true);
				layout.addView(text1);
				text2.setPadding(15 * G.dp, 0, 15 * G.dp, 15 * G.dp);
				text2.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
				text2.setText(e.disabled ? "已禁用" : e.hasError ? "加载出错 :\n" + e.error : "版本 : " + e.version.join(".") + "\n作者 : " + e.author + (e.description && e.description.length ? "\n\n" + e.description : ""));
				text2.setTextSize(Common.theme.textsize[1]);
				text2.setTextColor(Common.theme.promptcolor);
				layout.addView(text2);
				return layout;
			}
			self.refresh = function() {
				var arr = CA.IntelliSense.library.info.concat(CA.settings.disabledLibrarys.map(function(e, i, a) {
					var k = e in CA.IntelliSense.inner;
					return {
						src : e,
						index : i,
						mode : k ? 0 : -1,
						name : k ? CA.IntelliSense.inner[e].name : (new java.io.File(e)).getName(),
						disabled : true
					};
				}));
				self.list.setAdapter(new RhinoListAdapter(arr, self.adapter));
			}
			self.postTask = function(f) {
				if (self.processing) {
					Common.toast("处理中，请稍候……");
					return true;
				}
				self.processing = true;
				f(function(success, callback) {
					if (!success) return self.processing = false;
					CA.IntelliSense.initLibrary(function() {
						G.ui(function() {try {
							self.refresh();
							self.processing = false;
							callback();
						} catch(e) {erp(e)}});
					});
				});
			}
			self.processing = false;
			
			self.linear = new G.LinearLayout(ctx);
			self.linear.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -1));
			self.linear.setOrientation(G.LinearLayout.VERTICAL);
			self.linear.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
			self.linear.setBackgroundColor(Common.theme.message_bgcolor);
			
			self.header = new G.LinearLayout(ctx);
			self.header.setOrientation(G.LinearLayout.HORIZONTAL);
			self.header.setPadding(0, 0, 0, 10 * G.dp);
			self.header.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				Common.showOperateDialog(self.contextMenu, {
					callback : function() {G.ui(function() {try {
						self.refresh();
					} catch(e) {erp(e)}})}
				});
				return true;
			} catch(e) {erp(e)}}}));
			
			self.title = new G.TextView(ctx);
			self.title.setText("管理命令库");
			self.title.setGravity(G.Gravity.LEFT | G.Gravity.CENTER);
			self.title.setPadding(10 * G.dp, 0, 10 * G.dp, 0);
			self.title.setTextSize(Common.theme.textsize[4]);
			self.title.setTextColor(Common.theme.textcolor);
			self.header.addView(self.title, new G.LinearLayout.LayoutParams(0, -2, 1.0));
			
			self.menu = new G.TextView(ctx);
			self.menu.setText("▼");
			self.menu.setPadding(10 * G.dp, 0, 10 * G.dp, 0);
			self.menu.setGravity(G.Gravity.CENTER);
			self.menu.setTextSize(Common.theme.textsize[3]);
			self.menu.setTextColor(Common.theme.highlightcolor);
			self.header.addView(self.menu, new G.LinearLayout.LayoutParams(-2, -1));
			self.linear.addView(self.header, new G.LinearLayout.LayoutParams(-1, -2));
			
			self.list = new G.ListView(ctx);
			self.list.setBackgroundColor(G.Color.TRANSPARENT);
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				var data = parent.getAdapter().getItem(pos);
				Common.showOperateDialog(data.disabled ? self.disabledMenu : data.hasError ? self.errMenu : self.enabledMenu, {
					pos : parseInt(pos),
					data : data,
					callback : function() {G.ui(function() {try {
						self.refresh();
					} catch(e) {erp(e)}})}
				});
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.list, new G.LinearLayout.LayoutParams(-1, 0, 1.0));
			
			self.exit = new G.TextView(ctx);
			self.exit.setText("确定");
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
			self.exit.setTextSize(Common.theme.textsize[3]);
			self.exit.setTextColor(Common.theme.criticalcolor);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				
				self.popup.dismiss();
				return true;
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.exit, new G.LinearLayout.LayoutParams(-1, -2));
		}
		if (self.popup) self.popup.dismiss();
		self.popup = new G.PopupWindow(self.linear, -1, -1);
		if (CA.supportFloat) self.popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		self.popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		self.popup.setFocusable(true);
		self.popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			callback();
			self.popup = null;
		} catch(e) {erp(e)}}}));
		self.refresh();
		self.popup.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(self.popup);
	} catch(e) {erp(e)}})},
	
	showModeChooser : function self(callback) {
		if (self.popup) return;
		if (!self.menu) {
			self.menu = [{
				text : "关闭",
				description : "禁用IntelliSense的所有功能",
				onclick : function(v, tag) {
					CA.settings.iiMode = 0;
					tag.callback();
				}
			},{
				text : "初学者模式",
				description : "只启用提示助手",
				onclick : function(v, tag) {
					CA.settings.iiMode = 1;
					tag.callback();
				}
			},{
				text : "专家模式",
				description : "启用提示助手与智能补全",
				onclick : function(v, tag) {
					CA.settings.iiMode = 2;
					tag.callback();
				}
			}];
		}
		Common.showOperateDialog(self.menu, {
			callback : function() {
				callback();
			}
		});
	},
	
	/*
	showBatch : function() {G.ui(function() {try {
		
	} catch(e) {erp(e)}})},
	hideBatch : function() {G.ui(function() {try {
		
	} catch(e) {erp(e)}})},
	*/
	IntelliSense : {
		UNINITIALIZED : 0,
		ONLY_COMMAND_NAME : 1,
		UNKNOWN_COMMAND : -1,
		COMMAND_WITH_PATTERN : 2,
		UNKNOWN_PATTERN : -2,
		inner : {},
		
		input : [],
		output : [],
		cmdname : "",
		prompt : [],
		help : "",
		patterns : [],
		mode : 0,
		last : "",
		callDelay : function self(s) {
			if (CA.settings.iiMode != 2) return;
			self.current = s;
			if (self.thread) return;
			self.thread = new java.lang.Thread(new java.lang.Runnable({run : function() {try {
				var t;
				while (t = self.current) {
					self.current = null;
					CA.IntelliSense.proc(t);
				}
				self.thread = null;
			} catch(e) {erp(e)}}}));
			self.thread.start();
		},
		apply : function() {
			if (this.ui) this.show.apply(this);
		},
		proc : function(s) {try {
			if (CA.settings.iiMode != 2) return;
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
			Common.showTextDialog("当前命令库解析出错。\n" + e);
		}},
		procCmd : function(s) {
			var c, ca, t, i, pp, r;
			
			//分析命令结构 - 拆分
			c = /^(\/)?(\S*)(\s+)?(.*)/.exec(s);
			if (!c) return; //c = [匹配文本, 是否存在/, 命令名称, 是否存在命令名称后的空格, 命令参数]
			
			r = {
				source : c[0],
				cmdname : c[2],
				hasSlash :Boolean(c[1]),
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
				ca = Object.keys(this.library.commands).filter(function(e, i, a) {
					return e.startsWith(c[2].toLowerCase());
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
				r.output = {};
				ca.forEach(function(e, i, a) {
					t = this.library.commands[e];
					while (t.alias) t = this.library.commands[t.alias];
					r.output[t.description ? e + " - " + t.description : e] = (r.hasSlash ? "/" : "") + e + (t.noparams ? "" : " ");
				}, this);
				r.input = Object.keys(r.output);
			}
			return r;
		},
		procParams : function(c) {
			var i, j, cm = this.library.commands[c.cmdname], ps, pa, ci, cp, t, f = true, k, u, ms, pp, cpl = [], nn = false;
			
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
				pp = new G.SpannableStringBuilder((c.hasSlash ? "/" : "") + c.cmdname + " ");
				appendSSB(pp, "...", new G.ForegroundColorSpan(Common.theme.highlightcolor));
				pp.append("\n");
				appendSSB(pp, "无法在库中找到命令“" + c.cmdname + "”的此类用法。", new G.ForegroundColorSpan(Common.theme.criticalcolor));
				c.prompt.push(pp);
			} else if (nn) {
				c.input.push("  - 下一个参数");
				c.output["  - 下一个参数"] = c.source + " ";
			}
			c.mode = f ? this.UNKNOWN_PATTERN : this.COMMAND_WITH_PATTERN;
		},
		matchParam : function(cp, ps) {
			var i, r, t, t2, t3, t4;
			switch (cp.type) {
				case "nbt":
				case "rawjson":
				case "text":
				case "json":
				r = {
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
				} else if (cp.name.startsWith(ps)) {
					r.length = ps.length;
					r.canFinish = false;
				} else return null;
				break;
				
				case "selector":
				r = this.procSelector(cp, ps);
				if (!r) return null;
				break;
				
				case "uint":
				t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
				if (!(/^\d*$/).test(t)) return null;
				r = {
					length : t.length,
					canFinish : t.length > 0
				};
				break;
				
				case "int":
				t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
				if (!(/^(\+|-)?\d*$/).test(t)) return null;
				r = {
					length : t.length,
					canFinish : t.length && !isNaN(t)
				};
				break;
				
				case "float":
				t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
				if (!(t2 = (/^(\+|-)?(\d*\.)?(\d)*$/).exec(t))) return null;
				r = {
					length : t.length,
					canFinish : t.length && t2[3]
				};
				break;
				
				case "relative":
				t = ps.search(" ") < 0 ? ps : ps.slice(0, ps.search(" "));
				if (!(t2 = (/^(~)?((\+|-)?(\d*\.)?(\d)*)$/).exec(t))) return null;
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
				if (!r) return null;
				break;
				
				case "custom":
				t = new RegExp(cp.input, "").exec(ps);
				if (!t) return null;
				r = {
					length : t[0].length,
					canFinish : new RegExp(cp.finish, "").test(ps)
				};
				break;
				
				case "enum":
				if (!(t = cp.list instanceof Object ? cp.list : this.library.enums[cp.list])) return;
				r = {
					output : {},
					canFinish : false,
					length : -1
				};
				if (Array.isArray(t)) {
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
				break;
				
				case "command":
				t = this.procCmd(ps);
				r = {
					length : t.source.length,
					input : t.input,
					output : t.output,
					canFinish : t.canFinish
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
			if (!r.input) r.input = [];
			if (!r.output) r.output = {};
			if (Array.isArray(t)) {
				t3 = [];
				t.forEach(function(e, i, a) {
					if (!e.startsWith(ps)) return;
					r.output[e] = e;
					if (r.input.indexOf(e) < 0) t3.push(e);
				});
				t3.sort();
				r.input = r.input.concat(t3);
			} else {
				t3 = []; t4 = [];
				Object.keys(t).forEach(function(e, i, a) {
					if (e.indexOf(t2) < 0 && t[e].indexOf(t2) < 0) return;
					if (t[e]) {
						t5 = e + " - " + t[e];
						r.output[t5] = e;
						if (r.input.indexOf(t5) < 0) t3.push(t5);
					} else {
						r.output[e] = e;
						if (r.input.indexOf(e) < 0) t4.push(e);
					}
				});
				t3.sort(); t4.sort(); r.input = r.input.concat(t3, t4);
			}
			return r;
		},
		getParamTag : function(cp, ms, mt, md) { //匹配模式，匹配字符串，匹配类型（已输入、输入中、未输入），matchParam返回的匹配数据
			var z = cp.name, t, l;
			if (mt == 1) {
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
					z += ":x y z";
					t = (/(\S*)\s*(\S*)\s*(\S*)/).exec(ms);
					if (t[1]) z = z.replace("x", t[1]);
					if (t[2]) z = z.replace("y", t[2]);
					if (t[3]) z = z.replace("z", t[3]);
					break;
					
					case "command":
					z += ":命令";
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
				if (!(/^[^@\^~]*$/).test(ms) || ms.length && !isNaN(ms)) return null;
				if (cp.target == "entity" || cp.target == "player") {
					t.recommend["@a - 选择所有玩家"] = "@a";
					t.recommend["@p - 选择距离最近的玩家"] = "@p";
					t.recommend["@r - 选择随机玩家"] = "@r";
				}
				if (cp.target == "entity" || cp.target == "nonplayer") t.recommend["@e - 选择所有实体"] = "@e";
				if (cp.target != "nonselector") t.recommend["@s - 选择命令执行者"] = "@s";
				t.input = Object.keys(t.recommend);
				if (F3.inLevel) {
					t.output = {};
					pl = Server.getAllPlayerNames();
					for (i in pl) if (String(pl[i]).startsWith(ms)) t.output[pl[i]] = String(pl[i]);
					t.input = t.input.concat(Object.keys(t.output));
				}
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
				for (i in ml) { //检验之前的参数
					if (!(ms = rx.exec(ml[i]))) return null;
					if (sk) continue;
					if (!(cp2 = this.library.selectors[ms[1]])) continue;
					if (cp2.hasInverted && ms[3].search(/^!/) == 0) {
						ms[3] = ms[3].slice(1);
					} else pl[ms[1]] = true;
					mr = this.matchParam(cp2, ms[3] + " ");
					if (!mr || mr.length < ms[3].length || !mr.canFinish) return null;
				}
				rx = sk ? /^(\+|-)?(\d*\.)?\d*$/ : /^([^\=]*)(\=)?(.*)$/;
				if (!(ms = rx.exec(ls))) return null;
				if (sk) { // 特殊处理
					t.recommend[", - 下一个参数"] = bb + ls + ",";
					t.output["] - 结束参数"] = bb + ls + "]";
					t.input.push(", - 下一个参数", "] - 结束参数");
					return t;
				}
				if (ms[2]) { // 输入修饰符内容
					if (!ms[1]) return null;
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
						if (!mr || mr.length < ms[3].length) return null;
						if (mr.canFinish) {
							t.recommend[", - 下一个参数"] = bb + ms[3] + ",";
							t.output["] - 结束参数"] = bb + ms[3] + "]";
							t.input.push(", - 下一个参数", "] - 结束参数");
						}
						for (i in mr.assist) if (!(i in t.recommend)) t.recommend[i] = ps + mr.assist[i];
						for (i in mr.recommend) if (!(i in t.recommend)) t.recommend[i] = bb + mr.recommend[i];
						for (i in mr.output) if (!(i in t.recommend)) t.recommend[i] = bb + mr.output[i];
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
			} else return null;
			return t;
		},
		procPosition : function(cp, ps) {
			var l = ps.split(/\s+/), f = true, uv = false, i, n = Math.min(l.length, 3), t;
			for (i = 0; i < n; i++) {
				if (i == 0 && l[0].startsWith("^")) uv = true;
				if (!(t = (uv ? /^(?:(\^)((\+|-)?(\d*\.)?\d*))?$/ : /^(~)?((\+|-)?(\d*\.)?\d*)$/).exec(l[i]))) return null;
				if ((!t[1] || t[2]) && !(/^(\+|-)?(\d*\.)?\d+$/).test(t[2])) if (i == n - 1) {
					f = false;
				} else return null;
			}
			t = {
				length : n == 3 && l[2].length > 0 ? (/^\S+\s+\S+\s+\S+/).exec(ps)[0].length : ps.length,
				input : [],
				assist : {},
				canFinish : f && n == 3
			}
			if (l[n - 1].length > 0) {
				t.input.push("  - 空格");
				t.assist["  - 空格"] = " ";
			} else {
				if (!uv) {
					t.input.push("~ - 相对位置");
					t.assist["~ - 相对位置"] = "~";
				}
				if (ps.length == 0 || uv) {
					t.input.push("^ - 相对视角");
					t.assist["^ - 相对视角"] = "^";
				}
			}
			if (F3.inLevel) {
				t.output = {};
				if (Player.getY() != 0) {
					t3 = Player.getY() - 1.619999885559082;
					t2 = [Player.getX(), t3, Player.getZ()].join(" ");
					t.output[t2 + " - 玩家实际坐标"] = t2;
					t2 = [Math.floor(Player.getX()), Math.floor(t3), Math.floor(Player.getZ())].join(" ");
					t.output[t2 + " - 玩家脚部方块坐标"] = t2;
					t2 = [Math.floor(Player.getX()), Math.floor(t3 + 1), Math.floor(Player.getZ())].join(" ");
					t.output[t2 + " - 玩家头部方块坐标"] = t2;
					t2 = [Math.floor(Player.getX()), Math.floor(t3 - 1), Math.floor(Player.getZ())].join(" ");
					t.output[t2 + " - 玩家脚下方块坐标"] = t2;
					if (Player.getPointedBlockY() >= 0) {
						t2 = [Player.getPointedBlockX(), Player.getPointedBlockY(), Player.getPointedBlockZ()].join(" ");
						t.output[t2 + " - 玩家指向方块坐标"] = t2;
					}
				}
				t.input = t.input.concat(Object.keys(t.output));
			}
			return t;
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
						ctx.startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4")));
					} catch(e) {
						Common.showWebViewDialog({
							url : "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4"
						});
					}
				},
				"加入我们..." : function() {
					try {
						ctx.startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("https://jq.qq.com/?_wv=1027&k=46Yl84D")));
					} catch(e) {
						Common.toast("QQ群号已复制至剪贴板");
						Common.setClipboardText("207913610");
					}
				},
				"意见反馈" : function() {
					try {
						ctx.startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("mqqwpa://im/chat?chat_type=wpa&uin=3493569662")));
					} catch(e) {
						Common.toast("作者QQ（BUG反馈请找我）：814518615\n已复制到剪贴板");
						Common.setClipboardText("814518615");
					}
				}
			};
			this.input = Object.keys(this.output);
			pp.append("命令助手 - 设置 & 关于\n");
			appendSSB(pp, "（这个命令的用途是显示帮助，不过你有这个JS就不需要帮助了吧）", new G.ForegroundColorSpan(Common.theme.promptcolor));
			this.prompt = [pp];
			this.help = CA.help;
			this.patterns = [];
			return this.apply();
		},
		show : function self() {G.ui(function() {try {
			if (CA.IntelliSense.ui) return;
			if (!self.prompt) {
				self.apply = function(z) {G.ui(function() {try {
					self.prompt.setText(z.prompt[0] || "");
					try {
						new java.net.URL(z.help);
						CA.showAssist.postHelp(0, z.help);
					} catch(e) {
						CA.showAssist.postHelp(1, z.help || "暂时没有帮助，以后会加上的啦");
					}
					self.list.setAdapter(new RhinoListAdapter(z.input, self.adapter));
				} catch(e) {erp(e)}})}
				self.adapter = function(s, i, a) {
					var view = new G.TextView(ctx);
					if (self.keep) {
						view.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
					} else {
						view.setPadding(15 * G.dp, 2 * G.dp, 15 * G.dp, 2 * G.dp);
					}
					view.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
					view.setText(s);
					view.setTextSize(Common.theme.textsize[3]);
					view.setTextColor(Common.theme.textcolor);
					return view;
				}
				self.prompt = new G.TextView(ctx);
				self.prompt.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				self.prompt.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
				self.prompt.setTextColor(Common.theme.textcolor);
				self.prompt.setTextSize(Common.theme.textsize[2]);
				self.prompt.setTypeface(G.Typeface.MONOSPACE);
				self.prompt.setLineSpacing(10, 1);
				self.list = new G.ListView(ctx);
				self.list.setBackgroundColor(G.Color.TRANSPARENT);
				self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
					if (pos == 0) {
						CA.IntelliSense.showMoreUsage();
						return true;
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
						var rect;
						if (self.lastToast) self.lastToast.cancel();
						self.lastToast = G.Toast.makeText(ctx, String(a), 0);
						view.getGlobalVisibleRect(rect = new G.Rect());
						self.lastToast.setGravity(G.Gravity.CENTER, rect.centerX() - Common.getScreenWidth() / 2, rect.centerY() - Common.getScreenHeight() / 2);
						self.lastToast.show();
					}
					return true;
				} catch(e) {erp(e)}}}));
				self.list.addOnLayoutChangeListener(new G.View.OnLayoutChangeListener({onLayoutChange : function(v, l, t, r, b, ol, ot, or, ob) {try {
					var t = (b - t > 0.5 * CA.showAssist.con.getMeasuredHeight()) || CA.settings.keepWhenIME;
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
				CA.showAssist.initContent(self.list);
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
		},
		initLibrary : function(callback) {(new java.lang.Thread(new java.lang.Runnable({run : function() {try {
			var info, flag = true;
			CA.IntelliSense.library = {
				commands : {},
				enums : {},
				selectors : {},
				help : {},
				info : info = []
			};
			CA.settings.enabledLibrarys.forEach(function(e, i, a) {
				var m = 0, v, cur;
				try {
					cur = CA.IntelliSense.inner[e] || (m = 1, MapScript.readJSON(e, null)) || (m = 2, MapScript.readJSON(e, null, true)) || (m = 2, CA.IntelliSense.loadPrefixed(e, null));
					if (!cur) throw "无法读取文件";
					if ((v = CA.IntelliSense.checkPackVer(cur)) != 0) throw v > 0 ? "命令库版本过低" : "游戏版本过低";
					CA.IntelliSense.loadLibrary(CA.IntelliSense.library, cur);
					info.push({
						src : e,
						index : i,
						name : cur.name,
						author : cur.author,
						description : cur.description,
						uuid : cur.uuid,
						version : cur.version,
						update : cur.update,
						mode : m,
						stat : CA.IntelliSense.statLib(cur, CA.IntelliSense.library),
						loaded : true
					});
				} catch(err) {
					flag = false;
					info.push({
						src : e,
						index : i,
						name : cur instanceof Object && typeof cur.name == "string" ? String(cur.name) : m = 0 ? e : (new java.io.File(e)).getName(),
						hasError : true,
						mode : m,
						error : err
					});
				}
			}, this);
			if (callback) callback(flag);
		} catch(e) {erp(e)}}}))).start()},
		enableLibrary : function(name) {
			var a, p;
			if (!(name in this.inner) && !(new java.io.File(name)).isFile()) return false;
			a = CA.settings.disabledLibrarys;
			p = a.indexOf(name);
			if (p >= 0) a.splice(p, 1);
			a = CA.settings.enabledLibrarys;
			p = a.indexOf(name);
			if (p < 0) a.push(name);
			return true;
		},
		disableLibrary : function(name) {
			var a, p;
			a = CA.settings.enabledLibrarys;
			p = a.indexOf(name);
			if (p >= 0) a.splice(p, 1);
			a = CA.settings.disabledLibrarys;
			p = a.indexOf(name);
			if (p < 0) a.unshift(name);
			return true;
		},
		removeLibrary : function(name) {
			var a, p;
			a = CA.settings.enabledLibrarys;
			p = a.indexOf(name);
			if (p >= 0) a.splice(p, 1);
			a = CA.settings.disabledLibrarys;
			p = a.indexOf(name);
			if (p >= 0) a.splice(p, 1);
			return true;
		},
		loadLibrary : function(cur, l) {
			var c, i;
			this.checkLibrary(l);
			if (this.library.info.some(function(e) {
				return l.uuid == e.uuid;
			})) throw "已存在相同的命令库";
			if (l.require.some(function(e1) {
				return !this.library.info.some(function(e2) {
					return e1 == e2.uuid;
				});
			}, this)) throw "前提库并未全部加载，请检查加载顺序及命令库列表";
			this.joinPack(cur, Object.copy(l)); //创建副本
			if (!l.versionPack) return;
			c = l.versionPack;
			for (i in c) {
				this.joinPack(cur, c[i]); //加载版本包
			}
		},
		loadPrefixed : function(path, defaultValue) {
			try{
				if (!(new java.io.File(path)).isFile()) return defaultValue;
				var rd, s = [], q, dp;
				rd = new java.io.FileInputStream(path);
				rd.skip(15);
				rd = new java.io.BufferedReader(new java.io.InputStreamReader(new java.util.zip.GZIPInputStream(rd)));
				while (q = rd.readLine()) s.push(q);
				rd.close();
				return eval("(" + s.join("\n") + ")");
			} catch(e) {
				return defaultValue;
			}
		},
		savePrefixed : function(path, object) {
			var wr, ar;
			var f = new java.io.File(path).getParentFile();
			if (f) f.mkdirs();
			wr = new java.io.FileOutputStream(path);
			ar = java.nio.ByteBuffer.allocate(15); //LIBRARY
			ar.put([0x4c, 0x49, 0x42, 0x52, 0x41, 0x52, 0x59]).putLong((new java.util.Date()).getTime());
			wr.write(ar.array());
			wr = new java.util.zip.GZIPOutputStream(wr);
			wr.write(new java.lang.String(MapScript.toSource(object)).getBytes());
			wr.close();
		},
		checkLibrary : (function() {
			var stack = null, last = null;
			var e = function(d) {
				throw {
					message : d,
					stack : stack,
					source : last,
					toString : function() {
						return this.stack.join("->") + this.message;
					}
				}
			}
			var checkObject = function(o) {
				if (!o || !(o instanceof Object)) e("不是对象");
			}
			var checkArray = function(o) {
				if (!Array.isArray(o)) e("不是数组");
			}
			var checkUnsignedInt = function(o) {
				if (!(/^\d+$/).test(o)) e("不是正整数");
			}
			var checkString = function(o) {
				if (!(typeof o === "string")) e("不是字符串");
			}
			var checkNotEmptyString = function(o) {
				checkString(o);
				if (!o) e("是空字符串");
			}
			var iterateArray = function(o, iter) {
				var l = stack.length, i;
				checkArray(o);
				stack.length = l + 1;
				for (i = 0; i < o.length; i++) {
					stack[l] = i;
					iter(o[i]);
				}
				stack.length = l;
			}
			return function(a) {
				var i;
				stack = ["根"]; last = a;
				checkObject(a);
				stack.push("名称(name)");
				checkNotEmptyString(a.name);
				stack[1] = "作者(author)";
				checkNotEmptyString(a.author);
				stack[1] = "简介(description)";
				checkString(a.description);
				stack[1] = "UUID(uuid)";
				checkNotEmptyString(a.uuid);
				stack[1] = "版本(version)";
				iterateArray(a.version, checkUnsignedInt);
				stack[1] = "前提库(require)";
				iterateArray(a.require, checkNotEmptyString);
				//stack[1] = "最低支持版本(minSupportVer)";
				//checkNotEmptyString(a.minSupportVer);
				stack[1] = "命令列表(commands)";
				checkObject(a.commands);
				stack[1] = "枚举列表(enums)";
				checkObject(a.enums);
				stack[1] = "选择器参数列表(selectors)";
				checkObject(a.selectors);
				stack[1] = "帮助列表(help)";
				checkObject(a.help);
			}
		})(),
		checkPackVer : (function() {
			var a = String(getMinecraftVersion()).split(".");
			var opt = function(a) {
				return a == "*" ? Infinity : isNaN(a) ? -1 : parseInt(a);
			}
			return function(o) {
				var b, c, n, i, p1, p2;
				if (this.ignoreVersion) return 0;
				if (o.minSupportVer) {
					b = String(o.minSupportVer).split(".");
					n = Math.max(a.length, b.length);
					for (i = 0; i < n; i++) {
						p1 = opt(a[i]); p2 = opt(b[i]);
						if (p1 < p2) {
							return -1; //pe版本过低
						} else if (p1 > p2) break;
					}
				}
				if (o.maxSupportVer) {
					c = String(o.maxSupportVer).split(".");
					n = Math.max(a.length, c.length);
					for (i = 0; i < n; i++) {
						p1 = opt(a[i]); p2 = opt(c[i]);
						if (p1 > p2) {
							return 1; //命令库版本过低
						} else if (p1 < p2) break;
					}
				}
				return 0;
			}
		})(),
		joinPack : (function() {
			var joinCmd = function(src, o) {
				var i, op, sp, t;
				if (o.description) src.description = o.description;
				if (o.help) src.help = o.help;
				if (o.noparams) src.noparams = o.noparams;
				if (o.patterns) {
					op = o.patterns;
					sp = src.patterns;
					if (Array.isArray(sp) != Array.isArray(op)) throw "命令模式格式不一致，无法合并";
					if (Array.isArray(op)) {
						for (i in op) {
							t = sp.indexOf(op[i]);
							if (t < 0) sp.push(op[i]);
						}
					} else {
						for (i in op) sp[i] = op[i];
					}
				}
			}
			var filterCmd = function(src, o) {
				var i, t, op, sp, t;
				if (o.noparams) delete src.noparams;
				if (o.patterns) {
					op = o.patterns;
					sp = src.patterns;
					if (Array.isArray(sp) != Array.isArray(op)) throw "命令模式格式不一致，无法过滤";
					if (Array.isArray(op)) {
						for (i in op) {
							t = sp.indexOf(op[i]);
							if (t >= 0) sp.splice(t, 1);
						}
					} else {
						for (i in op) delete sp[i];
					}
				}
			}
			var joinEnum = function(src, o) {
				var i, t;
				if (Array.isArray(src) && Array.isArray(o)) {
					for (i in o) {
						t = src.indexOf(o[i]);
						if (t < 0) src.push(o[i]);
					}
				} else if (Array.isArray(src) && !Array.isArray(o)) {
					throw "枚举列表格式不一致，无法合并";
				} else if (!Array.isArray(src) && Array.isArray(o)) {
					for (i in o) if (!src[o[i]]) src[o[i]] = "";
				} else {
					for (i in o) if (!src[i] || o[i] != "") src[i] = o[i];
				}
			}
			var filterEnum = function(src, o) {
				var i, t, f = Array.isArray(o) ? o : Object.keys(o);
				if (Array.isArray(src)) {
					for (i in f) {
						t = src.indexOf(f[i]);
						if (t >= 0) src.splice(t, 1);
					}
				} else {
					for (i in f) delete src[f[i]];
				}
			}
			var parseAliasEnum = function(g, o) {
				if (typeof o != "string") return o;
				if (!(o in g.enums)) throw "无效的枚举引用";
				return g.enums[o];
			}
			return function(cur, l) {
				if (this.checkPackVer(l) != 0) return;
				var i;
				for (i in l.commands) {
					if (l.mode == "remove") {
						if (l.commands[i]) {
							filterCmd(cur.commands[i], l.commands[i]);
						} else {
							delete cur.commands[i];
						}
					} else if ((i in cur.commands) && l.mode != "overwrite") {
						joinCmd(cur.commands[i], l.commands[i]);
					} else {
						cur.commands[i] = l.commands[i];
					}
				}
				for (i in l.enums) {
					if (l.mode == "remove") {
						if (l.enums[i]) {
							filterEnum(cur.enums[i], parseAliasEnum(cur, l.enums[i]));
						} else {
							delete cur.enums[i];
						}
					} else if ((i in cur.enums) && l.mode != "overwrite") {
						joinEnum(cur.enums[i], parseAliasEnum(cur, l.enums[i]));
					} else {
						cur.enums[i] = parseAliasEnum(cur, l.enums[i]);
					}
				}
				if (l.mode == "overwrite") {
					cur.selectors = l.selectors;
				} else {
					for (i in l.selectors) {
						if (l.mode == "remove") {
							delete cur.selectors[i];
						} else {
							cur.selectors[i] = l.selectors[i];
						}
					}
				}
				if (l.mode == "overwrite") {
					cur.help = l.help;
				} else {
					for (i in l.help) {
						if (l.mode == "remove") {
							delete cur.help[i];
						} else {
							cur.help[i] = l.help[i];
						}
					}
				}
			}
		})(),
		statLib : (function() {
			var stat, gbl;
			function calcCmd(c) {
				var i;
				stat.command++;
				if (c.noparams) stat.pattern++;
				for (i in c.patterns) {
					stat.pattern++;
				}
			}
			function calcSelectors(c) {
				stat.selector += Object.keys(c).length;
			}
			function calcEnum(c) {
				return typeof c == "string" ? calcEnum(gbl.enums[c]) : Array.isArray(c) ? c.length : Object.keys(c).length;
			}
			function calcEnums(c) {
				var i;
				for (i in c) {
					stat.enums++;
					stat.enumitem += calcEnum(c);
				}
			}
			function calcCommands(k) {
				var i;
				for (i in k) {
					calcCmd(k[i]);
				}
			}
			function toString() {
				return ["命令数:", this.command, "\n枚举数:", this.enums, "\n选择器数:", this.selector, "\n版本包数:", this.versionPack, "\n命令模式数:", this.pattern, "\n枚举项目数:", this.enumitem].join("");
			}
			return function (l, g) {
				var i;
				stat = {
					command : 0,
					versionPack : 0,
					enums : 0,
					selector : 0,
					pattern : 0,
					enumitem : 0,
					toString : toString
				}
				gbl = g;
				calcCommands(l.commands);
				calcEnums(l.enums);
				calcSelectors(l.selectors);
				for (i in l.versionPack) {
					if ("commands" in l.versionPack[i]) calcCommands(l.versionPack[i].commands);
					if ("enums" in l.versionPack[i]) calcEnums(l.versionPack[i].enums);
					if ("selectors" in l.versionPack[i]) calcSelectors(l.versionPack[i].selectors);
					stat.versionPack++;
				}
				return stat;
			}
		})()
	},
	Assist : {
		active : false,
		show : function self() {G.ui(function() {try {
			if (!self.head) {
				self.init = function() {
					CA.Assist.command = null;
					CA.Assist.pattern = null;
					self.refresh();
					self.choosePattern(true);
				}
				self.refresh = function() {
					var pp, arr, help;
					if (CA.Assist.command) {
						pp = new G.SpannableStringBuilder(CA.Assist.formatPattern(CA.Assist.command, CA.Assist.pattern));
						pp.append("\n");
						appendSSB(pp, CA.Assist.getPatternDescription(CA.Assist.command, CA.Assist.pattern), new G.ForegroundColorSpan(Common.theme.promptcolor));
						arr = (CA.Assist.pattern ? CA.IntelliSense.library.commands[CA.Assist.command].patterns[CA.Assist.pattern].params : []) || [];
						arr = arr.map(function(e, i) {
							return {
								param : e
							};
						});
					} else {
						pp = "选择命令……";
						arr = [];
					}
					self.head.setText(pp);
					self.list.setAdapter(new RhinoListAdapter((CA.Assist.params = arr).filter(function(e) {
						if (e.param.type == "plain") {
							e.text = e.param.name;
							return false;
						} else {
							return true;
						}
					}), CA.Assist.paramAdapter, self));
					try {
						help = CA.Assist.command ? CA.IntelliSense.library.commands[CA.Assist.command].help : CA.IntelliSense.library.help.command;
						new java.net.URL(help);
						CA.showAssist.postHelp(0, help);
					} catch(e) {
						CA.showAssist.postHelp(1, help || "暂时没有帮助，以后会加上的啦");
					}
					CA.Assist.refreshCommand();
				}
				self.choosePattern = function(optional) {
					CA.Assist.chooseCommand(function(cmd) {
						CA.Assist.choosePatterns(cmd, function(pattern) {
							CA.Assist.command = cmd;
							CA.Assist.pattern = pattern;
							self.refresh();
						}, optional);
					}, optional);
				}
				self.head = new G.TextView(ctx);
				self.head.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				self.head.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
				self.head.setTextColor(Common.theme.textcolor);
				self.head.setTextSize(Common.theme.textsize[2]);
				self.head.setTypeface(G.Typeface.MONOSPACE);
				self.head.setLineSpacing(10, 1);
				self.list = new G.ListView(ctx);
				self.list.setBackgroundColor(G.Color.TRANSPARENT);
				self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
					var e;
					if (pos == 0) {
						self.choosePattern();
						return;
					}
					CA.Assist.editParam(e = parent.getItemAtPosition(pos), function(t) {
						G.ui(function() {try {
							e._text.setText(e.text = String(t));
							CA.Assist.refreshCommand();
						} catch(e) {erp(e)}});
					});
				} catch(e) {erp(e)}}}));
				self.list.addHeaderView(self.head);
				self.list.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1));
				CA.showAssist.initContent(self.list);
			}
			self.init();
			if (CA.Assist.ui) return;
			CA.showAssist.con.addView(CA.Assist.ui = self.list);
		} catch(e) {erp(e)}})},
		hide : function() {G.ui(function() {try {
			if (!CA.Assist.ui) return;
			CA.showAssist.con.removeView(CA.Assist.ui);
			CA.Assist.ui = null;
		} catch(e) {erp(e)}})},
		paramAdapter : function(e, i, a) {
			var hl, vl, name, desp, p;
			p = e.param;
			hl = new G.LinearLayout(ctx);
			hl.setOrientation(G.LinearLayout.HORIZONTAL);
			hl.setLayoutParams(G.AbsListView.LayoutParams(-1, -2));
			hl.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
			vl = new G.LinearLayout(ctx);
			vl.setOrientation(G.LinearLayout.VERTICAL);
			vl.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 1.0));
			vl.getLayoutParams().gravity = G.Gravity.CENTER;
			name = new G.TextView(ctx);
			name.setText(String(p.name) + (p.optional || p.canIgnore || p.chainOptional ? " (可选)" : ""));
			name.setTextColor(Common.theme.textcolor);
			name.setTextSize(Common.theme.textsize[3]);
			name.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
			vl.addView(name);
			desp = new G.TextView(ctx);
			desp.setText(p.description ? String(p.description) : CA.Assist.getParamType(p));
			desp.setTextColor(Common.theme.promptcolor);
			desp.setTextSize(Common.theme.textsize[1]);
			desp.setSingleLine(true);
			desp.setEllipsize(G.TextUtils.TruncateAt.END);
			desp.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
			vl.addView(desp);
			hl.addView(vl);
			e._text = new G.TextView(ctx);
			e._text.setText("点击以编辑");
			e._text.setTextColor(Common.theme.promptcolor);
			e._text.setTextSize(Common.theme.textsize[2]);
			e._text.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			e._text.setMaxEms(10);
			e._text.setSingleLine(true);
			e._text.setEllipsize(G.TextUtils.TruncateAt.END);
			e._text.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 0));
			e._text.getLayoutParams().gravity = G.Gravity.CENTER;
			hl.addView(e._text);
			return hl;
		},
		refreshCommand : function() {
			if (CA.Assist.command) {
				var r = ["/" + CA.Assist.command], i, p = CA.Assist.params;
				for (i = 0; i < p.length; i++) {
					if (!p[i].text) break;
					r.push(p[i].text);
				}
				CA.cmd.setText(r.join(" "));
			} else {
				CA.cmd.setText("/");
			}
		},
		editParam : function(e, callback) {
			switch (e.param.type) {
				case "plain":
				callback(e.param.name);
				break;
				case "enum":
				this.editParamEnum(e, callback);
				break;
				case "nbt":
				case "rawjson":
				case "json":
				this.editParamJSON(e, callback);
				break;
				case "position":
				this.editParamPosition(e, callback);
				break;
				case "selector":
				this.editParamSelector(e, callback);
				break;
				case "int":
				case "uint":
				case "float":
				case "relative":
				case "custom":
				case "command":
				case "text":
				default:
				this.editParamDialog(e, callback);
			}
		},
		editParamDialog : function self(e, callback) {G.ui(function() {try {
			var layout, title, p, ret, exit, popup, t, getText, setText, suggestion = {}, i;
			if (!self.initTextBox) {
				self.initTextBox = function(e, defVal) {
					var ret = new G.EditText(ctx);
					ret.setText(defVal ? String(defVal) : e.text ? e.text : "");
					ret.setSingleLine(true);
					ret.setTextSize(Common.theme.textsize[2]);
					ret.setTextColor(Common.theme.textcolor);
					ret.setPadding(0, 10 * G.dp, 0, 10 * G.dp);
					ret.setBackgroundColor(G.Color.TRANSPARENT);
					ret.setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
					ret.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
					ret.setSelection(ret.length());
					return ret;
				}
				self.initSetText = function(ret) {
					return function(e) {
						ret.setText(String(e));
					}
				}
			}
			layout = new G.LinearLayout(ctx);
			layout.setBackgroundColor(Common.theme.message_bgcolor);
			layout.setOrientation(G.LinearLayout.VERTICAL);
			layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
			title = new G.TextView(ctx);
			title.setTextSize(Common.theme.textsize[4]);
			title.setTextColor(Common.theme.textcolor);
			title.setText("编辑“" + e.param.name + "”");
			title.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			title.setPadding(0, 0, 0, 10 * G.dp);
			layout.addView(title);
			switch (p = e.param.type) {
				case "int":
				layout.addView(ret = self.initTextBox(e));
				ret.setInputType(G.InputType.TYPE_CLASS_NUMBER | G.InputType.TYPE_NUMBER_FLAG_SIGNED);
				getText = function() {
					return isFinite(t = ret.getText()) && t.length() ? parseInt(t) : (Common.toast("内容不是数字！"), null);
				}
				setText = self.initSetText(ret);
				Common.postIME(ret);
				break;
				case "uint":
				layout.addView(ret = self.initTextBox(e));
				ret.setInputType(G.InputType.TYPE_CLASS_NUMBER);
				getText = function() {
					return isFinite(t = ret.getText()) && t.length() ? Math.abs(parseInt(t)) : (Common.toast("内容不是数字！"), null);
				}
				setText = self.initSetText(ret);
				Common.postIME(ret);
				break;
				case "float":
				layout.addView(ret = self.initTextBox(e));
				ret.setInputType(G.InputType.TYPE_CLASS_NUMBER | G.InputType.TYPE_NUMBER_FLAG_SIGNED | G.InputType.TYPE_NUMBER_FLAG_DECIMAL);
				getText = function() {
					return isFinite(t = ret.getText()) && t.length() ? parseFloat(t) : (Common.toast("内容不是数字！"), null);
				}
				setText = self.initSetText(ret);
				Common.postIME(ret);
				break;
				case "relative":
				layout.addView(ret = self.initTextBox(e, isNaN(e.offset) ? "" : e.offset));
				ret.setInputType(G.InputType.TYPE_CLASS_NUMBER | G.InputType.TYPE_NUMBER_FLAG_SIGNED | G.InputType.TYPE_NUMBER_FLAG_DECIMAL);
				var rela = new G.CheckBox(ctx);
				rela.setChecked(Boolean(e.isRela));
				rela.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 0));
				rela.getLayoutParams().setMargins(0, 0, 0, 10 * G.dp)
				rela.setText("启用相对参数");
				layout.addView(rela);
				getText = function() {
					e.isRela = rela.isChecked();
					e.offset = ret.getText();
					return e.offset.length() && isFinite(e.offset) ? (e.isRela ? "~" : "") + parseFloat(e.offset) : (Common.toast("内容不是数字！"), null);
				}
				setText = function(e) {
					var s = String(e), f = s.startsWith("~");
					rela.setChecked(f);
					ret.setText(f ? s.slice(1) : s);
				}
				Common.postIME(ret);
				break;
				case "custom":
				layout.addView(ret = self.initTextBox(e));
				ret.setInputType(G.InputType.TYPE_CLASS_TEXT);
				getText = function() {
					return ret.length() == 0 ? (Common.toast("内容不能为空！"), null) : (new RegExp(e.param.finish, "")).test(ret.getText()) ? ret.getText() : (Common.toast("内容不合规范！"), null);
				}
				setText = self.initSetText(ret);
				Common.postIME(ret);
				break;
				case "command":
				CA.his.forEach(function(e) {
					suggestion[e] = e;
				});
				case "text":
				default:
				layout.addView(ret = self.initTextBox(e));
				ret.setInputType(G.InputType.TYPE_CLASS_TEXT);
				getText = function() {
					return ret.length() > 0 ? ret.getText() : (Common.toast("内容不能为空！"), null);
				}
				setText = self.initSetText(ret);
				Common.postIME(ret);
			}
			if (e.param.suggestion) {
				t = e.param.suggestion instanceof Object ? e.param.suggestion : CA.IntelliSense.library.enums[e.param.suggestion];
				if (Array.isArray(t)) {
					for (i in t) {
						suggestion[t[i]] = t[i];
					}
				} else {
					for (i in t) {
						if (t[i]) {
							suggestion[i + " - " + t[i]] = i;
						} else {
							suggestion[i] = i;
						}
					}
				}
			}
			if (setText) {
				var sugg = new G.ListView(ctx);
				sugg.setBackgroundColor(G.Color.TRANSPARENT);
				sugg.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1));
				sugg.setAdapter(new RhinoListAdapter(Object.keys(suggestion), CA.Assist.smallVMaker));
				sugg.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
					setText(suggestion[parent.getItemAtPosition(pos)]);
				} catch(e) {erp(e)}}}));
				layout.addView(sugg);
			}
			exit = new G.TextView(ctx);
			exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			exit.setText("确定");
			exit.setTextSize(Common.theme.textsize[3]);
			exit.setGravity(G.Gravity.CENTER);
			exit.setTextColor(Common.theme.criticalcolor);
			exit.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 15 * G.dp);
			exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var t = getText();
				if (t == null) return;
				callback(String(t));
				popup.dismiss();
			} catch(e) {erp(e)}}}));
			layout.addView(exit);
			popup = Common.showDialog(layout, -1, -2);
		} catch(e) {erp(e)}})},
		editParamEnum : function(e, callback) {
			var t = e.param.list instanceof Object ? e.param.list : CA.IntelliSense.library.enums[e.param.list];
			var arr = [], i;
			if (Array.isArray(t)) {
				for (i in t) {
					arr.push(t[i]);
				}
			} else {
				for (i in t) {
					if (t[i]) {
						arr.push({
							text : i,
							description : t[i]
						});
					} else {
						arr.push(i);
					}
				}
			}
			Common.showListChooser(arr, function(pos) {
				var t = arr[pos];
				if (t instanceof Object) {
					callback(t.text);
				} else {
					callback(t);
				}
			});
		},
		editParamJSON : function self(e, callback) {
			if (!self.refresh) {
				self.refresh = function(e, data, callback) {
					e.jsondata = data;
					callback(MapScript.toSource(data));
				}
				self.modify = function(e, callback) {
					JSONEdit.show({
						source : e.jsondata,
						rootname : e.param.name,
						update : function() {
							self.refresh(e, this.source, callback);
						}
					});
				}
				self.buildnew = function(e, callback) {
					JSONEdit.create(function(data) {
						self.refresh(e, data, callback);
					}, e.param.name);
				}
				self.editmenu = [{
					text : "编辑",
					description : "修改原有的JSON",
					onclick : function(v, tag) {
						self.modify(tag.e, tag.callback);
					}
				},{
					text : "重建",
					description : "新建JSON并替换掉原有的",
					onclick : function(v, tag) {
						self.buildnew(tag.e, tag.callback);
					}
				},{
					text : "取消",
					onclick : function(v) {}
				}]
			}
			if ("jsondata" in e) {
				Common.showOperateDialog(self.editmenu, {
					e : e,
					callback : callback
				});
			} else {
				self.buildnew(e, callback);
			}
		},
		editParamPosition : function self(e, callback) {G.ui(function() {try {
			var layout, title, i, row, label, ret = [], rela = [], screla, posp = ["X", "Y", "Z"], exit, popup;
			layout = new G.TableLayout(ctx);
			layout.setBackgroundColor(Common.theme.message_bgcolor);
			layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
			title = new G.TextView(ctx);
			title.setTextSize(Common.theme.textsize[4]);
			title.setTextColor(Common.theme.textcolor);
			title.setText("编辑“" + e.param.name + "”");
			title.setLayoutParams(new G.TableLayout.LayoutParams(-1, -2));
			title.setPadding(0, 0, 0, 10 * G.dp);
			layout.addView(title);
			if (!e.pos) {
				e.pos = [];
				e.rela = [];
			}
			for (i = 0; i < 3; i++) {
				row = new G.TableRow(ctx);
				row.setLayoutParams(new G.TableLayout.LayoutParams(-1, -2));
				row.setGravity(G.Gravity.CENTER);
				label = new G.TextView(ctx);
				label.setTextSize(Common.theme.textsize[2]);
				label.setTextColor(Common.theme.textcolor);
				label.setText(posp[i]);
				label.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
				label.setLayoutParams(new G.TableRow.LayoutParams(-1, -2));
				row.addView(label);
				ret[i] = new G.EditText(ctx);
				ret[i].setText(isNaN(e.pos[i]) ? "" : String(e.pos[i]));
				ret[i].setSingleLine(true);
				ret[i].setTextSize(Common.theme.textsize[2]);
				ret[i].setTextColor(Common.theme.textcolor);
				ret[i].setBackgroundColor(G.Color.TRANSPARENT);
				ret[i].setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
				ret[i].setInputType(G.InputType.TYPE_CLASS_NUMBER | G.InputType.TYPE_NUMBER_FLAG_SIGNED | G.InputType.TYPE_NUMBER_FLAG_DECIMAL);
				ret[i].setLayoutParams(new G.TableRow.LayoutParams(0, -2, 1));
				ret[i].setSelection(ret[i].length());
				row.addView(ret[i]);
				rela[i] = new G.CheckBox(ctx);
				rela[i].setChecked(Boolean(e.rela[i]));
				rela[i].setLayoutParams(G.TableRow.LayoutParams(-2, -2));
				rela[i].getLayoutParams().setMargins(0, 0, 10 * G.dp, 0)
				rela[i].setText("~");
				row.addView(rela[i]);
				layout.addView(row);
			}
			screla = new G.CheckBox(ctx);
			screla.setChecked(false);
			screla.setLayoutParams(G.TableLayout.LayoutParams(-1, -2));
			screla.getLayoutParams().setMargins(0, 0, 0, 10 * G.dp)
			screla.setText("相对于视角");
			screla.setOnCheckedChangeListener(new G.CompoundButton.OnCheckedChangeListener({onCheckedChanged : function(v, s) {try {
				for (i = 0; i < 3; i++) rela[i].setVisibility(s ? G.View.GONE : G.View.VISIBLE);
			} catch(e) {erp(e)}}}));
			screla.setChecked(Boolean(e.screla));
			layout.addView(screla);
			exit = new G.TextView(ctx);
			exit.setLayoutParams(new G.TableLayout.LayoutParams(-1, -2));
			exit.setText("确定");
			exit.setTextSize(Common.theme.textsize[3]);
			exit.setGravity(G.Gravity.CENTER);
			exit.setTextColor(Common.theme.criticalcolor);
			exit.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 15 * G.dp);
			exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var r = [];
				e.screla = screla.isChecked();
				for (i = 0; i < 3; i++) {
					e.pos[i] = parseFloat(ret[i].getText());
					e.rela[i] = rela[i].isChecked();
					if (!e.screla && !e.rela[i] && !isFinite(e.pos[i])) return Common.toast(posp[i] + "坐标不是数字！");
					r.push((e.screla ? "^" : e.rela[i] ?  "~" : "") + (isFinite(e.pos[i]) ? e.pos[i] : ""));
				}
				callback(r.join(" "));
				popup.dismiss();
			} catch(e) {erp(e)}}}));
			layout.addView(exit);
			popup = Common.showDialog(layout, -1, -2);
		} catch(e) {erp(e)}})},
		editParamSelector : function self(e, callback) {G.ui(function() {try {
			var layout, title, i, label, list, add, exit, popup;
			if (!self.selectors) {
				self.selectors = {
					"@a" : "选择所有玩家",
					"@p" : "选择距离最近的玩家",
					"@r" : "选择随机玩家",
					"@e" : "选择所有实体",
					"@s" : "选择命令执行者"
				}
				self.editLabel = function(e, callback) {
					var a = [], t = e.param.target;
					if (t == "entity" || t == "player") a.push("@a", "@p", "@r");
					if (t == "entity" || t == "nonplayer") a.push("@e");
					if (t != "nonselector") a.push("@s");
					a = a.map(function(e) {
						return {
							text : e,
							description : self.selectors[e]
						};
					});
					a.push({
						text : "玩家名",
						description : "选择具有指定名称的玩家",
						custom : true
					});
					Common.showListChooser(a, function(pos) {
						if (a[pos].custom) {
							Common.showInputDialog({
								title : "选择玩家名",
								callback : function(s) {
									if (s.startsWith("@")) {
										Common.toast("玩家名不合法");
										callback("");
									} else {
										callback(s);
									}
								},
								singleLine : true
							});
						} else {
							callback(a[pos].text);
						}
					});
				}
				self.checkPar = function(label, list) {
					list.setVisibility(label.getText() in self.selectors ? G.View.VISIBLE : G.View.GONE);
				}
				self.refresh = function(e, list) {
					list.setAdapter(new RhinoListAdapter(e.selpar, self.adapter, {
						delete : function(i) {
							e.selpar.splice(i, 1);
							self.refresh(e, list);
						}
					}));
				}
				self.addParam = function(e, list) {
					var a = [], ss = CA.IntelliSense.library.selectors;
					Object.keys(ss).forEach(function(e) {
						a.push({
							text : ss[e].name,
							description : e,
							name : e,
							par : ss[e],
							inverted : false
						});
						if (ss[e].hasInverted) {
							a.push({
								text : "(不满足)" + ss[e].name,
								description : "非" + e,
								name : e,
								par : ss[e],
								inverted : true
							});
						}
					});
					Common.showListChooser(a, function(pos) {
						var p = {
							name : a[pos].name,
							param : a[pos].par,
							isInverted : a[pos].inverted,
						};
						CA.Assist.editParam(p, function(text) {
							p.text = text;
							e.selpar.push(p);
							self.refresh(e, list);
						});
					});
				}
				self.editParam = function(e, i, list) {
					CA.Assist.editParam(e.selpar[i], function(text) {
						e.selpar[i].text = text;
						self.refresh(e, list);
					});
				}
				self.adapter = function(e, i, a, tag) {
					var view = new G.LinearLayout(ctx),
						text = new G.TextView(ctx),
						del = new G.TextView(ctx);
					view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					view.setOrientation(G.LinearLayout.HORIZONTAL);
					view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					text.setLayoutParams(new G.LinearLayout.LayoutParams(0, -2, 1));
					text.setText((e.isInverted ? "(不满足)" : "") + e.param.name + "：" + e.text);
					text.setTextSize(Common.theme.textsize[2]);
					text.setSingleLine(true);
					text.setTextColor(Common.theme.textcolor);
					text.setEllipsize(G.TextUtils.TruncateAt.END);
					text.setPadding(10 * G.dp, 10 * G.dp, 0, 10 * G.dp);
					view.addView(text);
					del.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
					del.setText("×");
					del.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
					del.setTextSize(Common.theme.textsize[2]);
					del.setTextColor(Common.theme.textcolor);
					del.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
						tag.delete(i);
					} catch(e) {erp(e)}}}));
					view.addView(del);
					return view;
				}
			}
			layout = new G.LinearLayout(ctx);
			layout.setBackgroundColor(Common.theme.message_bgcolor);
			layout.setOrientation(G.LinearLayout.VERTICAL);
			layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
			title = new G.TextView(ctx);
			title.setTextSize(Common.theme.textsize[4]);
			title.setTextColor(Common.theme.textcolor);
			title.setText("编辑“" + e.param.name + "”");
			title.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			title.setPadding(0, 0, 0, 10 * G.dp);
			layout.addView(title);
			if (!e.selpar) e.selpar = [];
			label = new G.EditText(ctx);
			label.setHint("点击以选择");
			label.setSingleLine(true);
			label.setTextSize(Common.theme.textsize[2]);
			label.setTextColor(Common.theme.textcolor);
			label.setHintTextColor(Common.theme.promptcolor);
			label.setPadding(0, 0, 0, 10 * G.dp);
			label.setInputType(G.InputType.TYPE_NULL);
			label.setBackgroundColor(G.Color.TRANSPARENT);
			label.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			label.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.editLabel(e, function(text) {G.ui(function() {try {
					v.setText(text);
					self.checkPar(v, list);
				} catch(e) {erp(e)}})});
			} catch(e) {erp(e)}}}));
			if (e.label) {
				label.setText(e.label);
			} else {
				label.post(function() {try {
					label.performClick();
				} catch(e) {erp(e)}});
			}
			layout.addView(label);
			add = new G.TextView(ctx);
			add.setText("+ 添加选择器参数");
			add.setSingleLine(true);
			add.setTextColor(Common.theme.textcolor);
			add.setTextSize(Common.theme.textsize[2]);
			add.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			add.setLayoutParams(G.AbsListView.LayoutParams(-1, -2));
			list = new G.ListView(ctx);
			list.setBackgroundColor(Common.theme.message_bgcolor);
			list.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1));
			list.addFooterView(add);
			list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				if (view == add) {
					self.addParam(e, parent);
				} else {
					self.editParam(e, pos, parent);
				}
			} catch(e) {erp(e)}}}));
			layout.addView(list);
			exit = new G.TextView(ctx);
			exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			exit.setText("确定");
			exit.setTextSize(Common.theme.textsize[3]);
			exit.setGravity(G.Gravity.CENTER);
			exit.setTextColor(Common.theme.criticalcolor);
			exit.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 15 * G.dp);
			exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (!(e.label = String(label.getText()))) return Common.toast("选择器不可为空！")
				callback(e.label + (e.label in self.selectors && e.selpar.length ? "[" + e.selpar.map(function(e) {
					return e.name + "=" + (e.isInverted ? "!" : "") + e.text;
				}).join(",") + "]" : ""));
				popup.dismiss();
			} catch(e) {erp(e)}}}));
			layout.addView(exit);
			self.checkPar(label, list);
			self.refresh(e, list);
			popup = Common.showDialog(layout, -1, -2);
		} catch(e) {erp(e)}})},
		smallVMaker : function(s) {
			var view = new G.TextView(ctx);
			view.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			view.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
			view.setText(s);
			view.setTextSize(Common.theme.textsize[2]);
			view.setTextColor(Common.theme.textcolor);
			return view;
		},
		getParamType : function(cp) {
			switch (cp.type) {
				case "int":
				return "整数";
				
				case "uint":
				return "自然数";
				
				case "float":
				case "relative":
				return "数值";
				
				case "nbt":
				return "数据标签";
				
				case "rawjson":
				return "文本JSON";
				
				case "json":
				return "JSON";
				
				case "selector":
				return "实体";
				
				case "enum":
				return "列表";
				
				case "plain":
				return "常量";
				
				case "custom":
				if (cp.vtype) return cp.vtype;
				return "自定义类型";
				
				case "position":
				return "坐标";
				
				case "command":
				return "命令";
				
				case "text":
				default:
				return "文本";
			}
		},
		formatPattern : function(cmd, pattern) {
			var c = CA.IntelliSense.library.commands[cmd], r = ["/" + cmd];
			if (pattern) {
				c.patterns[pattern].params.forEach(function(e) {
					r.push(CA.IntelliSense.getParamTag(e, null, 0, null));
				});
			}
			return r.join(" ");
		},
		getPatternDescription : function(cmd, pattern) {
			var c = CA.IntelliSense.library.commands[cmd];
			return (pattern ? c.patterns[pattern].description : c.noparams.description) || c.description;
		},
		chooseCommand : function(callback, optional) {
			var lib = CA.IntelliSense.library, cmds;
			(cmds = Object.keys(lib.commands).filter(function(e) {
				return !lib.commands[e].alias;
			})).sort();
			if (!cmds.length) {
				Common.toast("没有可选的命令");
				return;
			}
			Common.showListChooser(cmds.map(function(e) {
				return {
					text : e,
					description : lib.commands[e].description
				};
			}), function(id) {
				callback(cmds[id]);
			}, optional);
		},
		choosePatterns : function(cmd, callback, optional) {
			var c = CA.IntelliSense.library.commands[cmd], ps;
			if (!c.patterns && !c.noparams) return void Common.toast("该命令不存在命令模式");
			ps = c.patterns ? Object.keys(c.patterns) : [];
			if (c.noparams) ps.unshift(null);
			if (!ps.length) {
				Common.toast("没有可选的命令模式");
				return;
			}
			Common.showListChooser(ps.map(function(e) {
				return {
					text : CA.Assist.formatPattern(cmd, e),
					description : CA.Assist.getPatternDescription(cmd, e)
				};
			}), function(id) {
				callback(ps[id]);
			}, optional);
		},
	}
});

MapScript.loadModule("PWM", {
	windows : [],
	floats : [],
	listeners : [],
	wm : ctx.getSystemService(ctx.WINDOW_SERVICE),
	add : function(w) {
		var v, wp;
		if (this.windows.indexOf(w) >= 0) return;
		this.windows.push(w);
		this.floats.forEach(function(e) {
			if (!e.isShowing()) return;
			v = e.getContentView();
			if (!v) return;
			v = v.getRootView();
			wp = v.getLayoutParams();
			PWM.wm.removeViewImmediate(v);
			PWM.wm.addView(v, wp);
		});
		this._notifyListeners("add", w);
	},
	hideAll : function() {
		var v;
		this.windows.forEach(function(e) {
			if (!e.isShowing()) return;
			v = e.getContentView();
			if (!v) return;
			v.getRootView().setVisibility(G.View.GONE);
		});
		this._notifyListeners("hideAll");
	},
	showAll : function() {
		var v;
		this.windows.forEach(function(e) {
			if (!e.isShowing()) return;
			v = e.getContentView();
			if (!v) return;
			v.getRootView().setVisibility(G.View.VISIBLE);
		});
		this._notifyListeners("showAll");
	},
	getCount : function() {
		var s = 0;
		this.windows.forEach(function(e) {
			if (e.isShowing()) s++;
		});
		return s;
	},
	addFloat : function(w) {
		if (this.floats.indexOf(w) >= 0) return;
		this.floats.push(w);
		this._notifyListeners("addFloat", w);
	},
	reset : function() {
		this.windows.length = this.floats.length = this.listeners.length = 0;
	},
	observe : function(f) {
		this.unobserve(f);
		this.listeners.push(f);
	},
	unobserve : function(f) {
		var t = this.listeners.indexOf(f);
		if (t >= 0) this.listeners.splice(t, 1);
	},
	_notifyListeners : function() {
		var args = arguments;
		this.listeners.forEach(function(e) {
			e.apply(null, args);
		});
	}
});

MapScript.loadModule("Common", {
	themelist : {
		"light" : {
			"name" : "默认风格"
		}
	},
	theme : null,
	
	loadTheme : function(id) {
		var light = {
			"bgcolor" : "#FAFAFA",
			"float_bgcolor" : "#F5F5F5",
			"message_bgcolor" : "#FAFAFA",
			"textcolor" : "#212121",
			"promptcolor" : "#9E9E9E",
			"highlightcolor" : "#0000FF",
			"criticalcolor" : "#FF0000",
			"go_bgcolor" : "#EEEEEE",
			"go_textcolor" : "#000000",
			"go_touchbgcolor" : "#616161",
			"go_touchtextcolor" : "#FAFAFA"
		};
		var convert = function(v, d) {
			var n = Number("0x" + String(v).slice(1));
			if (isNaN(n)) n = Number("0x" + d.slice(1));
			return G.Color.argb(0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
		}
		var r = {id : (id in this.themelist ? String(id) : "light")}, k, i;
		k = r.id in this.themelist ? this.themelist[r.id] : light;
		for (i in light) {
			r[i] = convert(k[i], light[i]);
		}
		r.name = k === light ? "默认主题" : String(k.name);
		if (this.alpha) { //Java里可以直接写r.bgcolor = r.bgcolor & 0xffffff | 0xc0000000;
			r.bgcolor = G.Color.argb(0xc0, G.Color.red(r.bgcolor), G.Color.green(r.bgcolor), G.Color.blue(r.bgcolor));
			r.float_bgcolor = G.Color.argb(0xe0, G.Color.red(r.float_bgcolor), G.Color.green(r.float_bgcolor), G.Color.blue(r.float_bgcolor));
			r.message_bgcolor = G.Color.argb(0xe0, G.Color.red(r.message_bgcolor), G.Color.green(r.message_bgcolor), G.Color.blue(r.message_bgcolor));
		}
		r.textsize = [10, 12, 14, 16, 18];
		this.theme = r;
	},
	
	showChangeTheme : function self(refresh, dismiss) {G.ui(function() {try {
		if (!self.linear) {
			self.adapter = function(e, i, a) {
				var view = new G.TextView(ctx);
				Common.loadTheme(e);
				view.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
				view.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
				view.setBackgroundColor(Common.theme.bgcolor);
				view.setText(Common.theme.name + (self.current == e ? " (当前)" : ""));
				view.setTextSize(Common.theme.textsize[3]);
				view.setTextColor(Common.theme.textcolor);
				Common.loadTheme(self.current);
				view.setGravity(G.Gravity.CENTER);
				return view;
			}
			self.refresh = function() {
				self.current = Common.theme.id;
				self.list.setAdapter(new RhinoListAdapter(Object.keys(Common.themelist), self.adapter));
				self.linear.setBackgroundColor(Common.theme.message_bgcolor);
				self.title.setTextSize(Common.theme.textsize[4]);
				self.title.setTextColor(Common.theme.textcolor);
				self.alpha.setTextSize(Common.theme.textsize[2]);
				self.alpha.setTextColor(Common.theme.textcolor);
				self.exit.setTextSize(Common.theme.textsize[3]);
				self.exit.setTextColor(Common.theme.criticalcolor);
			}
			self.linear = new G.LinearLayout(ctx);
			self.linear.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -1));
			self.linear.setOrientation(G.LinearLayout.VERTICAL);
			self.linear.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
			
			self.title = new G.TextView(ctx);
			self.title.setText("主题选择");
			self.title.setGravity(G.Gravity.CENTER);
			self.title.setPadding(0, 0, 0, 10 * G.dp);
			self.linear.addView(self.title, new G.LinearLayout.LayoutParams(-1, -2));
			
			self.list = new G.ListView(ctx);
			self.list.setBackgroundColor(G.Color.TRANSPARENT);
			self.list.setDividerHeight(0);
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				Common.loadTheme(parent.getAdapter().getItem(pos));
				self.refresh();
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.list, new G.LinearLayout.LayoutParams(-1, 0, 1.0));
			
			self.alpha = new G.CheckBox(ctx);
			self.alpha.setText("启用半透明风格");
			self.alpha.setChecked(Boolean(Common.alpha));
			self.alpha.setOnCheckedChangeListener(new G.CompoundButton.OnCheckedChangeListener({onCheckedChanged : function(v, s) {try {
				Common.alpha = Boolean(s);
				Common.loadTheme(self.current);
				self.refresh();
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.alpha, new G.LinearLayout.LayoutParams(-1, -2));
			
			self.exit = new G.TextView(ctx);
			self.exit.setText("确定");
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (Common.theme.id != self.last || self.alpha.isChecked() != self.lastchecked) {
					if (refresh) refresh();
					self.last = Common.theme.id;
					self.lastchecked = self.alpha.isChecked();
				}
				self.popup.dismiss();
				return true;
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.exit, new G.LinearLayout.LayoutParams(-1, -2));
		}
		if (self.popup) self.popup.dismiss();
		self.popup = new G.PopupWindow(self.linear, -1, -1);
		if (CA.supportFloat) self.popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		self.popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		self.popup.setFocusable(true);
		self.popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			Common.loadTheme(self.last);
			if (dismiss) dismiss();
			self.popup = null;
		} catch(e) {erp(e)}}}));
		self.last = Common.theme.id;
		self.lastchecked = self.alpha.isChecked();
		self.refresh();
		self.popup.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(self.popup);
	} catch(e) {erp(e)}})},
	
	customVMaker : function(s) {
		var view = new G.TextView(ctx);
		view.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
		view.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -2));
		view.setText(s);
		view.setTextSize(Common.theme.textsize[3]);
		view.setTextColor(Common.theme.textcolor);
		return view;
	},
	
	showDialog : function(layout, width, height, onDismiss) {
		var frame, popup, trans;
		frame = new G.FrameLayout(ctx);
		frame.setBackgroundColor(G.Color.argb(0x80, 0, 0, 0));
		frame.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
			if (e.getAction() == e.ACTION_DOWN) {
				popup.dismiss();
			}
			return true;
		} catch(e) {erp(e)}}}));
		layout.setLayoutParams(new G.FrameLayout.LayoutParams(width, height, G.Gravity.CENTER));
		layout.getLayoutParams().setMargins(20 * G.dp, 20 * G.dp, 20 * G.dp, 20 * G.dp);
		layout.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
			return true;
		} catch(e) {erp(e)}}}));
		frame.addView(layout);
		if (G.style == "Material") layout.setElevation(16 * G.dp);
		popup = new G.PopupWindow(frame, -1, -1);
		if (CA.supportFloat) popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		popup.setFocusable(true);
		popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		if (onDismiss) popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			onDismiss();
		} catch(e) {erp(e)}}}));
		popup.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(popup);
		return popup;
	},
	
	showTextDialog : function(s) {G.ui(function() {try {
		var layout, scr, text, exit, popup;
		layout = new G.LinearLayout(ctx);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 0);
		layout.setBackgroundColor(Common.theme.message_bgcolor);
		scr = new G.ScrollView(ctx);
		scr.setLayoutParams(new G.LinearLayout.LayoutParams(-2, 0, 1));
		text = new G.TextView(ctx);
		text.setLayoutParams(new G.FrameLayout.LayoutParams(-2, -2));
		text.setText(s);
		text.setTextSize(Common.theme.textsize[2]);
		text.setTextColor(Common.theme.textcolor);
		text.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 0);
		text.setMovementMethod(G.LinkMovementMethod.getInstance());
		scr.addView(text);
		layout.addView(scr);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("关闭");
		exit.setTextSize(Common.theme.textsize[3]);
		exit.setGravity(G.Gravity.CENTER);
		exit.setTextColor(Common.theme.criticalcolor);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			popup.dismiss();
			return true;
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		popup = Common.showDialog(layout, -2, -2);
	} catch(e) {erp(e)}})},
	
	showOperateDialog : function self(s, tag) {G.ui(function() {try {
		var frame, list, popup;
		if (!self.adapter) {
			self.adapter = function(e) {
				if (isFinite(e.gap)) {
					e.view = new G.View(ctx);
					e.view.setLayoutParams(new G.AbsListView.LayoutParams(-1, e.gap));
					e.view.setFocusable(true);
					return e.view;
				} else {
					e.view = new G.LinearLayout(ctx);
					e.view.setOrientation(G.LinearLayout.VERTICAL);
					e.view.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
					e.view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
					e._title = new G.TextView(ctx);
					e._title.setText(String(e.text));
					e._title.setTextSize(Common.theme.textsize[2]);
					e._title.setGravity(G.Gravity.CENTER | G.Gravity.LEFT);
					e._title.setTextColor(Common.theme.textcolor);
					e._title.setFocusable(false);
					e._title.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
					e.view.addView(e._title);
					if (e.description) {
						e._description = new G.TextView(ctx);
						e._description.setText(String(e.description));
						e._description.setTextColor(Common.theme.promptcolor);
						e._description.setTextSize(Common.theme.textsize[1]);
						e._description.setPadding(0, 3 * G.dp, 0, 0);
						e._description.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
						e.view.addView(e._description);
					}
					return e.view;
				}
			}
		}
		frame = new G.FrameLayout(ctx);
		frame.setPadding(5 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
		frame.setBackgroundColor(Common.theme.message_bgcolor);
		list = new G.ListView(ctx);
		list.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -2));
		list.setBackgroundColor(G.Color.TRANSPARENT);
		list.setDividerHeight(0);
		list.setAdapter(new RhinoListAdapter(s, self.adapter));
		list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
			var e = s[pos];
			if (e.onclick) if (!e.onclick(e.button, tag)) popup.dismiss();
			return true;
		} catch(e) {erp(e)}}}));
		frame.addView(list);
		popup = Common.showDialog(frame, -1, -2);
	} catch(e) {erp(e)}})},
	
	showInputDialog : function(s) {G.ui(function() {try {
		var layout, title, text, ret, exit, popup;
		layout = new G.LinearLayout(ctx);
		layout.setBackgroundColor(Common.theme.message_bgcolor);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
		if (s.title) {
			title = new G.TextView(ctx);
			title.setTextSize(Common.theme.textsize[4]);
			title.setTextColor(Common.theme.textcolor);
			title.setText(s.title);
			title.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			title.setPadding(0, 0, 0, 10 * G.dp);
			layout.addView(title);
		}
		if (s.description) {
			text = new G.TextView(ctx);
			text.setTextSize(Common.theme.textsize[2]);
			text.setText(s.description);
			text.setTextColor(Common.theme.promptcolor);
			text.setPadding(0, 0, 0, 10 * G.dp);
			text.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			layout.addView(text);
		}
		ret = new G.EditText(ctx);
		if (s.defaultValue) ret.setText(s.defaultValue);
		ret.setSingleLine(Boolean(s.singleLine));
		if (s.inputType) ret.setInputType(s.inputType);
		if (s.keyListener) ret.setKeyListener(s.keyListener);
		if (s.transformationMethod) ret.setTransformationMethod(s.transformationMethod);
		ret.setTextSize(Common.theme.textsize[2]);
		ret.setTextColor(Common.theme.textcolor);
		ret.setBackgroundColor(G.Color.TRANSPARENT);
		ret.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
		ret.setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
		ret.setSelection(ret.length());
		layout.addView(ret);
		Common.postIME(ret);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("确定");
		exit.setTextSize(Common.theme.textsize[3]);
		exit.setGravity(G.Gravity.CENTER);
		exit.setTextColor(Common.theme.criticalcolor);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			if (s.callback && s.callback(s.text = String(ret.getText()))) return true;
			popup.dismiss();
			return true;
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		layout.addOnLayoutChangeListener(new G.View.OnLayoutChangeListener({onLayoutChange : function(v, l, t, r, b, ol, ot, or, ob) {try {
			ret.setMinWidth(0.5 * Common.getScreenWidth());
		} catch(e) {erp(e)}}}));
		s.text = null;
		s.dialog = popup = Common.showDialog(layout, -2, -2, s.onDismiss);
	} catch(e) {erp(e)}})},
	
	showListChooser : function self(l, callback, optional) {G.ui(function() {try {
		var frame, list, popup;
		if (!self.adapter) {
			self.adapter = function(e) {
				var view = new G.LinearLayout(ctx);
				view.setOrientation(G.LinearLayout.VERTICAL);
				view.setPadding(15 * G.dp, 10 * G.dp, 15 * G.dp, 10 * G.dp);
				view.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
				var title = new G.TextView(ctx);
				title.setTextSize(Common.theme.textsize[2]);
				title.setGravity(G.Gravity.CENTER | G.Gravity.LEFT);
				title.setTextColor(Common.theme.textcolor);
				title.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
				view.addView(title);
				if (e instanceof Object) {
					title.setText(String(e.text));
					if (e.description) {
						var description = new G.TextView(ctx);
						description.setText(String(e.description));
						description.setTextColor(Common.theme.promptcolor);
						description.setTextSize(Common.theme.textsize[1]);
						description.setPadding(0, 3 * G.dp, 0, 0);
						description.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
						view.addView(description);
					}
				} else {
					title.setText(String(e));
				}
				return view;
			}
		}
		if (l.length == 0) {
			Common.toast("没有可选的选项");
			return;
		}
		if (optional && l.length == 1 && !callback(0)) return;
		frame = new G.FrameLayout(ctx);
		frame.setBackgroundColor(Common.theme.message_bgcolor);
		list = new G.ListView(ctx);
		list.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -2));
		list.setBackgroundColor(G.Color.TRANSPARENT);
		list.setAdapter(new RhinoListAdapter(l, self.adapter));
		list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
			if (!callback(pos)) popup.dismiss();
			return true;
		} catch(e) {erp(e)}}}));
		frame.addView(list);
		popup = Common.showDialog(frame, -1, -2);
	} catch(e) {erp(e)}})},
	
	showSettings : function self(data, onSave) {G.ui(function() {try {
		if (!self.linear) {
			self.refreshText = function() {
				self.data.forEach(function(e, i) {
					if (e.type == "text") e._text.setText(String(e.get ? e.get() : e.text));
				});
			}
			self.adapter = function(e, i, a, extra) {
				var hl, vl;
				switch (e.type) {
					case "boolean":
					case "custom":
					hl = new G.LinearLayout(ctx);
					hl.setOrientation(G.LinearLayout.HORIZONTAL);
					hl.setLayoutParams(G.AbsListView.LayoutParams(-1, -2));
					hl.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
					vl = new G.LinearLayout(ctx);
					vl.setOrientation(G.LinearLayout.VERTICAL);
					vl.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 1.0));
					vl.getLayoutParams().gravity = G.Gravity.CENTER;
					e._name = new G.TextView(ctx);
					e._name.setText(String(e.name));
					e._name.setTextColor(Common.theme.textcolor);
					e._name.setTextSize(Common.theme.textsize[3]);
					e._name.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
					vl.addView(e._name);
					if (e.description) {
						e._description = new G.TextView(ctx);
						e._description.setText(String(e.description));
						e._description.setTextColor(Common.theme.promptcolor);
						e._description.setTextSize(Common.theme.textsize[1]);
						e._description.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
						vl.addView(e._description);
					}
					hl.addView(vl);
					if (e.type == "custom") {
						e._text = new G.TextView(ctx);
						e._text.setText(e.get ? String(e.get()) : "");
						e._text.setTextColor(Common.theme.promptcolor);
						e._text.setTextSize(Common.theme.textsize[2]);
						e._text.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
						e._text.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 0));
						e._text.getLayoutParams().gravity = G.Gravity.CENTER;
						hl.addView(e._text);
					} else {
						e._box = new G.CheckBox(ctx);
						e._box.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 0));
						e._box.getLayoutParams().gravity = G.Gravity.CENTER;
						e._box.setChecked(e.get());
						e._box.setOnCheckedChangeListener(new G.CompoundButton.OnCheckedChangeListener({onCheckedChanged : function(v, s) {try {
							e.set(s);
							if (e.onclick) e.onclick(function() {
								self.refreshText();
							});
							e._box.setChecked(e.get());
						} catch(e) {erp(e)}}}));
						e._box.setFocusable(false);
						hl.addView(e._box);
					}
					return hl;
					case "space":
					e._sp = new G.Space(ctx);
					e._sp.setLayoutParams(G.AbsListView.LayoutParams(-1, e.height));
					e._sp.setFocusable(true);
					return e._sp;
					case "tag":
					e._tag = new G.TextView(ctx);
					e._tag.setText(String(e.name));
					e._tag.setTextColor(Common.theme.highlightcolor);
					e._tag.setTextSize(Common.theme.textsize[2]);
					e._tag.setPadding(20 * G.dp, 25 * G.dp, 0, 0);
					e._tag.setLayoutParams(G.AbsListView.LayoutParams(-1, -2));
					e._tag.setFocusable(true);
					return e._tag;
					case "text":
					e._text = new G.TextView(ctx);
					e._text.setText(String(e.get ? e.get() : e.text));
					e._text.setTextColor(Common.theme.promptcolor);
					e._text.setTextSize(Common.theme.textsize[2]);
					e._text.setPadding(20 * G.dp, 0, 20 * G.dp, 10 * G.dp);
					e._text.setLayoutParams(G.AbsListView.LayoutParams(-1, -2));
					e._text.setFocusable(true);
					return e._text;
					case "seekbar":
					vl = new G.LinearLayout(ctx);
					vl.setOrientation(G.LinearLayout.VERTICAL);
					vl.setLayoutParams(G.AbsListView.LayoutParams(-1, -2));
					vl.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
					hl = new G.LinearLayout(ctx);
					hl.setOrientation(G.LinearLayout.HORIZONTAL);
					hl.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
					hl.setPadding(0, 0, 0, 10 * G.dp);
					hl.getLayoutParams().gravity = G.Gravity.CENTER;
					e._name = new G.TextView(ctx);
					e._name.setText(String(e.name));
					e._name.setTextColor(Common.theme.textcolor);
					e._name.setTextSize(Common.theme.textsize[3]);
					e._name.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2));
					hl.addView(e._name);
					e._progress = new G.TextView(ctx);
					e._progress.setTextColor(Common.theme.promptcolor);
					e._progress.setTextSize(Common.theme.textsize[2]);
					e._progress.setLayoutParams(G.LinearLayout.LayoutParams(-1, -1));
					e._progress.setGravity(G.Gravity.CENTER | G.Gravity.RIGHT);
					e._progress.setPadding(0, 0, 10 * G.dp, 0);
					hl.addView(e._progress);
					vl.addView(hl);
					e._seekbar = new G.SeekBar(ctx);
					e._seekbar.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
					e._seekbar.setOnSeekBarChangeListener(new G.SeekBar.OnSeekBarChangeListener({
						onProgressChanged : function(v, progress, fromUser) {try {
							e._progress.setText(e.current ? e.current(progress) : progress);
							return true;
						} catch(e) {erp(e)}},
						onStopTrackingTouch : function(v) {try {
							e.set(v.getProgress());
							return true;
						} catch(e) {erp(e)}}
					}));
					e._seekbar.setMax(e.max);
					e._seekbar.setProgress(e.get());
					vl.addView(e._seekbar);
					return vl;
				}
			}
			self.linear = new G.LinearLayout(ctx);
			self.linear.setLayoutParams(new G.ViewGroup.LayoutParams(-1, -1));
			self.linear.setOrientation(G.LinearLayout.VERTICAL);
			
			self.title = new G.TextView(ctx);
			self.title.setBackgroundColor(Common.theme.message_bgcolor);
			self.title.setTextSize(Common.theme.textsize[4]);
			self.title.setTextColor(Common.theme.textcolor);
			self.title.setText("设置");
			self.title.setPadding(15 * G.dp, 10 * G.dp, 15 * G.dp, 10 * G.dp);
			if (G.style == "Material") self.title.setElevation(8 * G.dp);
			self.title.setLayoutParams(new G.AbsListView.LayoutParams(-1, -2));
			
			self.list = new G.ListView(ctx);
			self.list.setBackgroundColor(Common.theme.message_bgcolor);
			self.list.setDividerHeight(0);
			self.list.addHeaderView(self.title);
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				var e = parent.getAdapter().getItem(pos);
				if (!e) return true;
				if (e.type == "custom") {
					if (e.onclick) e.onclick(function(v) {
						self.refreshText();
						e._text.setText(String(v == null ? e.get() : v));
					});
				} else if (e.type == "boolean") {
					e._box.performClick();
				}
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.list, new G.LinearLayout.LayoutParams(-1, 0, 1.0));
			
			self.exit = new G.TextView(ctx);
			self.exit.setBackgroundColor(Common.theme.message_bgcolor);
			self.exit.setText("确定");
			self.exit.setTextSize(Common.theme.textsize[3]);
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setTextColor(Common.theme.criticalcolor);
			self.exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
			if (G.style == "Material") self.exit.setElevation(8 * G.dp);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.popup.dismiss();
				return true;
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.exit, new G.LinearLayout.LayoutParams(-1, -2));
		}
		if (self.popup) self.popup.dismiss();
		self.popup = new G.PopupWindow(self.linear, -1, -1);
		if (CA.supportFloat) self.popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		self.popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		self.popup.setFocusable(true);
		self.popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			self.data.forEach(function(e, i) {
				switch (e.type) {
					case "boolean":
					case "seekbar":
					if (e.get() != self.last[i] && e.refresh) e.refresh();
					return;
					case "custom":
					case "space":
					case "tag":
					case "text":
					return;
				}
			});
			if (onSave) onSave();
			self.popup = null;
		} catch(e) {erp(e)}}}));
		self.data = data;
		self.last = data.map(function(e) {
			switch (e.type) {
				case "boolean":
				case "seekbar":
				return e.get();
				case "custom":
				case "space":
				case "tag":
				case "text":
				return null;
			}
		});
		self.list.setAdapter(new RhinoListAdapter(data, self.adapter));
		self.popup.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(self.popup);
	} catch(e) {erp(e)}})},
	
	showFileDialog : function self(o) {G.ui(function() {try {
		if (!self.linear) {
			self.adapter = function(e) {
				var name;
				name = new G.TextView(ctx);
				if (e) {
					name.setText((e.isDirectory() ? "📁 " : "📄 ") + String(e.getName()));
					name.setTextColor(e.isHidden() ? Common.theme.promptcolor : Common.theme.textcolor);
				} else {
					name.setText("📂 .. (上一级目录)");
					name.setTextColor(Common.theme.textcolor);
				}
				name.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 15 * G.dp);
				name.setSingleLine(true);
				name.setEllipsize(G.TextUtils.TruncateAt.END);
				name.setTextSize(Common.theme.textsize[3]);
				name.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
				return name;
			}
			self.compare = function(a, b) {
				return a.getName().compareToIgnoreCase(b.getName());
			}
			self.choose = function(e) {
				var o = self.sets;
				if (o.check && !o.check(e)) return false;
				self.popup.dismiss();
				o.result = e;
				if (o.callback) o.callback(o);
				self.lastDir = o.curdir.getAbsolutePath();
				return true;
			}
			self.refresh = function() {
				var o = self.sets;
				var f = o.curdir.listFiles(), i, dir = [], fi = [];
				for (i in f) {
					if (o.filter && !o.filter(f[i])) continue;
					if (f[i].isDirectory()) {
						dir.push(f[i]);
					} else if (f[i].isFile()) {
						fi.push(f[i]);
					}
				}
				self.path.setText(o.curdir.getAbsolutePath());
				if (o.compare) {
					dir.sort(o.compare);
					fi.sort(o.compare);
				} else {
					dir.sort(self.compare);
					fi.sort(self.compare);
				}
				var a = o.fileFirst ? fi.concat(dir) : dir.concat(fi);
				if (o.curdir.getParent()) a.unshift(null);
				self.list.setAdapter(self.curadp = new RhinoListAdapter(a, self.adapter));
			}
			self.linear = new G.LinearLayout(ctx);
			self.linear.setOrientation(G.LinearLayout.VERTICAL);
			
			self.header = new G.LinearLayout(ctx);
			self.header.setBackgroundColor(Common.theme.message_bgcolor);
			self.header.setOrientation(G.LinearLayout.HORIZONTAL);
			if (G.style == "Material") self.header.setElevation(8 * G.dp);
			
			self.back = new G.TextView(ctx);
			self.back.setTextSize(Common.theme.textsize[2]);
			self.back.setTextColor(Common.theme.highlightcolor);
			self.back.setText("< 返回");
			self.back.setGravity(G.Gravity.CENTER);
			self.back.setPadding(20 * G.dp, 0, 20 * G.dp, 0);
			self.back.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				self.popup.dismiss();
				return true;
			} catch(e) {erp(e)}}}));
			self.header.addView(self.back, new G.LinearLayout.LayoutParams(-2, -1));
			
			self.title = new G.TextView(ctx);
			self.title.setTextSize(Common.theme.textsize[4]);
			self.title.setTextColor(Common.theme.textcolor);
			self.title.setPadding(0, 10 * G.dp, 0, 10 * G.dp);
			self.header.addView(self.title, new G.LinearLayout.LayoutParams(-2, -2));
			
			self.path = new G.TextView(ctx);
			self.path.setTextSize(Common.theme.textsize[2]);
			self.path.setTextColor(Common.theme.promptcolor);
			self.path.setGravity(G.Gravity.CENTER | G.Gravity.LEFT);
			self.path.setPadding(15 * G.dp, 0, 5 * G.dp, 0);
			self.path.setSingleLine(true);
			self.path.setEllipsize(G.TextUtils.TruncateAt.START);
			self.path.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var o = self.sets;
				Common.showInputDialog({
					title : "路径",
					callback : function(s) {
						var f = new java.io.File(s);
						if (!f.exists()) {
							return Common.toast("路径不存在");
						}
						if (o.type == 0) {
							if (f.isDirectory()) {
								o.curdir = f;
							} else if (f.isFile()) {
								self.choose(f);
							} else return;
						} else if (o.type == 1 || o.type == 2) {
							o.curdir = f.isDirectory() ? f : f.getParentFile();
						}
						self.refresh();
					},
					singleLine : true,
					defaultValue : o.curdir.getAbsolutePath()
				});
				return true;
			} catch(e) {MapScript.error(e)}}}));
			self.header.addView(self.path, new G.LinearLayout.LayoutParams(0, -1, 1.0));
			
			self.newDir = new G.TextView(ctx);
			self.newDir.setTextSize(Common.theme.textsize[2]);
			self.newDir.setTextColor(Common.theme.textcolor);
			self.newDir.setText("📁+");
			self.newDir.setGravity(G.Gravity.CENTER);
			self.newDir.setPadding(20 * G.dp, 0, 20 * G.dp, 0);
			self.newDir.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var a = {
					title : "新建文件夹",
					callback : function(s) {
						if (!s) {
							Common.toast("目录名不能为空哦～");
							return;
						} else {
							try {
								(new java.io.File(self.sets.curdir, s)).mkdirs();
								self.refresh();
							} catch (e) {
								Common.toast("创建目录出错\n" + e + ")");
							}
						}
					}
				}
				Common.showInputDialog(a);
				return true;
			} catch(e) {erp(e)}}}));
			self.header.addView(self.newDir, new G.LinearLayout.LayoutParams(-2, -1));
			self.linear.addView(self.header, new G.LinearLayout.LayoutParams(-1, -2));
			
			self.list = new G.ListView(ctx);
			self.list.setBackgroundColor(Common.theme.message_bgcolor);
			self.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				var o = self.sets;
				var e = self.curadp.getItem(pos);
				if (!e) {
					o.curdir = o.curdir.getParentFile();
				} else if (e.isDirectory()) {
					o.curdir = e;
				} else if (o.type == 0) {
					self.choose(e);
					return true;
				} else if (o.type == 1) {
					self.fname.setText(e.getName());
					return true;
				}
				self.refresh();
				return true;
			} catch(e) {erp(e)}}}));
			self.linear.addView(self.list, new G.LinearLayout.LayoutParams(-1, 0, 1.0));
			
			self.inputbar = new G.LinearLayout(ctx);
			self.inputbar.setBackgroundColor(Common.theme.message_bgcolor);
			self.inputbar.setOrientation(G.LinearLayout.HORIZONTAL);
			if (G.style == "Material") self.inputbar.setElevation(8 * G.dp);
			
			self.fname = new G.EditText(ctx);
			self.fname.setHint("文件名");
			self.fname.setBackgroundColor(G.Color.TRANSPARENT);
			self.fname.setHintTextColor(Common.theme.promptcolor);
			self.fname.setTextSize(Common.theme.textsize[3]);
			self.fname.setSingleLine(true);
			self.fname.setGravity(G.Gravity.LEFT | G.Gravity.CENTER);
			self.fname.setInputType(G.InputType.TYPE_CLASS_TEXT);
			self.fname.setTextColor(Common.theme.textcolor);
			self.fname.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.inputbar.addView(self.fname, new G.LinearLayout.LayoutParams(0, -1, 1.0));
			
			self.exit = new G.TextView(ctx);
			self.exit.setText("确定");
			self.exit.setTextSize(Common.theme.textsize[3]);
			self.exit.setGravity(G.Gravity.CENTER);
			self.exit.setTextColor(Common.theme.criticalcolor);
			self.exit.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				var o = self.sets, e;
				if (o.type == 1) {
					if (!self.fname.getText().length()) {
						Common.toast("文件名不能为空哦～");
						return true;
					}
					var e = new java.io.File(o.curdir, self.fname.getText());
					if (!e.getParentFile().exists()) {
						e = new java.io.File(self.fname.getText());
						if (!e.getParentFile().exists()) {
							Common.toast("无效的文件名");
							return true;
						}
					}
					if (e.exists() && !e.isFile()) {
						Common.toast("同名目录已存在，无法保存");
						return true;
					}
					self.choose(e);
				} else if (o.type == 2) {
					self.choose(o.curdir);
				}
				return true;
			} catch(e) {erp(e)}}}));
			self.inputbar.addView(self.exit, new G.LinearLayout.LayoutParams(-2, -2));
			self.linear.addView(self.inputbar, new G.LinearLayout.LayoutParams(-1, -2));
		}
		if (self.popup) self.popup.dismiss();
		self.popup = new G.PopupWindow(self.linear, -1, -1);
		if (CA.supportFloat) self.popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		self.popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		self.popup.setFocusable(true);
		self.popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			if (o.onDismiss) o.onDismiss();
			self.popup = null;
		} catch(e) {erp(e)}}}));
		self.sets = o;
		try {
			o.curdir = new java.io.File(String(o.initDir ? o.initDir : self.lastDir));
			if (!o.curdir.isDirectory()) o.curdir = android.os.Environment.getExternalStorageDirectory();
			self.refresh();
		} catch (e) {
			Common.toast("拒绝访问\n" + e + ")");
			return;
		}
		self.title.setText(String(o.title || "浏览"));
		switch (o.type) {
			case 1: //新建文件（保存）
			self.exit.setVisibility(G.View.VISIBLE);
			self.fname.setVisibility(G.View.VISIBLE);
			self.fname.setText(String(o.defaultFileName || ""));
			break;
			case 2: //选择目录（打开）
			self.exit.setVisibility(G.View.VISIBLE);
			self.fname.setVisibility(G.View.GONE);
			break;
			default:
			o.type = 0;
			case 0: //选择文件（打开）
			self.exit.setVisibility(G.View.GONE);
			self.fname.setVisibility(G.View.GONE);
		}
		self.popup.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(self.popup);
	} catch(e) {erp(e)}})},
	
	showDebugDialog : function self(o) {G.ui(function() {try {
		if (!self.main) {
			self.cls = function() {
				self.prompt.setText("");
				self.ready();
			}
			self.print = function(str, span) {
				var t = new G.SpannableStringBuilder(self.prompt.getText());
				if (span) {
					appendSSB(t, str, span);
				} else {
					t.append(str);
				}
				self.prompt.setText(t);
				self.vscr.post(function() {try {
					self.vscr.fullScroll(G.View.FOCUS_DOWN);
				} catch(e) {erp(e)}});
			}
			self.ready = function() {
				self.print("\n>  ", new G.ForegroundColorSpan(Common.theme.highlightcolor));
			}
			
			self.exec = function(s) {
				if (s.toLowerCase() == "exit") {
					self.popup.dismiss();
					return;
				} else if (s.toLowerCase() == "cls") {
					self.cls();
					return;
				}
				self.print(s);
				self.print("\n");
				try {
					var t = eval.call(null, s);
					self.print(typeof t == "string" ? t : MapScript.toSource(t));
				} catch(e) {
					self.print(e + "\n" + e.stack, new G.ForegroundColorSpan(Common.theme.criticalcolor));
				}
				self.ready();
			}
			
			self.main = new G.LinearLayout(ctx);
			self.main.setOrientation(G.LinearLayout.VERTICAL);
			self.main.setBackgroundColor(G.Color.TRANSPARENT);
			
			self.bar = new G.LinearLayout(ctx);
			self.bar.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			self.bar.setOrientation(G.LinearLayout.HORIZONTAL);
			self.bar.setBackgroundColor(Common.theme.float_bgcolor);
			
			self.cmd = new G.EditText(ctx);
			self.cmd.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2, 1.0));
			self.cmd.setHint("命令");
			self.cmd.setBackgroundColor(G.Color.TRANSPARENT);
			self.cmd.setTextSize(Common.theme.textsize[3]);
			self.cmd.setTextColor(Common.theme.textcolor);
			self.cmd.setHintTextColor(Common.theme.promptcolor);
			self.cmd.setFocusableInTouchMode(true);
			self.cmd.setPadding(5 * G.dp, 10 * G.dp, 0, 10 * G.dp);
			self.cmd.setImeOptions(G.EditorInfo.IME_FLAG_NO_EXTRACT_UI);
			self.bar.addView(self.cmd);
			Common.postIME(self.cmd);
			
			self.eval = new G.TextView(ctx);
			self.eval.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			self.eval.setGravity(G.Gravity.CENTER);
			self.eval.setBackgroundColor(Common.theme.go_bgcolor);
			self.eval.setText(">");
			self.eval.setTextSize(Common.theme.textsize[3]);
			self.eval.setTextColor(Common.theme.go_textcolor);
			self.eval.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.eval.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				switch (e.getAction()) {
					case e.ACTION_DOWN:
					v.setBackgroundColor(Common.theme.go_touchbgcolor);
					v.setTextColor(Common.theme.go_touchtextcolor);
					break;
					case e.ACTION_UP:
					v.setBackgroundColor(Common.theme.go_bgcolor);
					v.setTextColor(Common.theme.go_textcolor);
				}
				return false;
			} catch(e) {erp(e)}}}));
			self.eval.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (!self.cmd.getText().length()) return true;
				self.exec(String(self.cmd.getText()));
				self.cmd.setText("");
				return true;
			} catch(e) {erp(e)}}}));
			self.bar.addView(self.eval);
			
			self.vscr = new G.ScrollView(ctx);
			self.vscr.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1.0));
			self.vscr.setBackgroundColor(Common.theme.message_bgcolor);
			self.prompt = new G.TextView(ctx);
			self.prompt.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			self.prompt.setTextSize(Common.theme.textsize[2]);
			self.prompt.setTextColor(Common.theme.textcolor);
			self.prompt.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.vscr.addView(self.prompt);
			
			self.main.addView(self.vscr);
			self.main.addView(self.bar);
		}
		if (self.popup) self.popup.dismiss();
		self.popup = new G.PopupWindow(self.main, -1, -1);
		if (CA.supportFloat) self.popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		self.popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		self.popup.setFocusable(true);
		self.popup.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			self.popup = null;
		} catch(e) {erp(e)}}}));
		self.prompt.setText("");
		self.print("命令行 - 输入exit以退出", new G.StyleSpan(G.Typeface.BOLD));
		self.print("\n想接这坑的请联系我，联系方式在关于里面");
		self.ready();
		self.popup.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(self.popup);
	} catch(e) {erp(e)}})},
	
	showWebViewDialog : function(s) {G.ui(function() {try {
		var layout, wv, ws, exit, popup;
		layout = new G.LinearLayout(ctx);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setBackgroundColor(Common.theme.message_bgcolor);
		layout.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 0);
		wv = new G.WebView(ctx);
		wv.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1.0));
		if (s.url && s.code) {
			wv.loadDataWithBaseURL(String(s.url), String(s.code), s.mimeType ? String(s.mimeType) : null, null, null);
		} else if (s.code) {
			wv.loadData(String(s.code), s.mimeType ? String(s.mimeType) : null, null);
		} else if (s.url) {
			wv.loadUrl(String(s.url));
		} else {
			wv.loadUrl("about:blank");
		}
		ws = wv.getSettings();
		ws.setSupportZoom(true);
		ws.setJavaScriptEnabled(true);
		ws.setAllowFileAccess(true);
		ws.setAllowFileAccessFromFileURLs(true);
		ws.setAllowUniversalAccessFromFileURLs(true);
		ws.setSaveFormData(true);
		ws.setLoadWithOverviewMode(true);
		ws.setJavaScriptCanOpenWindowsAutomatically(true);
		ws.setLoadsImagesAutomatically(true);
		ws.setAllowContentAccess(true);
		//ws.setBuiltInZoomControls(true);
		//ws.setUseWideViewPort(true);
		layout.addView(wv);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("关闭");
		exit.setTextSize(Common.theme.textsize[3]);
		exit.setGravity(G.Gravity.CENTER);
		exit.setTextColor(Common.theme.criticalcolor);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			popup.dismiss();
			return true;
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		popup = Common.showDialog(layout, -1, -1, function() {
			wv.destroy();
		});
	} catch(e) {erp(e)}})},
	
	fileCopy : function(src, dest) {
		const BUFFER_SIZE = 4096;
		var fi, fo, buf, hr;
		fi = new java.io.FileInputStream(src);
		fo = new java.io.FileOutputStream(dest);
		buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, BUFFER_SIZE);
		while ((hr = fi.read(buf)) > 0) fo.write(buf, 0, hr);
		fi.close();
		fo.close();
	},
	
	readFile : function(path, defaultValue, gzipped) {
		try{
			if (!(new java.io.File(path)).isFile()) return defaultValue;
			var rd, s = [], q;
			if (gzipped) {
				rd = new java.io.BufferedReader(new java.io.InputStreamReader(new java.util.zip.GZIPInputStream(new java.io.FileInputStream(path))));
			} else {
				rd = new java.io.BufferedReader(new java.io.FileReader(path));
			}
			while (q = rd.readLine()) s.push(q);
			rd.close();
			return s.join("\n");
		} catch(e) {
			return defaultValue;
		}
	},
	
	saveFile : function(path, text, gzipped) {
		var wr;
		var f = new java.io.File(path).getParentFile();
		if (f) f.mkdirs();
		if (gzipped) {
			wr = new java.util.zip.GZIPOutputStream(new java.io.FileOutputStream(path));
		} else {
			wr = new java.io.FileOutputStream(path);
		}
		wr.write(new java.lang.String(text).getBytes());
		wr.close();
	},
	
	getFileSize : function(f, showBytes) {
		var l = Number(f.length()), r;
		if (l < 1000) {
			r = l + " 字节";
		} else if (l >= 1000 && l < 1024000) {
			r = (l / 1024).toFixed(2) + " KB";
		} else if (l >= 1024000 && l < 1048576000) {
			r = (l / 1048576).toFixed(2) + " MB";
		} else {
			r = (l / 1073741824).toFixed(2) + " GB";
		}
		if (showBytes) r += " (" + l.toLocaleString() + " 字节)";
		return r;
	},
	
	traceStack : function() {
		var s = [], i;
		var ts = java.lang.Thread.getAllStackTraces();
		var it = ts.keySet().iterator();
		var ct, cts, ctid = java.lang.Thread.currentThread().getId();
		while (it.hasNext()) {
			ct = it.next();
			s.push((ctid == ct.getId() ? "<当前>" : "") + "线程" + ct.getId() + ":" + ct.getName() + " (优先级" + ct.getPriority() + (ct.isDaemon() ? "守护线程" : "") + ") - " + ct.getState().toString());
			cts = ts.get(ct);
			for (i in cts) {
				s.push(" at " + cts[i].toString());
			}
			s.push("");
		}
		return s.join("\n");
	},
	
	toast : function self(s, dur) {G.ui(function() {try {
		if (self.last) self.last.cancel();
		(self.last = G.Toast.makeText(ctx, String(s), dur ? 1 : 0)).show();
	} catch(e) {erp(e)}})},
	
	postIME : function(v, delay) {
		v.postDelayed(function() {try {
			v.requestFocus();
			ctx.getSystemService(ctx.INPUT_METHOD_SERVICE).showSoftInput(v, G.InputMethodManager.SHOW_IMPLICIT);
		} catch(e) {erp(e)}}, isNaN(delay) ? 0 : delay);
	},
	
	canShowFloat : function() {
		try {
			return ctx.getSystemService("appops").checkOp(24, android.os.Binder.getCallingUid(), ctx.getPackageName()) == 0;
		} catch(e) {}
		return false;
	},
	
	showAppSettings : function() {
		var localIntent = new android.content.Intent();
		localIntent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
		if (android.os.Build.VERSION.SDK_INT >= 9) {
			localIntent.setAction("android.settings.APPLICATION_DETAILS_SETTINGS");
			localIntent.setData(android.net.Uri.fromParts("package", ctx.getPackageName(), null));
		} else {
			localIntent.setAction(android.content.Intent.ACTION_VIEW);
			localIntent.setClassName("com.android.settings", "com.android.settings.InstalledAppDetails");
			localIntent.putExtra("com.android.settings.ApplicationPkgName", ctx.getPackageName());
		}
		ctx.startActivity(localIntent);
	},
	
	hasClipboardText : function() {
		if (android.os.Build.VERSION.SDK_INT >= 11) {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).hasPrimaryClip();
		} else {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).hasText();
		}
	},
	getClipboardText : function() {
		if (android.os.Build.VERSION.SDK_INT >= 11) {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).getPrimaryClip().getItemAt(0).coerceToText(ctx);
		} else {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).getText();
		}
	},
	setClipboardText : function(text) {
		if (android.os.Build.VERSION.SDK_INT >= 11) {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).setPrimaryClip(new android.content.ClipData.newPlainText("", text));
		} else {
			return ctx.getSystemService(ctx.CLIPBOARD_SERVICE).setText(text);
		}
	},
	
	getScreenHeight : function() {
		return ctx.getResources().getDisplayMetrics().heightPixels;
	},
	getScreenWidth : function() {
		return ctx.getResources().getDisplayMetrics().widthPixels;
	}
});

MapScript.loadModule("appendSSB", function(src, str, span) { //#IMPORTANT# Fix Bug: SpannableStringBuilder.append(CharSequence text, Object what, int flags) can only run on Android 5.0+
	var c = src.length();
	src.append(str);
	src.setSpan(span, c, src.length(), src.SPAN_INCLUSIVE_EXCLUSIVE);
});

MapScript.loadModule("ES6Ex", { //Partically Supported ECMAScript 6
	onCreate : function() {
		if (!String.prototype.startsWith) String.prototype.startsWith = this.string_startsWith;
		if (!String.prototype.endsWith) String.prototype.endsWith = this.string_endsWith;
		if (!Object.copy) Object.copy = this.object_copy;
	},
	string_startsWith : function(s) {
		return this.slice(0, s.length) == s;
	},
	string_endsWith : function(s) {
		return this.slice(-s.length) == s;
	},
	object_copy : function(o) { //浅层对象复制
		var _copy = function copy(x, lev) {
			var p = "", r, i;
			if (lev < 0) return x;
			if (Array.isArray(x)) {
				r = x.slice();
				for (i = 0; i < x.length; i++) r[i] = copy(r[i], lev - 1);
				return r;
			} else if (x instanceof Date) {
				return new Date(x.getTime());
			} else if (x instanceof Object) {
				r = {};
				for (i in x) r[i] = copy(x[i]);
				return r;
			}
			return x;
		}
		return _copy(o, 32);
	}
});

MapScript.loadModule("FCString", {
	BEGIN : "§",
	COLOR : {
		"0" : G.Color.rgb(0, 0, 0),
		"1" : G.Color.rgb(0, 0, 170),
		"2" : G.Color.rgb(0, 170, 0),
		"3" : G.Color.rgb(0, 170, 170),
		"4" : G.Color.rgb(170, 0, 0),
		"5" : G.Color.rgb(170, 0, 170),
		"6" : G.Color.rgb(255, 170, 0),
		"7" : G.Color.rgb(170, 170, 170),
		"8" : G.Color.rgb(85, 85, 85),
		"9" : G.Color.rgb(85, 85, 255),
		"a" : G.Color.rgb(85, 255, 85),
		"b" : G.Color.rgb(85, 255, 255),
		"c" : G.Color.rgb(255, 85, 85),
		"d" : G.Color.rgb(255, 85, 255),
		"e" : G.Color.rgb(255, 255, 85),
		"f" : G.Color.rgb(255, 255, 255)
	},
	BOLD : "l",
	STRIKETHROUGH : "m",
	UNDERLINE : "n",
	ITALIC : "o",
	RANDOMCHAR : "k",
	RESET : "r",
	parseFC : function(s, defaultcolor) {
		var self = this;
		var color = defaultcolor;
		var cs = 0;
		var style = {
			"l" : null,
			"m" : null,
			"n" : null,
			"o" : null,
			"k" : null
		};
		var span = [];
		s = String(s);
		var d = [], c, i, f = false, r;
		function startColor(c) {
			if (color != null) endColor();
			reset();
			color = self.COLOR[c];
			cs = d.length;
		}
		function endColor() {
			if (color == null) return;
			span.push({
				type : "c",
				color : color,
				start : cs,
				end : d.length
			});
			color = defaultcolor;
		}
		function startStyle(c) {
			if (style[c] != null) endStyle(c);
			style[c] = d.length;
		}
		function endStyle(c) {
			if (style[c] == null) return;
			span.push({
				type : c,
				start : style[c],
				end : d.length
			});
			style[c] = null;
		}
		function reset() {
			for (c in style) endStyle(c);
			endColor();
		}
		for (i = 0; i < s.length; i++) {
			c = s.slice(i, i + 1);
			if (f) {
				if (c in self.COLOR) {
					startColor(c);
				} else if (c in style) {
					startStyle(c);
				} else if (c == self.RESET) {
					reset();
				} else if (c == self.BEGIN) {
					d.push(self.BEGIN);
				} else {
					d.push(self.BEGIN, c);
				}
				f = false;
			} else if (c == self.BEGIN){
				f = true;
			} else {
				d.push(c);
			}
		}
		reset();
		if (f) d.push(self.BEGIN);
		r = new G.SpannableString(d.join(""));
		span.forEach(function(e, i, a) {
			switch (e.type) {
				case "c":
				r.setSpan(new G.ForegroundColorSpan(e.color), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case self.BOLD:
				r.setSpan(new G.StyleSpan(G.Typeface.BOLD), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case self.STRIKETHROUGH:
				r.setSpan(new G.StrikethroughSpan(), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case self.UNDERLINE:
				r.setSpan(new G.UnderlineSpan(), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case self.ITALIC:
				r.setSpan(new G.StyleSpan(G.Typeface.ITALIC), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
			}
		});
		return r;
	},
	parseFC_ : function(ss, defaultcolor) {
		var self = this;
		var color = defaultcolor;
		var cs = 0;
		var style = {
			"l" : null,
			"m" : null,
			"n" : null,
			"o" : null,
			"k" : null
		};
		var span = [];
		var s = String(ss);
		var c, i, f = -1, r;
		function startColor(c) {
			if (color != defaultcolor) endColor();
			reset();
			color = self.COLOR[c];
			cs = i + 1;
		}
		function endColor() {
			if (color == defaultcolor) return;
			span.push({
				type : "c",
				color : color,
				start : cs,
				end : i
			});
			color = defaultcolor;
		}
		function startStyle(c) {
			if (style[c] != null) endStyle(c);
			style[c] = i;
		}
		function endStyle(c, reset) {
			if (style[c] == null) return;
			span.push({
				type : c,
				start : style[c],
				end : reset ? i : i - 1
			});
			style[c] = null;
		}
		function reset(f) {
			for (var c in style) endStyle(c, f);
			endColor();
		}
		for (i = 0; i < s.length; i++) {
			c = s.slice(i, i + 1);
			if (f >= 0) {
				if (c in self.COLOR) {
					startColor(c);
					span.push({
						type : "c_",
						color : self.COLOR[c],
						start : i - 1,
						end : i + 1
					});
				} else if (c in style) {
					startStyle(c);
					span.push({
						type : "s_",
						start : i - 1,
						end : i + 1
					});
					span.push({
						type : c,
						start : i - 1,
						end : i + 1
					});
				} else if (c == self.RESET) {
					reset();
					span.push({
						type : "s_",
						start : i - 1,
						end : i + 1
					});
				} else if (c == self.BEGIN) {
					span.push({
						type : "s_",
						start : i - 1,
						end : i
					});
				}
				f = -1;
			} else if (c == this.BEGIN){
				f = i;
			}
		}
		reset(true);
		span.forEach(function(e, i, a) {
			switch (e.type) {
				case "c":
				ss.setSpan(new G.ForegroundColorSpan(e.color), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case "c_":
				ss.setSpan(new G.ForegroundColorSpan(G.Color.argb(0x80, G.Color.red(e.color), G.Color.green(e.color), G.Color.blue(e.color))), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case "s_":
				ss.setSpan(new G.ForegroundColorSpan(G.Color.argb(0x80, G.Color.red(defaultcolor), G.Color.green(defaultcolor), G.Color.blue(defaultcolor))), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case self.BOLD:
				ss.setSpan(new G.StyleSpan(G.Typeface.BOLD), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case self.STRIKETHROUGH:
				ss.setSpan(new G.StrikethroughSpan(), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case self.UNDERLINE:
				ss.setSpan(new G.UnderlineSpan(), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				break;
				
				case self.ITALIC:
				ss.setSpan(new G.StyleSpan(G.Typeface.ITALIC), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
				
				case self.RANDOMCHAR:
				//ss.setSpan(new G.StyleSpan(G.Typeface.ITALIC), e.start, e.end, G.Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
			}
		});
		return r;
	}
});

MapScript.loadModule("F3", {
	BUFFER_SIZE : 20,
	show : function self() {G.ui(function() {try {
		if (F3.bar) F3.bar.dismiss();
		if (!F3.main) {
			F3.scr = new G.ScrollView(ctx);
			F3.main = new G.TextView(ctx);
			F3.main.setBackgroundColor(G.Color.argb(0xC0, 0, 0, 0));
			F3.main.setTextColor(G.Color.WHITE);
			F3.main.setGravity(G.Gravity.LEFT | G.Gravity.TOP);
			F3.main.setPadding(5 * G.dp, 5 * G.dp, 5 * G.dp, 5 * G.dp);
			F3.main.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				if (!F3.inLevel) {
					Common.toast("进入地图即可启用调试屏幕");
					return true;
				}
				F3.visible = !F3.visible;
				F3.main.setTextSize(F3.visible ? 8 : 30);
				if (!F3.visible) {
					F3.main.setText(">");
				}
				return true;
			} catch(e) {erp(e)}}}));
			F3.main.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
				var t;
				switch (e.getAction()) {
					case e.ACTION_MOVE:
					F3.bar.update(0, self.cy = e.getRawY() + touch.offy, -1, -1);
					break;
					case e.ACTION_DOWN:
					touch.offy = self.cy - e.getRawY();
					break;
				}
				return false;
			} catch(e) {erp(e)}}}));
			F3.scr.addView(F3.main);
		}
		F3.bar = new G.PopupWindow(F3.scr, -2, -2);
		F3.bar.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.LEFT | G.Gravity.TOP, 0, self.cy ? self.cy : (self.cy = 0));
		F3.visible = false;
		F3.main.setTextSize(30);
		F3.main.setText(">");
		F3.eventbuffer.length = 0;
	} catch(e) {erp(e)}})},
	hide : function() {G.ui(function() {try {
		if (F3.bar) F3.bar.dismiss();
		F3.bar = null;
		F3.visible = false;
	} catch(e) {erp(e)}})},
	refresh : function() {G.ui(function() {try {
		var i, l = new G.SpannableStringBuilder();
		if (!F3.visible) return;
		for (i in F3.items) {
			if (F3.items[i] == null) continue;
			l.append(String(F3.names[i]));
			l.append(" : ");
			l.append(String(F3.items[i]));
			l.append("\n");
		}
		if (F3.eventbuffer.length) {
			l.append("\n--Events--\n");
			l.append(F3.eventbuffer.join("\n\n"));
		}
		F3.main.setText(l);
	} catch(e) {erp(e)}})},
	modTick : function() {try {
		if (!F3.visible) return;
		var p = Player.getEntity();
		this.items.x = Player.getX().toFixed(5);
		this.items.y = (Player.getY() - 1.619999885559082).toFixed(5);
		this.items.z = Player.getZ().toFixed(5);
		this.items.d = Player.getDimension();
		/*this.items.vx = Entity.getVelX(p).toFixed(5);
		this.items.vy = Entity.getVelY(p).toFixed(5);
		this.items.vz = Entity.getVelZ(p).toFixed(5);*/
		this.items.rx = Entity.getPitch(p).toFixed(5);
		this.items.ry = Entity.getYaw(p).toFixed(5);
		this.items.b = Level.getBiome(this.items.x, this.items.z);
		this.items.bn = Level.biomeIdToName(this.items.b);
		this.items.bl = Level.getBrightness(this.items.x, this.items.y, this.items.z);
		/*this.items.cx = Math.floor(this.items.x) >> 4;
		this.items.cz = Math.floor(this.items.z) >> 4;*/
		this.items.t = Level.getTime();
		/*this.items.ll = Level.getLightningLevel().toFixed(5);
		this.items.rl = Level.getRainLevel().toFixed(5);*/
		if (Player.getPointedBlockY() >= 0) {
			this.items.lx = Player.getPointedBlockX();
			this.items.ly = Player.getPointedBlockY();
			this.items.lz = Player.getPointedBlockZ();
			this.items.lb = Player.getPointedBlockId();
			this.items.ld = Player.getPointedBlockData();
			this.items.ls = Player.getPointedBlockSide();
		} else {
			this.items.lx = this.items.ly = this.items.lz = this.items.lb = this.items.ld = this.items.ls = null;
		}
		if (Entity.getY(Player.getPointedEntity()) > 0) {
			this.items.puid = Player.getPointedEntity();
			this.items.pt = Entity.getEntityTypeId(this.items.puid);
		} else {
			this.items.puid = this.items.pt = null;
		}
		this.refresh();
	} catch(e) {erp(e)}},
	newLevel : function() {try {
		this.inLevel = true;
	} catch(e) {erp(e)}},
	leaveGame : function() {try {
		this.inLevel = false;
	} catch(e) {erp(e)}},
	useItem : function(x, y, z, itemid, blockid, side, itemDamage, blockDamage) {
		this.logEvent("TapBlock", {
			pos : [x, y, z],
			block : blockid + ":" + blockDamage + ">" + side,
			carry : itemid + ":" + itemDamage
		});
	},
	destroyBlock : function(x, y, z, side) {
		this.logEvent("DestroyBlock", {
			pos : [x, y, z],
			block : Level.getTile(x, y, z) + ":" + Level.getData(x, y, z) + ">" + side
		});
	},
	attackHook : function(attacker, victim) {
		this.logEvent("AttackEntity", {
			atk : attacker,
			vic : victim
		});
	},
	names : {
		x : "X",
		y : "Y",
		z : "Z",
		d : "Dimision",
		rx : "Rx",
		ry : "Ry",
		vx : "Vx",
		vy : "Vy",
		vz : "Vz",
		b : "BiomeID",
		bn : "BiomeName",
		bl : "LightLevel",
		cx : "ChunkX",
		cz : "ChunkZ",
		t : "Time",
		rl : "RainLevel",
		ll : "LNLevel",
		lx : "PBX",
		ly : "PBY",
		lz : "PBZ",
		lb : "PBID",
		ld : "PBData",
		ls : "PBSide",
		puid : "PEUUID",
		pt : "PEType"
	},
	items : {},
	inLevel : false,
	eventbuffer : [],
	logEvent : function(name, tags) {
		if (!this.visible) return;
		var s = [name], r, k;
		for (i in tags) {
			s.push(i + ":" + tags[i]);
		}
		r = s.join("\n");
		if ((k = this.eventbuffer.indexOf(r)) >= 0) {
			this.eventbuffer.splice(k, 1);
		}
		this.eventbuffer.unshift(r);
		if (this.eventbuffer.length > this.BUFFER_SIZE) {
			this.eventbuffer.length = this.BUFFER_SIZE;
		}
	}
});
/*
MapScript.loadModule("DTParse", (function () {
	//该函数基于JSON2，并对里面部分函数进行了修改与汉化。
	var at;
	var ch;
	var escapee = {
		"\"": "\"",
		"\\": "\\",
		"/": "/",
		b: "\b",
		f: "\f",
		n: "\n",
		r: "\r",
		t: "\t"
	};
	var text;
	var error = function (m) {
		throw {
			name: "数据标签语法错误",
			message: m,
			at: at,
			text: text,
			toString : Error.prototype.toString
		};
	};
	var next = function (c) {
		if (c && c !== ch) {
			error("本应为字符 '" + c + "' 实际上却为字符 '" + ch + "'");
		}
		ch = text.charAt(at);
		at += 1;
		return ch;
	};
	var number = function () {
		var value;
		var string = "";
		if (ch === "-") {
			string = "-";
			next("-");
		}
		while (ch >= "0" && ch <= "9") {
			string += ch;
			next();
		}
		if (ch === ".") {
			string += ".";
			while (next() && ch >= "0" && ch <= "9") {
				string += ch;
			}
		}
		if (ch === "b" || ch === "B" || ch === "s" || ch === "S" || ch === "l" || ch === "L" || ch === "f" || ch === "F" || ch === "d" || ch === "D") {
			next();
		}
		value = +string;
		if (!isFinite(value)) {
			error("数字格式不正确或溢出");
		} else {
			return value;
		}
	};
	var string = function () {
		var hex;
		var i;
		var value = "";
		var uffff;
		if (ch === "\"") {
			while (next()) {
				if (ch === "\"") {
					next();
					return value;
				}
				if (ch === "\\") {
					next();
					if (ch === "u") {
						uffff = 0;
						for (i = 0; i < 4; i += 1) {
							hex = parseInt(next(), 16);
							if (!isFinite(hex)) {
								break;
							}
							uffff = uffff * 16 + hex;
						}
						value += String.fromCharCode(uffff);
					} else if (typeof escapee[ch] === "string") {
						value += escapee[ch];
					} else {
						break;
					}
				} else {
					value += ch;
				}
			}
		} else {
			value = ch;
			while (next()) {
				if (ch === "," || ch === " " || ch === "(" || ch === ")" || ch === "{" || ch === "}" || ch === "[" || ch === "]" || ch === ":") {
					return value;
				}
				value += ch;
			}
		}
		error("字符串格式不正确");
	};
	var white = function () {
		while (ch && ch <= " ") {
			next();
		}
	};
	var value;
	var array = function () {
		var arr = [];
		if (ch === "[") {
			next("[");
			white();
			if (ch === "]") {
				next("]");
				return arr;
			}
			while (ch) {
				arr.push(value());
				white();
				if (ch === "]") {
					next("]");
					return arr;
				}
				next(",");
				white();
			}
		}
		error("数组格式不正确");
	};
	var object = function () {
		var key;
		var obj = {};
		if (ch === "{") {
			next("{");
			white();
			if (ch === "}") {
				next("}");
				return obj;
			}
			while (ch) {
				key = string();
				white();
				next(":");
				if (Object.hasOwnProperty.call(obj, key)) {
					error("重复的键 '" + key + "'");
				}
				obj[key] = value();
				white();
				if (ch === "}") {
					next("}");
					return obj;
				}
				next(",");
				white();
			}
		}
		error("对象格式错误");
	};
	value = function () {
		white();
		switch (ch) {
		case "{":
			return object();
		case "[":
			return array();
		case "-":
			return number();
		default:
			return (ch >= "0" && ch <= "9")
				? number()
				: string();
		}
	};
	return function (source) {
		var result;
		text = source;
		at = 0;
		ch = " ";
		result = value();
		white();
		if (ch) {
			error("字符多余");
		}
		return result;
	};
})());
*/
MapScript.loadModule("RhinoListAdapter", (function() {
	var r = function(arr, vmaker, params, preload) {
		//arr是列表数组，vmaker(element, index, array, params)从item生成指定view
		var src = arr.slice(), views = new Array(arr.length), dso = [], controller;
		if (preload) {
			src.forEach(function(e, i, a) {
				views[i] = vmaker(e, i, a, params);
			});
		}
		controller = new RhinoListAdapter.Controller(src, views, dso, vmaker, params, preload);
		return new G.ListAdapter({
			getCount : function() {
				return src.length;
			},
			getItem : function(pos) {
				if (pos == -1) return controller;
				return src[pos];
			},
			getItemId : function(pos) {
				return pos;
			},
			getItemViewType : function(pos) {
				return 0;
			},
			getView : function(pos) {
				return views[pos] ? views[pos] : (views[pos] = vmaker(src[pos], parseInt(pos), src, params));
			},
			getViewTypeCount : function() {
				return 1;
			},
			hasStableIds : function() {
				return true;
			},
			isEmpty : function() {
				return src.length === 0;
			},
			areAllItemsEnabled : function() {
				return true;
			},
			isEnabled : function(pos) {
				return pos >= 0 && pos < src.length;
			},
			registerDataSetObserver : function(p) {
				if (dso.indexOf(p) >= 0) return;
				dso.push(p);
			},
			unregisterDataSetObserver : function(p) {
				var i = dso.indexOf(p);
				if (p >= 0) dso.splice(i, 1);
			}
		});
	}
	r.Controller = function(src, views, dso, vmaker, params, preload) {
		this.src = src;
		this.views = views;
		this.dso = dso;
		this.vmaker = vmaker;
		this.params = params;
		this.preload = preload;
	}
	r.Controller.prototype = {
		notifyChange : function() {
			this.dso.forEach(function(e) {
				if (e) e.onChanged();
			});
		},
		notifyInvalidate : function() {
			this.dso.forEach(function(e) {
				if (e) e.onInvalidated();
			});
		},
		add : function(e) {
			this.src.push(e);
			if (this.preload) this.views.push(this.vmaker(e, this.src.length - 1, this.src, this.params));
			this.notifyChange();
		},
		concat : function(arr) {
			arr.forEach(function(e) {
				this.src.push(e)
				if (this.preload) this.views.push(this.vmaker(e, this.src.length - 1, this.src, this.params));
			}, this);
			this.notifyChange();
		},
		insert : function(e, i, respawn) {
			this.src.splice(i, 0, e);
			if (respawn) {
				this.respawnAll();
			} else {
				this.views.splice(i, 0, this.preload ? this.vmaker(e, i, this.src, this.params) : null);
			}
			this.notifyChange();
		},
		remove : function(e, respawn) {
			var i;
			for (i = this.src.length; i >= 0; i--) {
				if (this.src[i] != e) continue;
				this.src.splice(i, 1);
				this.views.splice(i, 1);
			}
			if (respawn) this.respawnAll();
			this.notifyChange();
		},
		removeByIndex : function(i, respawn) {
			this.src.splice(i, 1);
			this.views.splice(i, 1);
			if (respawn) this.respawnAll();
		},
		replace : function(e, i) {
			this.src[i] = e;
			this.views[i] = this.preload ? this.vmaker(e, i, this.src, this.params) : null;
			this.notifyChange();
		},
		respawn : function(i) {
			this.views[i] = this.vmaker(this.src[i], i, this.src, this.params);
			this.notifyChange();
		},
		respawnAll : function(i) {
			this.src.forEach(function(e, i, a) {
				this.views[i] = this.vmaker(e, i, a, this.params);
			}, this);
			this.notifyChange();
		},
		getArray : function() {
			return this.src.slice();
		},
		setArray : function(a) {
			this.src = a.slice();
			this.views.length = this.src.length;
			this.respawnAll();
		}
	}
	r.getController = function(adapter) {
		return adapter.getItem(-1);
	}
	return r;
})());

MapScript.loadModule("Updater", {
	queryPage : function(url) {
		var url = new java.net.URL(url);
		var conn = url.openConnection();
		conn.setConnectTimeout(5000);
		conn.setUseCaches(false);
		conn.setRequestMethod("GET");
		conn.connect();
		var rd = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
		var s = [], ln, r;
		while (ln = rd.readLine()) s.push(ln);
		rd.close();
		return s.join("\n");
	},
	download : function(url, path) {
		const BUFFER_SIZE = 4096;
		var url = new java.net.URL(url);
		var conn = url.openConnection();
		conn.setConnectTimeout(5000);
		conn.setUseCaches(false);
		conn.setRequestMethod("GET");
		conn.connect();
		var is, os, buf, hr;
		is = conn.getInputStream();
		os = new java.io.FileOutputStream(path);
		buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, BUFFER_SIZE);
		while ((hr = is.read(buf)) > 0) os.write(buf, 0, hr);
		os.close();
	},
	toChineseDate : function(d) {
		return new java.text.SimpleDateFormat("yyyy'年'MM'月'dd'日' HH:mm").format(new java.util.Date(d));
	},
	toAnchor : function(title, url) {
		return '<a href="' + url + '">' + title + '</a>';
	},
	getUpdateInfo : function(callback) {
		var src;
		try {
			if (this.lastcheck) {
				src = this.lastcheck;
			} else {
				src = this.queryPage(this.url);
				this.lastcheck = src;
			}
			var r = JSON.parse(src);
			callback(Date.parse(CA.publishDate) < Date.parse(r.version), r.version, G.Html.fromHtml([
				"<b>最新版本：" + r.version + "</b>\t(" + r.belongs + ")",
				"发布时间：" + this.toChineseDate(r.time),
				"<br /><b>下载地址：</b><br />" + Object.keys(r.downloads).map(function(e) {
					return Updater.toAnchor("★" + e, r.downloads[e]);
				}).join("<br />"),
				"<br />最近更新内容：",
				r.info.replace(/\n/g, "<br />")
			].join("<br />")));
		} catch(e) {
			Common.toast("检测更新失败，请检查网络连接\n(" + e + ")");
		}
	},
	getVersionInfo : function() {
		if (this.checking) return "正在检查版本……";
		if (!this.latest) return "版本：" + CA.publishDate;
		if (Date.parse(CA.publishDate) < Date.parse(this.latest)) {
			return "更新：" + CA.publishDate + " -> " + this.latest;
		} else {
			return "您使用的是最新版本";
		}
	},
	checkUpdate : function(callback) {
		if (this.checking) {
			Common.toast("正在检查更新中，请稍候");
			return false;
		}
		this.checking = true;
		if (callback) callback();
		var thread = new java.lang.Thread(new java.lang.Runnable({run : function() {try {
			Updater.getUpdateInfo(function(flag, date, message) {
				if (flag) {
					Common.showTextDialog(message.insert(0, G.Html.fromHtml("<b>命令助手更新啦！</b><br /><br />")));
				} else {
					Common.toast("当前已经是最新版本：" + date);
				}
				Updater.latest = date;
			});
			if (callback) callback();
			Updater.checking = false;
		} catch(e) {erp(e)}}}));
		thread.start();
	},
	latest : null,
	lastcheck : null,
	checking : false,
	url : "http://git.oschina.net/projectxero/ca/raw/master/update.json",
});

MapScript.loadModule("JSONEdit", {
	edit : null,
	pathbar : null,
	list : null,
	path : [],
	listItems : Object.keys,
	show : function(o) {
		var i;
		o = Object(o);
		var name = o.rootname ? o.rootname : "根";
		var data = o.source;
		if (data === null) {
			return false;
		}
		if (!(o.source instanceof Object)) {
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
					data : (data = data[o.path[i]]) instanceof Object ? data : {},
					pos : 0
				});
			}
		}
		this.showAll = Boolean(o.showAll);
		this.listItems = o.showAll ? Object.getOwnPropertyNames : Object.keys;
		this.updateListener = o.update ? function() {
			o.update();
		} : function() {};
		this.showEdit();
		this.refresh();
		return true;
	},
	create : function(callback, rootname) {
		this.showNewItem(function(data) {
			if (data instanceof Object) {
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
					Common.setClipboardText(MapScript.toSource(tag.data));
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
			/*self.main.setFocusable(true);
			self.main.setOnKeyListener(new G.View.OnKeyListener({onKey : function(v, code, e) {try {
				if (code == e.KEYCODE_BACK && JSONEdit.path.length > 1) {
					JSONEdit.path.pop();
					return true;
				}
				return false;
			} catch(e) {erp(e)}}}));*/
			
			self.header = new G.LinearLayout(ctx);
			self.header.setBackgroundColor(Common.theme.float_bgcolor);
			self.header.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
			self.header.setOrientation(G.LinearLayout.HORIZONTAL);
			if (G.style == "Material") self.header.setElevation(8 * G.dp);
			
			self.back = new G.TextView(ctx);
			self.back.setTextSize(Common.theme.textsize[2]);
			self.back.setTextColor(Common.theme.criticalcolor);
			self.back.setText("< 返回");
			self.back.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
			self.back.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			self.back.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
				JSONEdit.edit.dismiss();
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
			self.create.setText("╋    添加 / 粘贴 ...");
			self.create.setTextColor(Common.theme.textcolor);
			self.create.setTextSize(Common.theme.textsize[3]);
			self.create.setPadding(20 * G.dp, 20 * G.dp, 20 * G.dp, 20 * G.dp);
			self.create.setLayoutParams(G.AbsListView.LayoutParams(-1, -2));
			
			JSONEdit.list = new G.ListView(ctx);
			JSONEdit.list.setBackgroundColor(Common.theme.message_bgcolor);
			JSONEdit.list.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -1));
			JSONEdit.list.addHeaderView(self.create);
			JSONEdit.list.setOnItemClickListener(new G.AdapterView.OnItemClickListener({onItemClick : function(parent, view, pos, id) {try {
				if (view == self.create) {
					JSONEdit.showNewItem(function(newItem) {
						var data = JSONEdit.path[JSONEdit.path.length - 1].data;
						if (Array.isArray(data)) {
							data.push(newItem);
							JSONEdit.refresh();
						} else if (data instanceof Object) {
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
				if (data instanceof Object) {
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
			} catch(e) {erp(e)}}}));
			self.main.addView(JSONEdit.list);
		}
		JSONEdit.edit = new G.PopupWindow(self.main, -1, -1);
		if (CA.supportFloat) JSONEdit.edit.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		//JSONEdit.edit.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		JSONEdit.edit.setFocusable(true);
		JSONEdit.edit.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			JSONEdit.edit = null;
			if (JSONEdit.updateListener) JSONEdit.updateListener();
		} catch(e) {erp(e)}}}));
		JSONEdit.edit.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(JSONEdit.edit);
	} catch(e) {erp(e)}})},
	hideEdit : function() {G.ui(function() {try {
		if (JSONEdit.edit) JSONEdit.edit.dismiss();
		JSONEdit.edit = null;
	} catch(e) {erp(e)}})},
	showData : function(msg, data, callback) {G.ui(function() {try {
		var layout, title, text, ret, exit, popup;
		layout = new G.LinearLayout(ctx);
		layout.setBackgroundColor(Common.theme.message_bgcolor);
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
		title = new G.TextView(ctx);
		title.setTextSize(Common.theme.textsize[4]);
		title.setTextColor(Common.theme.textcolor);
		title.setText(msg);
		title.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -2));
		title.setPadding(0, 0, 0, 10 * G.dp);
		layout.addView(title);
		if (typeof data == "boolean") {
			ret = new G.CheckBox(ctx);
			ret.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 0));
			ret.getLayoutParams().setMargins(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp)
			ret.setChecked(data);
			ret.setText("True / False");
		} else {
			ret = new G.EditText(ctx);
			ret.setText(String(data));
			ret.setSingleLine(false);
			ret.setTextSize(Common.theme.textsize[2]);
			ret.setTextColor(Common.theme.textcolor);
			ret.setMinWidth(0.5 * Common.getScreenWidth());
			ret.setBackgroundColor(G.Color.TRANSPARENT);
			ret.setImeOptions(G.EditorInfo.IME_FLAG_NO_FULLSCREEN);
			ret.setLayoutParams(new G.LinearLayout.LayoutParams(-2, 0, 1.0));
			if (typeof data == "number") ret.setInputType(G.InputType.TYPE_CLASS_NUMBER | G.InputType.TYPE_NUMBER_FLAG_SIGNED | G.InputType.TYPE_NUMBER_FLAG_DECIMAL);
			ret.setSelection(ret.length());
			Common.postIME(ret);
		}
		layout.addView(ret);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("确定");
		exit.setTextSize(Common.theme.textsize[3]);
		exit.setGravity(G.Gravity.CENTER);
		exit.setTextColor(Common.theme.criticalcolor);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
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
			popup.dismiss();
			return true;
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		popup = Common.showDialog(layout, -2, -2);
	} catch(e) {erp(e)}})},
	showBatchEdit : function(data, callback) {G.ui(function() {try {
		var frame, layout, title, text, ret, exit, popup;
		layout = new G.LinearLayout(ctx);
		layout.setBackgroundColor(Common.theme.message_bgcolor);
		layout.setLayoutParams(new G.FrameLayout.LayoutParams(-1, -1, G.Gravity.CENTER));
		layout.setOrientation(G.LinearLayout.VERTICAL);
		layout.setPadding(15 * G.dp, 15 * G.dp, 15 * G.dp, 0);
		layout.setOnTouchListener(new G.View.OnTouchListener({onTouch : function touch(v, e) {try {
			return true;
		} catch(e) {erp(e)}}}));
		ret = new G.EditText(ctx);
		ret.setText(JSONEdit.showAll ? MapScript.toSource(data) : JSON.stringify(data, null, 4) || "<非法JSON>");
		ret.setSingleLine(false);
		ret.setTextSize(Common.theme.textsize[2]);
		ret.setTextColor(Common.theme.textcolor);
		ret.setBackgroundColor(G.Color.TRANSPARENT);
		ret.setGravity(G.Gravity.LEFT | G.Gravity.TOP);
		ret.setLayoutParams(new G.LinearLayout.LayoutParams(-1, 0, 1.0));
		layout.addView(ret);
		exit = new G.TextView(ctx);
		exit.setLayoutParams(new G.LinearLayout.LayoutParams(-1, -2));
		exit.setText("保存");
		exit.setTextSize(Common.theme.textsize[3]);
		exit.setGravity(G.Gravity.CENTER);
		exit.setTextColor(Common.theme.criticalcolor);
		exit.setPadding(10 * G.dp, 20 * G.dp, 10 * G.dp, 20 * G.dp);
		exit.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			var t;
			if (callback) {
				try {
					callback(JSON.parse(ret.getText()));
					popup.dismiss();
				} catch(e) {
					Common.toast("解析JSON出错\n" + e);
				}
			}
			return true;
		} catch(e) {erp(e)}}}));
		layout.addView(exit);
		popup = new G.PopupWindow(layout, -1, -1);
		if (CA.supportFloat) popup.setWindowLayoutType(G.WindowManager.LayoutParams.TYPE_PHONE);
		popup.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		popup.setFocusable(true);
		popup.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
		PWM.add(popup);
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
		Common.showOperateDialog(Array.isArray(cd) ? self.arrMenu : cd instanceof Object ? self.objMenu : obj.menu, {
			name : name,
			src : cd,
			data : cd[name]
		});
	},
	pathClick : new G.View.OnClickListener({onClick : function(v) {try {
		var i = JSONEdit.pathbar.indexOfChild(v);
		JSONEdit.path.splice(i + 1);
		JSONEdit.refresh();
		return true;
	} catch(e) {erp(e)}}}),
	itemAdapter : function(e, i, a, par) {
		var hl, vl, name, data, more;
		hl = new G.LinearLayout(ctx);
		hl.setOrientation(G.LinearLayout.HORIZONTAL);
		hl.setLayoutParams(G.AbsListView.LayoutParams(-1, -2));
		hl.setPadding(20 * G.dp, 10 * G.dp, 20 * G.dp, 10 * G.dp);
		vl = new G.LinearLayout(ctx);
		vl.setOrientation(G.LinearLayout.VERTICAL);
		vl.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 1.0));
		vl.getLayoutParams().gravity = G.Gravity.CENTER;
		name = new G.TextView(ctx);
		name.setText(Array.isArray(par) && !JSONEdit.showAll ? "#" + (parseInt(e) + 1) : String(e));
		name.setEllipsize(G.TextUtils.TruncateAt.END);
		name.setTextColor(Common.theme.textcolor);
		name.setTextSize(Common.theme.textsize[3]);
		name.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
		vl.addView(name);
		data = new G.TextView(ctx);
		data.setText(JSONEdit.getDesp(par[e]));
		data.setMaxLines(2);
		data.setEllipsize(G.TextUtils.TruncateAt.END);
		data.setTextColor(Common.theme.promptcolor);
		data.setTextSize(Common.theme.textsize[1]);
		data.setLayoutParams(G.LinearLayout.LayoutParams(-1, -2));
		vl.addView(data);
		hl.addView(vl);
		more = new G.TextView(ctx);
		more.setText(">");
		more.setTextColor(Common.theme.promptcolor);
		more.setTextSize(Common.theme.textsize[4]);
		more.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
		more.setLayoutParams(G.LinearLayout.LayoutParams(-2, -2, 0));
		more.getLayoutParams().gravity = G.Gravity.CENTER;
		more.setOnClickListener(new G.View.OnClickListener({onClick : function(v) {try {
			JSONEdit.showItemAction(e);
			return true;
		} catch(e) {erp(e)}}}));
		hl.addView(more);
		return hl;
	},
	getDesp : function(o) {
		try {
			if (Array.isArray(o)) {
				return o.length ? o[0] + "等" + o.length + "个项目" : "0个项目";
			} else if (o instanceof Object) {
				return this.listItems(o).length + "个键值对";
			} else if (o === null) {
				return "空引用(null)";
			} else return String(o);
		} catch(e) {
			return "<未知的项目>";
		}
	},
	refresh : function() {G.ui(function() {try {
		var lbl, i, e, ci = JSONEdit.path[JSONEdit.path.length - 1], cd = ci.data;
		JSONEdit.pathbar.removeAllViews();
		for (i in JSONEdit.path) {
			e = JSONEdit.path[i];
			lbl = new G.TextView(ctx);
			lbl.setTextSize(Common.theme.textsize[2]);
			lbl.setTextColor(Common.theme.textcolor);
			lbl.setText(String(e.name));
			lbl.setLayoutParams(new G.LinearLayout.LayoutParams(-2, -1));
			lbl.setPadding(10 * G.dp, 10 * G.dp, 10 * G.dp, 10 * G.dp);
			lbl.setOnClickListener(JSONEdit.pathClick);
			JSONEdit.pathbar.addView(lbl);
		}
		JSONEdit.list.setAdapter(new RhinoListAdapter(JSONEdit.listItems(cd), JSONEdit.itemAdapter, cd));
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
	}
});

MapScript.loadModule("EasterEgg", {
	start : function self() {G.ui(function() {try {
		if (EasterEgg.view) return;
		if (!self.view) {
			self.view = new G.ImageView(ctx);
			self.view.setPadding(20 * G.dp, 20 * G.dp, 20 * G.dp, 20 * G.dp);
			self.view.setBackgroundColor(G.Color.TRANSPARENT);
			self.view.setImageBitmap(EasterEgg.getBitmap(G.screenHeight));
		}
		EasterEgg.view = new G.PopupWindow(self.view, -1, -1);
		EasterEgg.view.setBackgroundDrawable(new G.ColorDrawable(G.Color.TRANSPARENT));
		EasterEgg.view.setFocusable(true);
		EasterEgg.view.setOnDismissListener(new G.PopupWindow.OnDismissListener({onDismiss : function() {try {
			EasterEgg.view = null;
		} catch(e) {erp(e)}}}));
		var anis = new G.AnimationSet(true);
		var ani1 = new G.AlphaAnimation(0, 1);
		ani1.setDuration(200);
		var ani2 = new G.AlphaAnimation(1, 0);
		ani2.setDuration(200);
		ani2.setStartOffset(1800);
		ani2.setAnimationListener(new G.Animation.AnimationListener({
			onAnimationEnd : function(a) {
				EasterEgg.view.dismiss();
			}
		}));
		anis.setInterpolator(new G.LinearInterpolator());
		anis.addAnimation(ani1);
		anis.addAnimation(ani2);
		self.view.startAnimation(anis);
		EasterEgg.view.showAtLocation(ctx.getWindow().getDecorView(), G.Gravity.CENTER, 0, 0);
	} catch(e) {if (CA.DEBUG) erp(e)}})},
	getBitmap : function(w) {
		var bmp = G.Bitmap.createBitmap(w, w, G.Bitmap.Config.ARGB_8888);
		var cv = new G.Canvas(bmp);
		cv.scale(w / 17, w / 17);
		var pt = new G.Paint();
		pt.setShader(new G.BitmapShader(G.Bitmap.createScaledBitmap(G.BitmapFactory.decodeStream(ModPE.openInputStreamFromTexturePack("textures/blocks/command_block.png")), 16, 16, false), G.Shader.TileMode.REPEAT, G.Shader.TileMode.REPEAT));
		cv.drawRect(0, 0, 17, 17, pt);
		pt.setShader(null);
		pt.setTextSize(3);
		var fm = pt.getFontMetrics();
		var th = fm.bottom - fm.top;
		pt.setColor(G.Color.argb(0x80, 0, 0, 0));
		pt.setShadowLayer(0.1, 0, 0, pt.getColor());
		cv.drawRoundRect(0, 17 - th, 17, 18, 0.5, 0.5, pt);
		pt.setColor(G.Color.WHITE);
		pt.setShadowLayer(0.1, 0, 0, G.Color.BLACK);
		cv.drawText(" CA_", 0, 17 - fm.descent, pt);
		return bmp;
	}
});

"IGNORELN_START";
CA.IntelliSense.inner["default"] = {
	"name": "默认命令库",
	"author": "CA制作组",
	"description": "该命令库基于Minecraft PE 1.1.1.51 的命令，大部分由CA制作组成员ProjectXero整理。该命令库包含部分未来特性。",
	"uuid": "acf728c5-dd5d-4a38-b43d-7c4f18149fbd",
	"version": [0, 0, 1],
	"require": [],
	"minSupportVer": "0.16.0",
	"targetSupportVer": "1.2.0.2",
	"commands": {},
	"enums": {
		"block": {
			"acacia_door": "金合欢木门",
			"acacia_fence_gate": "金合欢栅栏门",
			"acacia_stairs": "金合欢木阶梯",
			"activator_rail": "激活铁轨",
			"air": "空气",
			"anvil": "铁砧",
			"beacon": "信标",
			"bed": "床",
			"bedrock": "基岩",
			"beetroot": "甜菜根",
			"birch_door": "白桦木门",
			"birch_fence_gate": "白桦木栅栏门",
			"birch_stairs": "桦木楼梯",
			"black_glazed_terracotta": "黑色带釉陶瓦",
			"blue_glazed_terracotta": "蓝色带釉陶瓦",
			"bone_block": "骨块",
			"bookshelf": "书架",
			"brewing_stand": "酿造台",
			"brick_block": "砖块",
			"brick_stairs": "砖块楼梯",
			"brown_glazed_terracotta": "棕色带釉陶瓦",
			"brown_mushroom": "棕色蘑菇",
			"brown_mushroom_block": "棕色蘑菇",
			"cactus": "仙人掌",
			"cake": "蛋糕",
			"carpet": "地毯",
			"carrots": "胡萝卜",
			"cauldron": "炼药锅",
			"chain_command_block": "连锁型命令方块",
			"chest": "箱子",
			"chorus_flower": "紫颂花",
			"chorus_plant": "紫颂植物",
			"clay": "粘土块",
			"coal_block": "煤炭块",
			"coal_ore": "煤矿石",
			"cobblestone": "圆石",
			"cobblestone_wall": "圆石墙",
			"cocoa": "可可果",
			"command_block": "命令方块",
			"concrete": "混凝土",
			"concretepowder": "黑色混凝土粉末/红色混凝土粉末/绿色混凝土粉末/棕色混凝土粉末/蓝色混凝土粉末/紫色混凝土粉末/青色混凝土粉末/淡灰色混凝土粉末/灰色混凝土粉末/粉红色混凝土粉末/黄绿色混凝土粉末/黄色混凝土粉末/淡蓝色混凝土粉末/品红色混凝土粉末/橙色混凝土粉末/白色混凝土粉末",
			"crafting_table": "工作台",
			"cyan_glazed_terracotta": "青色带釉陶瓦",
			"dark_oak_door": "深色橡木门",
			"dark_oak_fence_gate": "深色橡木栅栏门",
			"dark_oak_stairs": "深色橡木阶梯",
			"daylight_detector": "阳光传感器",
			"daylight_detector_inverted": "反向阳光传感器",
			"deadbush": "枯死的灌木",
			"detector_rail": "探测铁轨",
			"diamond_block": "钻石块",
			"diamond_ore": "钻石矿石",
			"dirt": "泥土",
			"dispenser": "发射器",
			"double_plant": "向日葵",
			"double_stone_slab": "双石台阶",
			"double_stone_slab2": "双红砂岩台阶",
			"double_wooden_slab": "",
			"dragon_egg": "龙蛋",
			"dropper": "投掷器",
			"emerald_block": "绿宝石块",
			"emerald_ore": "绿宝石矿石",
			"enchanting_table": "附魔台",
			"end_bricks": "末地石砖",
			"end_portal_frame": "末地传送门框架",
			"end_rod": "末地烛",
			"end_stone": "末地石",
			"ender_chest": "末影箱",
			"farmland": "耕地",
			"fence": "橡木栅栏",
			"fence_gate": "橡木栅栏门",
			"fire": "火",
			"flower_pot": "花盆",
			"flowing_lava": "熔岩",
			"flowing_water": "水",
			"frame": "物品展示框",
			"frosted_ice": "霜冰",
			"furnace": "熔炉",
			"glass": "玻璃",
			"glass_pane": "玻璃板",
			"glowingobsidian": "发光的黑曜石",
			"glowstone": "荧石",
			"gold_block": "金块",
			"gold_ore": "金矿石",
			"golden_rail": "充能铁轨",
			"grass": "草方块",
			"grass_path": "草径",
			"gravel": "沙砾",
			"gray_glazed_terracotta": "灰色带釉陶瓦",
			"green_glazed_terracotta": "绿色带釉陶瓦",
			"hardened_clay": "陶瓦",
			"hay_block": "干草块",
			"heavy_weighted_pressure_plate": "重质测重压力板",
			"hopper": "漏斗",
			"ice": "冰",
			"info_update": "数据更新方块（update!）",
			"info_update2": "数据更新方块（ate!upd）",
			"invisiblebedrock": "隐形基岩",
			"iron_bars": "铁栏杆",
			"iron_block": "铁块",
			"iron_door": "铁门",
			"iron_ore": "铁矿石",
			"iron_trapdoor": "铁活板门",
			"jukebox": "唱片机",
			"jungle_door": "丛林木门",
			"jungle_fence_gate": "丛林木栅栏门",
			"jungle_stairs": "丛林楼梯",
			"ladder": "梯子",
			"lapis_block": "青金石块",
			"lapis_ore": "青金石矿石",
			"lava": "静态熔岩",
			"leaves": "树叶",
			"leaves2": "金合欢树叶",
			"lever": "拉杆",
			"light_blue_glazed_terracotta": "淡蓝色带釉陶瓦",
			"light_weighted_pressure_plate": "轻质测重压力板",
			"lime_glazed_terracotta": "黄绿色带釉陶瓦",
			"lit_furnace": "燃烧的熔炉",
			"lit_pumpkin": "南瓜灯",
			"lit_redstone_lamp": "红石灯",
			"lit_redstone_ore": "红石矿石",
			"log": "木头",
			"log2": "金合欢木",
			"magenta_glazed_terracotta": "品红色带釉陶瓦",
			"magma": "岩浆块",
			"melon_block": "西瓜",
			"melon_stem": "西瓜梗",
			"mob_spawner": "刷怪箱",
			"monster_egg": "怪物蛋",
			"mossy_cobblestone": "苔石",
			"movingblock": "被活塞推动的方块",
			"mycelium": "菌丝",
			"nether_brick": "地狱砖块",
			"nether_brick_fence": "地狱砖栅栏",
			"nether_brick_stairs": "地狱砖楼梯",
			"nether_wart": "地狱疣",
			"nether_wart_block": "地狱疣块",
			"netherrack": "地狱岩",
			"netherreactor": "地狱反应核",
			"noteblock": "音符盒",
			"oak_stairs": "橡木楼梯",
			"observer": "侦测器",
			"obsidian": "黑曜石",
			"orange_glazed_terracotta": "橙色带釉陶瓦",
			"packed_ice": "浮冰",
			"pink_glazed_terracotta": "粉红色带釉陶瓦",
			"piston": "活塞",
			"pistonarmcollision": "活塞臂",
			"planks": "木板",
			"podzol": "灰化土",
			"portal": "下界传送门",
			"potatoes": "马铃薯",
			"powered_comparator": "红石比较器",
			"powered_repeater": "红石中继器",
			"prismarine": "海晶石",
			"pumpkin": "南瓜",
			"pumpkin_stem": "南瓜梗",
			"purple_glazed_terracotta": "紫色带釉陶瓦",
			"purpur_block": "紫珀块",
			"purpur_stairs": "紫珀块楼梯",
			"quartz_block": "石英块",
			"quartz_ore": "下界石英矿石",
			"quartz_stairs": "石英楼梯",
			"rail": "铁轨",
			"red_flower": "花",
			"red_glazed_terracotta": "红色带釉陶瓦",
			"red_mushroom": "红色蘑菇",
			"red_mushroom_block": "红色蘑菇",
			"red_nether_brick": "红色地狱砖",
			"red_sandstone": "红砂岩",
			"red_sandstone_stairs": "红砂岩楼梯",
			"redstone_block": "红石块",
			"redstone_lamp": "红石灯",
			"redstone_ore": "红石矿石",
			"redstone_torch": "红石火把",
			"redstone_wire": "红石线",
			"reeds": "甘蔗",
			"repeating_command_block": "循环型命令方块",
			"reserved6": "reserved6",
			"sand": "沙子",
			"sandstone": "砂岩",
			"sandstone_stairs": "砂岩楼梯",
			"sapling": "树苗",
			"sealantern": "海晶灯",
			"shulker_box": "潜影盒",
			"silver_glazed_terracotta": "淡灰色带釉陶瓦",
			"skull": "生物头颅",
			"slime": "粘液块",
			"snow": "雪块",
			"snow_layer": "顶层雪",
			"soul_sand": "灵魂沙",
			"sponge": "海绵",
			"spruce_door": "云杉木门",
			"spruce_fence_gate": "云杉木栅栏门",
			"spruce_stairs": "云杉楼梯",
			"stained_glass": "染色玻璃",
			"stained_glass_pane": "染色玻璃板",
			"stained_hardened_clay": "染色陶瓦",
			"standing_banner": "站立的旗帜",
			"standing_sign": "告示牌",
			"sticky_piston": "粘性活塞",
			"stone": "石头",
			"stone_brick_stairs": "石砖楼梯",
			"stone_button": "石质按钮",
			"stone_pressure_plate": "石质压力板",
			"stone_slab": "石台阶",
			"stone_slab2": "红沙石台阶/紫珀台阶",
			"stone_stairs": "圆石楼梯",
			"stonebrick": "石砖",
			"stonecutter": "切石机",
			"structure_block": "结构方块",
			"structure_void": "建筑空隙",
			"tallgrass": "草丛",
			"tnt": "TNT",
			"torch": "火把",
			"trapdoor": "活板门",
			"trapped_chest": "陷阱箱",
			"tripwire": "绊线",
			"tripwire_hook": "绊线钩",
			"undyed_shulker_box": "未染色的潜影盒",
			"unlit_redstone_torch": "红石火把",
			"unpowered_comparator": "红石比较器",
			"unpowered_repeater": "红石中继器",
			"vine": "藤蔓",
			"wall_banner": "墙上的旗帜",
			"wall_sign": "",
			"water": "静态水",
			"waterlily": "睡莲",
			"web": "蜘蛛网",
			"wheat": "小麦",
			"white_glazed_terracotta": "白色带釉陶瓦",
			"wooden_button": "木质按钮",
			"wooden_door": "木门",
			"wooden_pressure_plate": "木质压力板",
			"wooden_slab": "木台阶",
			"wool": "羊毛",
			"yellow_flower": "蒲公英",
			"yellow_glazed_terracotta": "黄色带釉陶瓦"
		},
		"item": {
			"acacia_door": "金合欢木门",
			"anvil": "",
			"apple": "苹果",
			"appleenchanted": "附魔金苹果",
			"arrow": "箭",
			"baked_potato": "烤马铃薯",
			"beacon": "",
			"bed": "床",
			"beef": "生牛肉",
			"beetroot": "甜菜根",
			"beetroot_seeds": "甜菜种子",
			"beetroot_soup": "甜菜汤",
			"birch_door": "白桦木门",
			"blaze_powder": "烈焰粉",
			"blaze_rod": "烈焰棒",
			"board": "",
			"boat": "船",
			"bone": "骨头",
			"book": "书",
			"bow": "弓",
			"bowl": "碗",
			"bread": "面包",
			"brewing_stand": "酿造台",
			"brick": "红砖",
			"bucket": "桶",
			"cake": "蛋糕",
			"camera": "相机",
			"carpet": "",
			"carrot": "胡萝卜",
			"carrotonastick": "萝卜钓竿",
			"cauldron": "炼药锅",
			"chainmail_boots": "链甲靴子",
			"chainmail_chestplate": "链甲胸甲",
			"chainmail_helmet": "链甲头盔",
			"chainmail_leggings": "链甲护腿",
			"chest_minecart": "运输矿车",
			"chicken": "生鸡肉",
			"chorus_fruit": "紫颂果",
			"chorus_fruit_popped": "爆裂紫颂果",
			"clay_ball": "粘土",
			"clock": "钟",
			"clownfish": "小丑鱼",
			"coal": "煤炭",
			"cobblestone_wall": "",
			"comparator": "红石比较器",
			"compass": "指南针",
			"cooked_beef": "牛排",
			"cooked_chicken": "熟鸡肉",
			"cooked_fish": "熟鱼",
			"cooked_porkchop": "熟猪排",
			"cooked_rabbit": "熟兔肉",
			"cooked_salmon": "熟鲑鱼",
			"cookie": "曲奇",
			"dark_oak_door": "深色橡木门",
			"diamond": "钻石",
			"diamond_axe": "钻石斧",
			"diamond_boots": "钻石靴子",
			"diamond_chestplate": "钻石胸甲",
			"diamond_helmet": "钻石头盔",
			"diamond_hoe": "钻石锄",
			"diamond_leggings": "钻石护腿",
			"diamond_pickaxe": "钻石镐",
			"diamond_shovel": "钻石锹",
			"diamond_sword": "钻石剑",
			"double_plant": "",
			"dragon_breath": "龙息",
			"dye": "染料",
			"egg": "鸡蛋",
			"elytra": "鞘翅",
			"emerald": "绿宝石",
			"emptymap": "空地图",
			"enchanted_book": "附魔书",
			"end_crystal": "末影水晶",
			"ender_eye": "末影之眼",
			"ender_pearl": "末影珍珠",
			"experience_bottle": "附魔之瓶",
			"feather": "羽毛",
			"fence": "",
			"fermented_spider_eye": "发酵蛛眼",
			"fireball": "火焰弹",
			"fish": "生鱼",
			"fishing_rod": "钓鱼竿",
			"flint": "燧石",
			"flint_and_steel": "打火石",
			"flower_pot": "花盆",
			"frame": "物品展示框",
			"ghast_tear": "恶魂之泪",
			"glass_bottle": "玻璃瓶",
			"glowstone_dust": "荧石粉",
			"gold_ingot": "金锭",
			"gold_nugget": "金粒",
			"golden_apple": "金苹果",
			"golden_axe": "金斧",
			"golden_boots": "金靴子",
			"golden_carrot": "金胡萝卜",
			"golden_chestplate": "金胸甲",
			"golden_helmet": "金头盔",
			"golden_hoe": "金锄",
			"golden_leggings": "金护腿",
			"golden_pickaxe": "金镐",
			"golden_shovel": "金锹",
			"golden_sword": "金剑",
			"gunpowder": "火药",
			"hopper": "漏斗",
			"hopper_minecart": "漏斗矿车",
			"horsearmordiamond": "钻石马铠",
			"horsearmorgold": "金马铠",
			"horsearmoriron": "铁马铠",
			"horsearmorleather": "皮革马铠",
			"iron_axe": "铁斧",
			"iron_boots": "铁靴子",
			"iron_chestplate": "铁胸甲",
			"iron_door": "铁门",
			"iron_helmet": "铁头盔",
			"iron_hoe": "铁锄",
			"iron_ingot": "铁锭",
			"iron_leggings": "铁护腿",
			"iron_pickaxe": "铁镐",
			"iron_shovel": "铁锹",
			"iron_sword": "铁剑",
			"jungle_door": "丛林木门",
			"lead": "拴绳",
			"leather": "皮革",
			"leather_boots": "皮革靴子",
			"leather_chestplate": "皮革上衣",
			"leather_helmet": "皮革帽子",
			"leather_leggings": "皮革裤子",
			"lingering_potion": "滞留药水",
			"magma_cream": "岩浆膏",
			"melon": "西瓜片",
			"melon_seeds": "西瓜种子",
			"minecart": "矿车",
			"minecartfurnace": "动力矿车",
			"mushroom_stew": "蘑菇煲",
			"muttoncooked": "熟羊肉",
			"muttonraw": "生羊肉",
			"nametag": "命名牌",
			"netherstar": "地狱之星",
			"nether_wart": "地狱疣",
			"netherbrick": "地狱砖块",
			"painting": "画",
			"paper": "纸",
			"poisonous_potato": "毒马铃薯",
			"porkchop": "生猪排",
			"portfolio": "公文包",
			"potato": "马铃薯",
			"potion": "药水",
			"prismarine_crystals": "海晶砂粒",
			"prismarine_shard": "海晶碎片",
			"pufferfish": "河豚",
			"pumpkin_pie": "南瓜派",
			"pumpkin_seeds": "南瓜种子",
			"quartz": "下界石英",
			"rabbit": "生兔肉",
			"rabbit_foot": "兔子脚",
			"rabbit_hide": "兔子皮",
			"rabbit_stew": "兔肉煲",
			"red_flower": "",
			"redstone": "红石粉",
			"reeds": "甘蔗",
			"repeater": "红石中继器",
			"rotten_flesh": "腐肉",
			"saddle": "鞍",
			"salmon": "生鲑鱼",
			"sapling": "",
			"shears": "剪刀",
			"sign": "告示牌",
			"skull": "生物头颅",
			"slime_ball": "粘液球",
			"snow_layer": "",
			"snowball": "雪球",
			"spawn_egg": "刷怪蛋",
			"speckled_melon": "闪烁的西瓜",
			"spider_eye": "蜘蛛眼",
			"splash_potion": "喷溅药水",
			"spruce_door": "云杉木门",
			"stick": "木棍",
			"stone_axe": "石斧",
			"stone_hoe": "石锄",
			"stone_pickaxe": "石镐",
			"stone_shovel": "石锹",
			"stone_sword": "石剑",
			"string": "线",
			"sugar": "糖",
			"tallgrass": "",
			"tnt_minecart": "TNT矿车",
			"waterlilly": "",
			"wheat": "小麦",
			"wheat_seeds": "种子",
			"wooden_axe": "木斧",
			"wooden_door": "木门",
			"wooden_hoe": "木锄",
			"wooden_pickaxe": "木镐",
			"wooden_shovel": "木锹",
			"wooden_sword": "木剑",
			"yellow_flower": ""
		},
		"sound": {
			"ambient.weather.thunder": "打雷声",
			"ambient.weather.lightning.impact": "",
			"ambient.weather.rain": "雨声",
			"block.false_permissions": "",
			"block.itemframe.add_item": "展示框放上物品声",
			"block.itemframe.break": "破坏展示框声",
			"block.itemframe.place": "放置展示框声",
			"block.itemframe.remove_item": "拿取展示框中的展示物品声",
			"block.itemframe.rotate_item": "转动展示框中的展示物品声",
			"block.chorusflower.death": "",
			"block.chorusflower.grow": "",
			"bucket.empty_lava": "",
			"bucket.empty_water": "",
			"bucket.fill_lava": "",
			"bucket.fill_water": "",
			"cauldron.explode": "炼药锅爆炸声",
			"cauldron.dyearmor": "炼药锅着色装备声",
			"cauldron.cleanarmor": "炼药锅洗清装备声",
			"cauldron.cleanbanner": "",
			"cauldron.fillpotion": "炼药锅放满药水声",
			"cauldron.takepotion": "炼药锅拿取药水声",
			"cauldron.fillwater": "炼药锅放满水声",
			"cauldron.takewater": "炼药锅拿取水声",
			"cauldron.adddye": "炼药锅染色水声",
			"damage.fallbig": "长高度落伤害声",
			"damage.fallsmall": "短高度掉落伤害",
			"elytra.loop": "",
			"game.player.attack.nodamage": "",
			"game.player.hurt": "玩家受伤声",
			"game.player.die": "玩家死亡声",
			"dig.cloth": "挖掘羊毛声",
			"dig.grass": "挖掘草地声",
			"dig.gravel": "挖掘沙砾声",
			"dig.sand": "挖掘沙子声",
			"dig.snow": "挖掘雪地声",
			"dig.stone": "挖掘石头声",
			"dig.wood": "挖掘木头声",
			"tile.piston.in": "活塞拉回声",
			"tile.piston.out": "活塞推出声",
			"fire.fire": "着火声",
			"fire.ignite": "点火声/点燃苦力怕声",
			"leashknot.break": "",
			"leashknot.place": "",
			"firework.blast": "",
			"firework.large_blast": "",
			"firework.launch": "",
			"firework.shoot": "",
			"firework.twinkle": "",
			"liquid.lava": "流动岩浆声",
			"liquid.lavapop": "流动岩浆产生声",
			"liquid.water": "流动水声",
			"minecart.base": "",
			"minecart.inside": "",
			"mob.armor_stand.break": "",
			"mob.armor_stand.hit": "",
			"mob.armor_stand.land": "",
			"mob.armor_stand.place": "",
			"mob.bat.death": "蝙蝠死亡声",
			"mob.bat.hurt": "蝙蝠受伤声",
			"mob.bat.idle": "蝙蝠叫声",
			"mob.bat.takeoff": "蝙蝠飞起声/降落声",
			"mob.blaze.breathe": "烈焰人叫声",
			"mob.blaze.death": "烈焰人死亡声",
			"mob.blaze.hit": "烈焰人受伤声",
			"mob.blaze.shoot": "",
			"mob.chicken.hurt": "鸡受伤声",
			"mob.chicken.plop": "鸡下蛋声",
			"mob.chicken.say": "鸡叫声",
			"mob.chicken.step": "鸡走路声",
			"mob.cow.hurt": "牛受伤声",
			"mob.cow.say": "牛叫声",
			"mob.cow.step": "牛走路声",
			"mob.cow.milk": "",
			"mob.creeper.death": "苦力怕死亡声",
			"mob.creeper.say": "苦力怕叫/受伤声",
			"mob.endermen.death": "末影人死亡声",
			"mob.endermen.hit": "末影人受伤声",
			"mob.endermen.idle": "末影人叫声",
			"mob.endermen.portal": "末影人传送声",
			"mob.endermen.scream": "末影人愤怒声",
			"mob.endermen.stare": "末影人激怒声",
			"mob.enderdragon.death": "",
			"mob.enderdragon.hit": "",
			"mob.enderdragon.flap": "",
			"mob.enderdragon.growl": "",
			"mob.ghast.affectionate_scream": "恶魂深情的呐喊声",
			"mob.ghast.charge": "恶魂将要发射火球声",
			"mob.ghast.death": "恶魂死亡声",
			"mob.ghast.fireball": "恶魂/发射器/烈焰人发射火球声",
			"mob.ghast.moan": "恶魂叫声",
			"mob.ghast.scream": "恶魂受伤声",
			"mob.guardian.ambient": "",
			"mob.guardian.attack_loop": "",
			"mob.elderguardian.curse": "",
			"mob.elderguardian.death": "",
			"mob.elderguardian.hit": "",
			"mob.elderguardian.idle": "",
			"mob.guardian.flop": "",
			"mob.guardian.death": "",
			"mob.guardian.hit": "",
			"mob.guardian.land_death": "",
			"mob.guardian.land_hit": "",
			"mob.guardian.land_idle": "",
			"mob.llama.angry": "",
			"mob.llama.death": "",
			"mob.llama.idle": "",
			"mob.llama.spit": "",
			"mob.llama.hurt": "",
			"mob.llama.eat": "",
			"mob.llama.step": "",
			"mob.llama.swag": "",
			"mob.horse.angry": "马生气声",
			"mob.horse.armor": "替马上装备声",
			"mob.horse.breathe": "马跑声",
			"mob.horse.death": "马死亡声",
			"mob.horse.donkey.angry": "驴生气/被马摔下声",
			"mob.horse.donkey.death": "驴死亡声",
			"mob.horse.donkey.hit": "驴受伤声",
			"mob.horse.donkey.idle": "驴叫声",
			"mob.horse.eat": "",
			"mob.horse.gallop": "马飞奔声",
			"mob.horse.hit": "马受伤声",
			"mob.horse.idle": "马叫声",
			"mob.horse.jump": "马跳跃声",
			"mob.horse.land": "马落地声",
			"mob.horse.leather": "马/猪上鞍声",
			"mob.horse.skeleton.death": "骷髅马死亡声",
			"mob.horse.skeleton.hit": "骷髅马受伤声",
			"mob.horse.skeleton.idle": "骷髅马叫声",
			"mob.horse.soft": "未驯服的马走路声",
			"mob.horse.wood": "马被玩家骑乘声",
			"mob.horse.zombie.death": "僵尸马死亡声",
			"mob.horse.zombie.hit": "僵尸马受伤声",
			"mob.horse.zombie.idle": "僵尸马叫声",
			"mob.husk.ambient": "",
			"mob.husk.death": "",
			"mob.husk.hurt": "",
			"mob.husk.step": "",
			"mob.irongolem.throw": "铁傀儡攻击声",
			"mob.irongolem.death": "铁傀儡死亡声",
			"mob.irongolem.hit": "铁傀儡受伤声",
			"mob.irongolem.walk": "铁傀儡走路声",
			"mob.shulker.ambient": "",
			"mob.shulker.close": "",
			"mob.shulker.death": "",
			"mob.shulker.close.hurt": "",
			"mob.shulker.hurt": "",
			"mob.shulker.open": "",
			"mob.shulker.shoot": "",
			"mob.shulker.teleport": "",
			"mob.shulker.bullet.hit": "",
			"mob.magmacube.big": "大地狱史莱姆死亡声",
			"mob.magmacube.jump": "地狱史莱姆跳动声",
			"mob.magmacube.small": "小地狱史莱姆声死亡声",
			"mob.parrot.idle": "",
			"mob.parrot.hurt": "",
			"mob.parrot.death": "",
			"mob.parrot.step": "",
			"mob.parrot.eat": "",
			"mob.parrot.fly": "",
			"mob.pig.death": "猪死亡声",
			"mob.pig.boost": "猪加速声",
			"mob.pig.say": "猪叫声",
			"mob.pig.step": "猪走路声",
			"mob.rabbit.hurt": "兔受伤声",
			"mob.rabbit.idle": "兔叫声",
			"mob.rabbit.hop": "兔跳跃声",
			"mob.rabbit.death": "兔死亡声",
			"mob.sheep.say": "羊叫声",
			"mob.sheep.shear": "羊剪毛声",
			"mob.sheep.step": "羊走路声",
			"mob.silverfish.hit": "蠹虫受伤声",
			"mob.silverfish.kill": "蠹虫攻击声",
			"mob.silverfish.say": "蠹虫叫声",
			"mob.silverfish.step": "蠹虫走路声",
			"mob.endermite.hit": "",
			"mob.endermite.kill": "",
			"mob.endermite.say": "",
			"mob.endermite.step": "",
			"mob.skeleton.death": "骷髅死亡声",
			"mob.skeleton.hurt": "骷髅受伤声",
			"mob.skeleton.say": "骷髅叫声",
			"mob.skeleton.step": "骷髅走路声",
			"mob.slime.big": "大史莱姆受伤/跳跃/死亡声",
			"mob.slime.small": "小史莱姆受伤/跳跃/死亡声",
			"mob.slime.attack": "",
			"mob.slime.death": "",
			"mob.slime.hurt": "",
			"mob.slime.jump": "",
			"mob.slime.squish": "",
			"mob.snowgolem.death": "",
			"mob.snowgolem.hurt": "",
			"mob.snowgolem.shoot": "",
			"mob.spider.death": "蜘蛛死亡声",
			"mob.spider.say": "蜘蛛叫声",
			"mob.spider.step": "蜘蛛走路声",
			"mob.squid.ambient": "",
			"mob.squid.death": "",
			"mob.squid.hurt": "",
			"mob.stray.ambient": "",
			"mob.stray.death": "",
			"mob.stray.hurt": "",
			"mob.stray.step": "",
			"mob.villager.death": "村民死亡声",
			"mob.villager.haggle": "",
			"mob.villager.hit": "村民受伤声",
			"mob.villager.idle": "村民叫声",
			"mob.villager.no": "",
			"mob.villager.yes": "",
			"mob.vindicator.death": "",
			"mob.vindicator.hurt": "",
			"mob.vindicator.idle": "",
			"mob.evocation_fangs.attack": "",
			"mob.evocation_illager.ambient": "",
			"mob.evocation_illager.cast_spell": "",
			"mob.evocation_illager.death": "",
			"mob.evocation_illager.hurt": "",
			"mob.evocation_illager.prepare_attack": "",
			"mob.evocation_illager.prepare_summon": "",
			"mob.evocation_illager.prepare_wololo": "",
			"mob.vex.ambient": "",
			"mob.vex.death": "",
			"mob.vex.hurt": "",
			"mob.vex.charge": "",
			"mob.witch.ambient": "女巫讥笑声",
			"mob.witch.death": "女巫死亡声",
			"mob.witch.hurt": "女巫受伤声",
			"mob.witch.drink": "女巫喝药水声",
			"mob.witch.throw": "女巫丢掷药水声",
			"mob.wither.ambient": "",
			"mob.wither.break_block": "",
			"mob.wither.death": "",
			"mob.wither.hurt": "",
			"mob.wither.shoot": "",
			"mob.wither.spawn": "",
			"mob.wolf.bark": "狼叫声",
			"mob.wolf.death": "狼死亡声",
			"mob.wolf.growl": "狼嘶吼声",
			"mob.wolf.hurt": "狼受伤声",
			"mob.wolf.panting": "平静的狼气喘声",
			"mob.wolf.shake": "狼抖干身体声",
			"mob.wolf.step": "狼走路声",
			"mob.wolf.whine": "血量低的狼气喘声",
			"mob.cat.hiss": "猫嘶声",
			"mob.cat.hit": "猫受伤声",
			"mob.cat.meow": "猫叫声",
			"mob.cat.purr": "猫驯服声",
			"mob.cat.purreow": "被驯服的猫叫声",
			"mob.polarbear_baby.idle": "",
			"mob.polarbear.idle": "",
			"mob.polarbear.step": "",
			"mob.polarbear.warning": "",
			"mob.polarbear.hurt": "",
			"mob.polarbear.death": "",
			"mob.zombie.death": "僵尸死亡声",
			"mob.zombie.hurt": "僵尸受伤声",
			"mob.zombie.remedy": "喂食虚弱僵尸村民金苹果声",
			"mob.zombie.unfect": "僵尸村民解除感染声",
			"mob.zombie.say": "僵尸叫声",
			"mob.zombie.step": "僵尸走路声",
			"mob.zombie.wood": "僵尸撞门声",
			"mob.zombie.woodbreak": "僵尸破门声",
			"mob.zombiepig.zpig": "僵尸猪人叫声",
			"mob.zombiepig.zpigangry": "僵尸猪人生气声",
			"mob.zombiepig.zpigdeath": "僵尸猪人死亡声",
			"mob.zombiepig.zpighurt": "僵尸猪人受伤声",
			"mob.zombie_villager.say": "",
			"mob.zombie_villager.death": "",
			"mob.zombie_villager.hurt": "",
			"note.bass": "音符盒低音声",
			"note.bassattack": "音符盒木质音调声",
			"note.bd": "音符盒石质音调声",
			"note.harp": "音符盒竖琴声",
			"note.hat": "音符盒玻璃质音调声",
			"note.pling": "音符盒未知声(未确认)",
			"note.snare": "音符盒沙质音调声",
			"portal.portal": "地狱传送门噪音声",
			"portal.trigger": "地狱传送门方块穿过/传送/离开声",
			"random.anvil_break": "随机铁砧破坏声",
			"random.anvil_land": "随机铁砧放置声",
			"random.anvil_use": "随机铁砧使用声",
			"random.bow": "随机实体抛掷/发射声",
			"random.bowhit": "随机箭射中方块或实体/随机剪刀剪掉绊线/随机激活的绊线钩破坏声",
			"random.break": "随机玩家工具坏掉声",
			"random.burp": "随机玩家喝完或吃完声",
			"random.chestclosed": "随机关闭箱子声",
			"random.chestopen": "随机打开箱子声",
			"random.shulkerboxclosed": "",
			"random.shulkerboxopen": "",
			"random.click": "随机按纽状态更新/投掷器或发射器或红石中继器激活/两个绊线钩连接声",
			"random.door_close": "随机关门声",
			"random.door_open": "随机开门声",
			"random.drink": "随机持续喝东西声",
			"random.eat": "随机持续吃东西声",
			"random.explode": "随机爆炸声",
			"random.fizz": "随机火扑灭/物品或经验球被烧毁/岩浆被水扑灭变成黑曜石/岩浆摧毁非固体方块/红石火把破坏声",
			"random.fuse": "随机炼制声(未确认)",
			"random.glass": "随机玻璃声(未确认)",
			"random.levelup": "随机升级声",
			"random.orb": "随机获得经验声",
			"random.pop": "随机捡起物品声",
			"random.pop2": "随机捡起未知声(未确认)",
			"random.splash": "随机捕鱼声",
			"random.swim": "随机游泳声",
			"random.hurt": "随机受伤声",
			"random.toast": "随机提示栏声",
			"random.totem": "",
			"camera.take_picture": "照相机拍照声",
			"step.ladder": "梯子攀爬声",
			"step.cloth": "羊毛行走声",
			"step.grass": "草地行走声",
			"step.gravel": "沙砾行走声",
			"step.sand": "沙子行走声",
			"step.slime": "史莱姆方块行走声",
			"step.snow": "雪地行走声",
			"step.stone": "石头行走声",
			"step.wood": "木头行走声",
			"jump.cloth": "跳动羊毛声",
			"jump.grass": "跳动草地声",
			"jump.gravel": "跳动沙砾声",
			"jump.sand": "跳动沙子声",
			"jump.snow": "跳动雪地声",
			"jump.stone": "跳动石头声",
			"jump.wood": "跳动木头声",
			"jump.slime": "",
			"vr.stutterturn": "虚拟现实未知声(未确认)",
			"record.13": "",
			"record.cat": "",
			"record.blocks": "",
			"record.chirp": "",
			"record.far": "",
			"record.mall": "",
			"record.mellohi": "",
			"record.stal": "",
			"record.strad": "",
			"record.ward": "",
			"record.11": "",
			"record.wait": "",
			"music.menu": "主界面背景",
			"music.game": "生存模式背景音乐",
			"music.game.creative": "创造模式背景音乐",
			"music.game.end": "",
			"music.game.endboss": "",
			"music.game.nether": "地狱世界背景音乐",
			"music.game.credits": ""
		},
		"entity": {
			"area_effect_cloud": "效果区域云",
			"armor_stand": "盔甲架",
			"arrow": "射出的箭",
			"bat": "蝙蝠",
			"blaze": "烈焰人",
			"boat": "船",
			"cave_spider": "洞穴蜘蛛",
			"chest_minecart": "运输矿车",
			"chicken": "鸡",
			"commandblock_minecart": "命令方块矿车",
			"cow": "牛",
			"creeper": "爬行者",
			"donkey": "驴",
			"dragon_fireball": "末影龙火球",
			"egg": "丢出的鸡蛋",
			"elder_guardian": "远古守卫者",
			"ender_crystal": "末影水晶",
			"ender_dragon": "末影龙",
			"ender_pearl": "丢出的末影珍珠",
			"enderman": "末影人",
			"endermite": "末影螨",
			"evocation_fangs": "尖牙",
			"evocation_illager": "唤魔者",
			"eye_of_ender_signal": "丢出的末影之眼",
			"falling_block": "掉落中的方块",
			"fireball": "火球",
			"fireworks_rocket": "烟花火箭",
			"furnace_minecart": "动力矿车",
			"ghast": "恶魂",
			"guardian": "守卫者",
			"hopper_minecart": "漏斗矿车",
			"horse": "马",
			"husk": "尸壳",
			"item": "掉落的物品",
			"leash_knot": "拴绳结",
			"lightning_bolt": "闪电",
			"llama": "羊驼",
			"llama_spit": "羊驼唾沫",
			"magma_cube": "岩浆怪",
			"minecart": "矿车",
			"mooshroom": "哞菇",
			"mule": "骡",
			"ocelot": "豹猫",
			"painting": "画",
			"parrot": "鹦鹉",
			"pig": "猪",
			"player": "玩家",
			"polar_bear": "北极熊",
			"rabbit": "兔子",
			"sheep": "羊",
			"shulker": "潜影贝",
			"shulker_bullet": "潜影贝导弹",
			"silverfish": "蠹虫",
			"skeleton": "骷髅",
			"skeleton_horse": "骷髅马",
			"slime": "史莱姆",
			"small_fireball": "烈焰人火球/射出的火球",
			"snowball": "丢出的雪球",
			"snowman": "雪傀儡",
			"spider": "蜘蛛",
			"splash_potion": "丢出的喷溅药水",
			"squid": "鱿鱼",
			"stray": "流髑",
			"tnt": "已激活的TNT",
			"tnt_minecart": "TNT矿车",
			"vex": "恼鬼",
			"villager": "村民",
			"villager_golem": "铁傀儡",
			"vindication_illager": "卫道士",
			"witch": "女巫",
			"wither": "凋灵",
			"wither_skeleton": "凋灵骷髅",
			"wither_skull": "凋灵之首",
			"wolf": "狼",
			"xp_bottle": "丢出的附魔之瓶",
			"xp_orb": "经验球",
			"zombie": "僵尸",
			"zombie_horse": "僵尸马",
			"zombie_pigman": "僵尸猪人",
			"zombie_villager": "僵尸村民"
		},
		"effect": {
			"speed": "速度",
			"slowness": "缓慢",
			"haste": "急迫",
			"mining_fatigue": "挖掘疲劳",
			"strength": "力量",
			"instant_health": "瞬间治疗",
			"instant_damage": "瞬间伤害",
			"jump_boost": "跳跃提升",
			"nausea": "反胃",
			"regeneration": "生命回复",
			"resistance": "抗性提升",
			"fire_resistance": "防火",
			"water_breathing": "水下呼吸",
			"invisibility": "隐身",
			"blindness": "失明",
			"night_vision": "夜视",
			"hunger": "饥饿",
			"weakness": "虚弱",
			"poison": "中毒",
			"wither": "凋零",
			"health_boost": "生命提升",
			"absorption": "伤害吸收",
			"saturation": "饱和",
			"glowing": "发光",
			"levitation": "飘浮"
		},
		"enchant_type": {
			"protection": "保护",
			"fire_protection": "火焰保护",
			"feather_falling": "摔落保护",
			"blast_protection": "爆炸保护",
			"projectile_protection": "弹射物保护",
			"respiration": "水下呼吸",
			"aqua_affinity": "水下速掘",
			"thorns": "荆棘",
			"depth_strider": "深海探索者",
			"frost_walker": "冰霜行者",
			"sharpness": "锋利",
			"smite": "亡灵杀手",
			"bane_of_arthropods": "节肢杀手",
			"knockback": "击退",
			"fire_aspect": "火焰附加",
			"looting": "抢夺",
			"efficiency": "效率",
			"silk_touch": "精准采集",
			"durability": "耐久",
			"fortune": "时运",
			"power": "力量",
			"punch": "冲击",
			"flame": "火矢",
			"infinity": "无限",
			"luck_of_the_sea": "海之眷顾",
			"lure": "饵钓",
			"mending": "经验修补"
		},
		"gamerule_string": {},
		"gamerule_int": {},
		"gamerule_bool": {
			"commandblockoutput": "命令执行时是否在控制台进行文本提示",
			"drowningdamage": "是否启用溺水伤害",
			"falldamage": "是否启用掉落伤害",
			"firedamage": "是否启用燃烧伤害",
			"pvp": "是否允许玩家互相攻击",
			"sendcommandfeedback": "聊天栏是否会显示被一个玩家执行一些特殊命令的提示",
			"dofiretick": "火是否传播及自然熄灭",
			"domobspawning": "生物是否自然生成",
			"dotiledrops": "方块被破坏时是否掉落物品",
			"mobgriefing": "生物是否能改变、破坏方块及捡拾物品",
			"doentitydrops": "非生物实体是否掉落物品",
			"keepinventory": "玩家死亡后是否对物品栏和经验进行保存",
			"domobloot": "生物是否掉落物品",
			"dodaylightcycle": "日夜交替效果是否启用",
			"doweathercycle": "天气是否变化",
			"naturalregeneration": "玩家能否在饥饿值足够时自然恢复生命值",
			"tntexplodes": "TNT能否爆炸"
		},
		"particle": {},
		"difficulty": {
			"peaceful": "和平",
			"easy": "简单",
			"normal": "普通",
			"hard": "困难",
			"p": "",
			"e": "",
			"n": "",
			"h": "",
			"0": "",
			"1": "",
			"2": "",
			"3": ""
		},
		"gamemode": {
			"survival": "生存模式",
			"creative": "创造模式",
			"adventure": "冒险模式",
			"spectator": "旁观模式",
			"s": "",
			"c": "",
			"a": "",
			"sp": "",
			"0": "",
			"1": "",
			"2": "",
			"3": ""
		},
		"bool": {
			"true": "是",
			"false": "否"
		},
		"select_all_enabled": {
			"*": "选择全部"
		}
	},
	"selectors": {
		"x": {
			"type": "relative",
			"name": "x坐标"
		},
		"y": {
			"type": "relative",
			"name": "y坐标"
		},
		"z": {
			"type": "relative",
			"name": "z坐标"
		},
		"r": {
			"type": "float",
			"name": "最大半径"
		},
		"rm": {
			"type": "float",
			"name": "最小半径"
		},
		"m": {
			"type": "enum",
			"name": "游戏模式",
			"list": "gamemode",
			"hasInverted": true
		},
		"c": {
			"type": "int",
			"name": "数量"
		},
		"l": {
			"type": "int",
			"name": "最大经验等级"
		},
		"lm": {
			"type": "int",
			"name": "最小经验等级"
		},
		"name": {
			"type": "string",
			"name": "名称",
			"hasInverted": true
		},
		"dx": {
			"type": "float",
			"name": "x轴方向长度"
		},
		"dy": {
			"type": "float",
			"name": "y轴方向长度"
		},
		"dz": {
			"type": "float",
			"name": "z轴方向长度"
		},
		"rx": {
			"type": "float",
			"name": "最大垂直旋转角度"
		},
		"rxm": {
			"type": "float",
			"name": "最小垂直旋转角度"
		},
		"ry": {
			"type": "float",
			"name": "最大水平旋转角度"
		},
		"rym": {
			"type": "float",
			"name": "最小水平旋转角度"
		},
		"type": {
			"type": "string",
			"name": "实体类型",
			"suggestion": "entity",
			"hasInverted": true
		}
	},
	"help": {
		"command": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4",
		"tilder": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#.E6.B3.A2.E6.B5.AA.E5.8F.B7",
		"selector": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#.E7.9B.AE.E6.A0.87.E9.80.89.E6.8B.A9.E5.99.A8",
		"nbt": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#.E6.95.B0.E6.8D.AE.E6.A0.87.E7.AD.BE",
		"rawjson": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#.E5.8E.9F.E5.A7.8BJSON.E6.96.87.E6.9C.AC"
	},
	"versionPack": {
		"base": {
			"minSupportVer": "0.7.4",
			"enums": {
				"item": "block"
			}
		},
		"0.16.0": {
			"commands": {
				"clone": {
					"description": "在区域间复制方块结构",
					"patterns": {
						"default": {
							"description": "将起点与终点指定的长方体区域内的方块结构复制到目标点",
							"params": [
								{
									"type": "position",
									"name": "起点"
								},
								{
									"type": "position",
									"name": "终点"
								},
								{
									"type": "position",
									"name": "目标点"
								},
								{
									"type": "enum",
									"name": "遮罩模式",
									"list": {
										"masked": "仅复制非空气方块，会保持目的区域中原本会被替换为空气的方块不变",
										"replace": "[默认]复制所有方块，用源区域的方块覆盖整个目标区域"
									},
									"optional": true
								},
								{
									"type": "enum",
									"name": "复制模式",
									"list": {
										"force": "强制复制，即使源区域与目标区域有重叠",
										"move": "将源区域复制到目标区域，并将源区域替换为空气（在filtered遮罩模式下，只有被复制的方块才会被替换为空气）",
										"normal": "[默认]不执行force与move"
									},
									"optional": true
								}
							]
						},
						"filtered": {
							"description": "将起点与终点指定的长方体区域内的方块结构过滤并复制到目标点",
							"params": [
								{
									"type": "position",
									"name": "起点"
								},
								{
									"type": "position",
									"name": "终点"
								},
								{
									"type": "position",
									"name": "目标点"
								},
								{
									"type": "plain",
									"name": "filtered",
									"prompt": "仅复制方块ID符合方块名定义的方块"
								},
								{
									"type": "enum",
									"name": "复制模式",
									"list": {
										"force": "强制复制，即使源区域与目标区域有重叠",
										"move": "将源区域复制到目标区域，并将源区域替换为空气（在filtered遮罩模式下，只有被复制的方块才会被替换为空气）",
										"normal": "[默认]不执行force与move"
									}
								},
								{
									"type": "string",
									"name": "方块ID",
									"suggestion": "block"
								},
								{
									"type": "int",
									"name": "数据值",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#clone"
				},
				"execute": {
					"description": "让某一实体在某一位置执行一条命令",
					"patterns": {
						"default": {
							"description": "让目标实体在指定坐标执行一条命令",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "entity"
								},
								{
									"type": "position",
									"name": "坐标"
								},
								{
									"type": "command",
									"name": "命令"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#execute"
				},
				"fill": {
					"description": "用特定方块全部或部分填充一个区域",
					"patterns": {
						"default": {
							"description": "按指定模式在点A与点B指定的长方体区域填充方块",
							"params": [
								{
									"type": "position",
									"name": "点A"
								},
								{
									"type": "position",
									"name": "点B"
								},
								{
									"type": "string",
									"name": "方块ID",
									"suggestion": "block"
								},
								{
									"type": "int",
									"name": "数据值",
									"optional": true
								},
								{
									"type": "enum",
									"name": "旧方块处理方式",
									"list": {
										"destroy": "用指定方块替换填充区域内所有方块(包括空气),以实体掉落被替换的方块及方块内容物就像它们被采掘了",
										"hollow": "仅用指定方块替换填充区域外层的方块。内部方块被改变为空气，以实体掉落它们的内容物但本身不掉落",
										"keep": "仅用指定方块替换填充区域内的空气方块",
										"outline": "仅用指定方块替换填充区域外层的方块。内部方块不被影响",
										"replace": "[默认]用指定方块替换填充区域内所有方块（包括空气）或指定方块，而不以实体形式掉落被替换的方块和方块内容物。"
									},
									"optional": true
								}
							]
						},
						"replace": {
							"description": "替换在点A与点B指定的长方体区域的指定方块",
							"params": [
								{
									"type": "position",
									"name": "点A"
								},
								{
									"type": "position",
									"name": "点B"
								},
								{
									"type": "string",
									"name": "方块ID",
									"suggestion": "block"
								},
								{
									"type": "int",
									"name": "数据值"
								},
								{
									"type": "plain",
									"name": "replace",
									"prompt": "[默认]用指定方块替换填充区域内所有方块（包括空气）或指定方块，而不以实体形式掉落被替换的方块和方块内容物。"
								},
								{
									"type": "string",
									"name": "被替换方块ID",
									"suggestion": "block"
								},
								{
									"type": "int",
									"name": "被替换方块数据值",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#fill"
				},
				"gamemode": {
					"description": "设置某个玩家的游戏模式",
					"patterns": {
						"current": {
							"description": "设置当前玩家的游戏模式",
							"params": [
								{
									"type": "enum",
									"name": "模式",
									"list": "gamemode"
								}
							]
						},
						"default": {
							"description": "设置指定玩家的游戏模式",
							"params": [
								{
									"type": "enum",
									"name": "模式",
									"list": "gamemode"
								},
								{
									"type": "selector",
									"name": "玩家",
									"target": "player"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#gamemode"
				},
				"give": {
					"description": "给一位玩家一种物品",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "string",
									"name": "物品ID",
									"suggestion": "item"
								},
								{
									"type": "uint",
									"name": "数量",
									"optional": true
								},
								{
									"type": "uint",
									"name": "数据值",
									"optional": true
								},
								{
									"type": "json",
									"name": "数据标签",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#give"
				},
				"help": {
					"description": "显示帮助",
					"content": "help",
					"noparams": {}
				},
				"kill": {
					"description": "清除/杀死实体",
					"noparams": {
						"description": "自杀"
					},
					"patterns": {
						"default": {
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "entity"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#kill"
				},
				"msg": {
					"alias": "tell"
				},
				"say": {
					"description": "向所有在线玩家发送信息",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "text",
									"name": "信息"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#say"
				},
				"setblock": {
					"description": "将一个方块更改为另一个方块",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "position",
									"name": "坐标"
								},
								{
									"type": "string",
									"name": "方块ID",
									"suggestion": "block"
								},
								{
									"type": "int",
									"name": "数据值",
									"optional": true
								},
								{
									"type": "enum",
									"name": "旧方块处理方式",
									"list": {
										"destroy": "旧方块掉落本身与其内容物，播放方块碎裂的声音，并显示破坏方块的粒子",
										"keep": "只有空气方块会被改变，非空气方块将被保留不变",
										"replace": "[默认]旧方块不掉落本身与其内容物，没有声音，没有粒子，直接变为新方块"
									},
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#setblock"
				},
				"setworldspawn": {
					"description": "设置世界出生点",
					"noparams": {
						"description": "设置当前位置为世界出生点"
					},
					"patterns": {
						"default": {
							"params": [
								{
									"type": "position",
									"name": "坐标"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#setworldspawn"
				},
				"spawnpoint": {
					"description": "为特定玩家设置出生点",
					"noparams": {
						"description": "设置当前玩家出生点为当前位置"
					},
					"patterns": {
						"current": {
							"description": "设置指定玩家出生点为该玩家当前位置",
							"params": [
								{
									"type": "selector",
									"name": "目标"
								}
							]
						},
						"default": {
							"description": "设置指定玩家出生点为指定位置",
							"params": [
								{
									"type": "selector",
									"name": "目标"
								},
								{
									"type": "position",
									"name": "坐标"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#spawnpoint"
				},
				"summon": {
					"description": "生成一个实体",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "string",
									"name": "实体ID",
									"suggestion": "entity"
								},
								{
									"type": "position",
									"name": "生成位置",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#summon"
				},
				"tell": {
					"description": "发送一条私密信息给一个或多个玩家",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "text",
									"name": "私密信息"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#tell"
				},
				"testforblock": {
					"description": "探测某个方块是否在特定位置",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "position",
									"name": "坐标"
								},
								{
									"type": "string",
									"name": "方块ID",
									"suggestion": "block"
								},
								{
									"type": "int",
									"name": "数据值",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#testforblock"
				},
				"testforblocks": {
					"description": "测试两个区域的方块是否相同",
					"patterns": {
						"default": {
							"description": "将起点与终点指定的长方体区域内的方块结构与对应目标点的方块结构（除NBT）进行比较",
							"params": [
								{
									"type": "position",
									"name": "起点"
								},
								{
									"type": "position",
									"name": "终点"
								},
								{
									"type": "position",
									"name": "目标点"
								},
								{
									"type": "enum",
									"name": "模式",
									"list": {
										"masked": "不检测空气方块：当一个区域的某个坐标格为空气方块，另一区域的相对坐标格可以是任意方块",
										"all": "[默认]两个区域的所有方块必须除NBT外完全相同"
									},
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#testforblocks"
				},
				"time": {
					"description": "更改或查询世界游戏时间",
					"patterns": {
						"add": {
							"description": "加快指定长度的时间",
							"params": [
								{
									"type": "plain",
									"name": "add",
									"prompt": "加快时间"
								},
								{
									"type": "uint",
									"name": "增加时间"
								}
							]
						},
						"query": {
							"description": "查询时间",
							"params": [
								{
									"type": "plain",
									"name": "query",
									"prompt": "查询时间"
								},
								{
									"type": "enum",
									"name": "时间类型",
									"list": {
										"daytime": "这一天的时间（从午夜开始的游戏刻）",
										"gametime": "游戏时间（从世界创建时开始计算的游戏刻）",
										"day": "日期（从世界创建时开始计算的游戏日）"
									}
								}
							]
						},
						"set_uint": {
							"description": "设置时间",
							"params": [
								{
									"type": "plain",
									"name": "set",
									"prompt": "设置时间"
								},
								{
									"type": "uint",
									"name": "时间"
								}
							]
						},
						"set_enum": {
							"description": "设置时间",
							"params": [
								{
									"type": "plain",
									"name": "set",
									"prompt": "设置时间"
								},
								{
									"type": "enum",
									"name": "时间",
									"list": {
										"day": "上午（1000）",
										"midnight": "深夜（18000）",
										"night": "晚上（13000）",
										"noon": "中午（6000）",
										"sunrise": "凌晨（23000）",
										"sunset": "傍晚（12000）"
									}
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#time"
				},
				"toggledownfall": {
					"description": "切换天气",
					"noparams": {
						"description": "如果天气目前晴朗，就会转换成下雨或下雪。如果天气目前是雨雪天气，它将停止下雨下雪。"
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#toggledownfall"
				},
				"tp": {
					"description": "传送实体",
					"patterns": {
						"current_to_entity": {
							"description": "将玩家传送至目的地实体",
							"params": [
								{
									"type": "selector",
									"name": "目的地实体",
									"target": "entity"
								}
							]
						},
						"current_to_position": {
							"description": "将玩家传送至目的地坐标",
							"params": [
								{
									"type": "position",
									"name": "目的地坐标"
								},
								{
									"type": "relative",
									"name": "水平旋转值",
									"optional": true
								},
								{
									"type": "relative",
									"name": "垂直旋转值",
									"optional": true
								}
							]
						},
						"entity_to_entity": {
							"description": "将目标实体传送至目的地实体",
							"params": [
								{
									"type": "selector",
									"name": "目标实体",
									"target": "entity"
								},
								{
									"type": "selector",
									"name": "目的地实体",
									"target": "entity"
								}
							]
						},
						"entity_to_position": {
							"description": "将目标实体传送至目的地坐标",
							"params": [
								{
									"type": "selector",
									"name": "目标实体",
									"target": "entity"
								},
								{
									"type": "position",
									"name": "目的地坐标"
								},
								{
									"type": "relative",
									"name": "水平旋转值",
									"optional": true
								},
								{
									"type": "relative",
									"name": "垂直旋转值",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#tp"
				},
				"teleport": {
					"alias": "tp"
				},
				"w": {
					"alias": "tell"
				},
				"weather": {
					"description": "更改游戏中的天气",
					"patterns": {
						"default": {
							"description": "设置游戏中的天气",
							"params": [
								{
									"type": "enum",
									"name": "天气类型",
									"list": {
										"clear": "晴天",
										"rain": "雨天",
										"thunder": "雷雨天"
									}
								},
								{
									"type": "uint",
									"name": "持续时间",
									"optional": true
								}
							]
						},
						"query": {
							"description": "查询游戏中的天气",
							"params": [
								{
									"type": "plain",
									"name": "query",
									"prompt": "查询当前天气"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#weather"
				},
				"xp": {
					"description": "将经验值给予一个玩家",
					"patterns": {
						"point": {
							"params": [
								{
									"type": "int",
									"name": "数量"
								},
								{
									"type": "selector",
									"name": "目标玩家",
									"target": "player",
									"optional": true
								}
							]
						},
						"level": {
							"params": [
								{
									"type": "custom",
									"name": "等级",
									"vtype": "数值",
									"suffix": "L",
									"input": "^(\\+|-)?(\\d+(L)?)?",
									"finish": "^(\\+|-)?\\d+L"
								},
								{
									"type": "selector",
									"name": "目标玩家",
									"target": "player",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#xp"
				}
			},
			"minSupportVer": "0.15.90.0"
		},
		"0.16.0 build 5": {
			"commands": {
				"enchant": {
					"description": "给一位玩家选中的物品添加附魔",
					"patterns": {
						"par_enum": {
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "enum",
									"name": "附魔ID",
									"list": "enchant_type"
								},
								{
									"type": "uint",
									"name": "等级",
									"optional": true
								}
							]
						},
						"par_uint": {
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "uint",
									"name": "附魔ID"
								},
								{
									"type": "uint",
									"name": "等级",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#enchant"
				}
			},
			"minSupportVer": "0.15.90.5"
		},
		"1.0.5 build 1": {
			"commands": {
				"clear": {
					"description": "清空玩家物品栏物品",
					"patterns": {
						"allitems": {
							"description": "清空指定玩家背包",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								}
							]
						},
						"specifieditem": {
							"description": "清空指定玩家背包内特定物品",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "string",
									"name": "物品ID",
									"suggestion": "item"
								},
								{
									"type": "int",
									"name": "物品特殊值",
									"optional": true
								},
								{
									"type": "int",
									"name": "最大数量",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#clear"
				},
				"difficulty": {
					"description": "设置游戏难度等级",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "enum",
									"name": "新难度",
									"list": "difficulty"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#difficulty"
				},
				"effect": {
					"description": "设置玩家及实体的状态效果",
					"patterns": {
						"clear": {
							"description": "移除所有状态效果",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "entity"
								},
								{
									"type": "plain",
									"name": "clear",
									"prompt": "（不是状态效果）清除所有状态效果"
								}
							]
						},
						"give": {
							"description": "给予实体状态效果",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "entity"
								},
								{
									"type": "enum",
									"name": "状态效果",
									"list": "effect"
								},
								{
									"type": "uint",
									"name": "持续秒数",
									"optional": true
								},
								{
									"type": "uint",
									"name": "级别",
									"optional": true
								},
								{
									"type": "enum",
									"name": "是否隐藏粒子",
									"list": "bool",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#effect"
				},
				"gamerule": {
					"description": "设置或查询一条游戏规则的值",
					"patterns": {
						/*"query_int": {
							"description": "查询指定游戏规则的值",
							"params": [
								{
									"type": "enum",
									"name": "规则名",
									"list": "gamerule_int"
								}
							]
						},*/
						"query_bool": {
							"description": "查询指定游戏规则的值",
							"params": [
								{
									"type": "enum",
									"name": "规则名",
									"list": "gamerule_bool"
								}
							]
						},
						/*"query_string": {
							"description": "查询指定游戏规则的值",
							"params": [
								{
									"type": "string",
									"name": "规则名",
									"suggestion": "gamerule_string"
								}
							]
						},
						"set_int": {
							"description": "设置指定游戏规则的值",
							"params": [
								{
									"type": "enum",
									"name": "规则名",
									"list": "gamerule_int"
								},
								{
									"type": "int",
									"name": "值"
								}
							]
						},*/
						"set_bool": {
							"description": "设置指定游戏规则的值",
							"params": [
								{
									"type": "enum",
									"name": "规则名",
									"list": "gamerule_bool"
								},
								{
									"type": "enum",
									"name": "值",
									"list": "bool"
								}
							]
						},
						/*"set_string": {
							"description": "设置指定游戏规则的值",
							"params": [
								{
									"type": "string",
									"name": "规则名",
									"suggestion": "gamerule_string"
								},
								{
									"type": "string",
									"name": "值"
								}
							]
						}*/
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#gamerule"
				},
				"me": {
					"description": "显示一条关于你自己的信息",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "text",
									"name": "信息"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#me"
				},
				"playsound": {
					"description": "对指定玩家播放指定声音",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "string",
									"name": "声音ID",
									"suggestion": "sound"
								},
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "position",
									"name": "位置",
									"optional": true
								},
								{
									"type": "float",
									"name": "音量",
									"optional": true
								},
								{
									"type": "float",
									"name": "音调",
									"optional": true
								},
								{
									"type": "float",
									"name": "最小音量",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#playsound"
				},
				"replaceitem": {
					"description": "用给出的物品替换方块或实体物品栏内的物品",
					"patterns": {
						"block": {
							"description": "用给出的物品替换方块内的物品",
							"params": [
								{
									"type": "plain",
									"name": "block",
									"prompt": "替换方块内物品"
								},
								{
									"type": "position",
									"name": "坐标"
								},
								{
									"type": "enum",
									"name": "格子类型",
									"list": {
										"slot.container": "容器"
									}
								},
								{
									"type": "uint",
									"name": "格子ID"
								},
								{
									"type": "string",
									"name": "物品ID",
									"suggestion": "item"
								},
								{
									"type": "uint",
									"name": "数量",
									"optional": true
								},
								{
									"type": "uint",
									"name": "数据值",
									"optional": true
								},
								{
									"type": "json",
									"name": "数据标签",
									"optional": true
								}
							]
						},
						"entity": {
							"description": "用给出的物品替换实体物品栏内的物品",
							"params": [
								{
									"type": "plain",
									"name": "entity",
									"prompt": "替换实体内物品"
								},
								{
									"type": "selector",
									"name": "目标",
									"target": "entity"
								},
								{
									"type": "enum",
									"name": "格子类型",
									"list": {
										"slot.armor": "盔甲",
										"slot.armor.chest": "胸甲",
										"slot.armor.feet": "靴子",
										"slot.armor.head": "头盔",
										"slot.armor.legs": "腿甲",
										"slot.chest": "箱子",
										"slot.enderchest": "末影箱",
										"slot.hotbar": "快捷栏",
										"slot.inventory": "物品栏",
										"slot.saddle": "鞍",
										"slot.weapon.mainhand": "主手持有",
										"slot.weapon.offhand": "副手持有"
									}
								},
								{
									"type": "uint",
									"name": "格子ID"
								},
								{
									"type": "string",
									"name": "物品ID",
									"suggestion": "item"
								},
								{
									"type": "uint",
									"name": "数量",
									"optional": true
								},
								{
									"type": "uint",
									"name": "数据值",
									"optional": true
								},
								{
									"type": "json",
									"name": "数据标签",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#replaceitem"
				},
				"spreadplayers": {
					"description": "把实体随机传送到区域内地表的某个位置",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "relative",
									"name": "x坐标"
								},
								{
									"type": "relative",
									"name": "z坐标"
								},
								{
									"type": "float",
									"name": "分散间距"
								},
								{
									"type": "float",
									"name": "最大范围"
								},
								{
									"type": "selector",
									"name": "实体",
									"target": "entity",
									"repeat": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#spread"
				},
				"stopsound": {
					"description": "停止音效播放",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "string",
									"name": "声音ID",
									"suggestion": "sound",
									"optional": true
								}
							]
						},
						"custom": {
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "string",
									"name": "声音ID",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#stopsound"
				},
				"testfor": {
					"description": "检测并统计符合指定条件的实体",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "selector",
									"name": "目标实体",
									"target": "entity"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#testfor"
				},
				"title": {
					"description": "标题命令相关",
					"patterns": {
						"clear": {
							"description": "移除标题",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "plain",
									"name": "clear",
									"prompt": "移除标题"
								}
							]
						},
						"reset": {
							"description": "重设标题设置",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "plain",
									"name": "reset",
									"prompt": "重设标题设置"
								}
							]
						},
						"subtitle": {
							"description": "设置副标题",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "plain",
									"name": "subtitle",
									"prompt": "设置副标题"
								},
								{
									"type": "text",
									"name": "副标题"
								}
							]
						},
						"title": {
							"description": "显示标题",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "plain",
									"name": "title",
									"prompt": "显示标题"
								},
								{
									"type": "text",
									"name": "标题"
								}
							]
						},
						"times": {
							"description": "设置标题显示时间",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "plain",
									"name": "times",
									"prompt": "设置标题显示时间"
								},
								{
									"type": "int",
									"name": "淡入时间"
								},
								{
									"type": "int",
									"name": "停留时间"
								},
								{
									"type": "int",
									"name": "淡出时间"
								}
							]
						},
						"actionbar": {
							"description": "在活动栏上显示文字",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "player"
								},
								{
									"type": "plain",
									"name": "actionbar",
									"prompt": "在活动栏上显示文字"
								},
								{
									"type": "text",
									"name": "活动栏文字"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#title"
				}
			},
			"minSupportVer": "1.0.5.0"
		},
		"particle in 1.0.5.0": {
			"commands": {
				"particle": {
					"description": "创建粒子效果",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "string",
									"name": "粒子ID"
								},
								{
									"type": "position",
									"name": "位置"
								},
								{
									"type": "float",
									"name": "生成区域ΔX"
								},
								{
									"type": "float",
									"name": "生成区域ΔY"
								},
								{
									"type": "float",
									"name": "生成区域ΔZ"
								},
								{
									"type": "float",
									"name": "速度"
								},
								{
									"type": "uint",
									"name": "数量",
									"optional": true
								},
								{
									"type": "plain",
									"name": "force",
									"prompt": "将颗粒的可视距离设置为256米，包括将颗粒效果可视距离降至最低的玩家",
									"optional": true
								},
								{
									"type": "int",
									"name": "额外参数",
									"repeat": true,
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#particle"
				}
			},
			"minSupportVer": "1.0.5.0",
			"maxSupportVer": "1.0.5.0"
		},
		"execute_detect": {
			"minSupportVer": "0.15.90.0",
			"maxSupportVer": "1.1.*",
			"commands": {
				"execute": {
					"patterns": {
						"detect": {
							"description": "让目标实体当点B为指定方块时在点A执行一条命令",
							"params": [
								{
									"type": "selector",
									"name": "目标",
									"target": "entity"
								},
								{
									"type": "position",
									"name": "点A"
								},
								{
									"type": "plain",
									"name": "detect",
									"prompt": "（不是命令）检测指定坐标的方块是否符合条件"
								},
								{
									"type": "position",
									"name": "点B"
								},
								{
									"type": "string",
									"name": "方块ID",
									"suggestion": "block"
								},
								{
									"type": "int",
									"name": "数据值"
								},
								{
									"type": "command",
									"name": "命令"
								}
							]
						}
					}
				}
			}
		},
		"1.2": {
			"minSupportVer": "1.2",
			"commands": {
				"alwaysday": {
					"description": "锁定或解锁日夜交替",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "enum",
									"name": "是否锁定",
									"list": "bool",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#alwaysday"
				},
				"daylock": {
					"alias": "alwaysday"
				},
				"detect": {
					"description": "当某一方块满足条件时执行一条命令",
					"patterns": {
						"default": {
							"description": "当指定坐标为指定方块时执行一条命令",
							"params": [
								{
									"type": "position",
									"name": "坐标"
								},
								{
									"type": "string",
									"name": "方块ID",
									"suggestion": "block"
								},
								{
									"type": "int",
									"name": "数据值"
								},
								{
									"type": "command",
									"name": "命令"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#detect"
				},
				"tickingarea": {
					"description": "添加、移除或列出常加载区域",
					"patterns": {
						"add_box": {
							"params": [
								{
									"type": "plain",
									"name": "add",
									"prompt": "添加长方体常加载区域"
								},
								{
									"type": "position",
									"name": "起点"
								},
								{
									"type": "position",
									"name": "终点"
								},
								{
									"type": "text",
									"name": "区域ID"
								}
							]
						},
						"add_sphere": {
							"params": [
								{
									"type": "plain",
									"name": "add circle",
									"prompt": "添加球形常加载区域"
								},
								{
									"type": "position",
									"name": "中心"
								},
								{
									"type": "uint",
									"name": "半径"
								},
								{
									"type": "text",
									"name": "区域ID"
								}
							]
						},
						"remove_pos": {
							"params": [
								{
									"type": "plain",
									"name": "remove",
									"prompt": "移除指定常加载区域"
								},
								{
									"type": "position",
									"name": "Position"
								}
							]
						},
						"remove_id": {
							"params": [
								{
									"type": "plain",
									"name": "remove",
									"prompt": "移除指定常加载区域"
								},
								{
									"type": "text",
									"name": "区域ID"
								}
							]
						},
						"remove_all": {
							"params": [
								{
									"type": "plain",
									"name": "remove_all",
									"prompt": "移除所有常加载区域"
								}
							]
						},
						"list": {
							"params": [
								{
									"type": "plain",
									"name": "list",
									"prompt": "列出所有常加载区域"
								},
								{
									"type": "plain",
									"name": "all-dimensions",
									"prompt": "列出所有维度的常加载区域",
									"optional": true
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#tickingarea"
				},
				"tp": {
					"patterns": {
						"current_to_position_facing_block": {
							"description": "将玩家传送至目的地坐标并使玩家面向指定坐标",
							"params": [
								{
									"type": "position",
									"name": "目的地坐标"
								},
								{
									"type": "plain",
									"name": "facing",
									"prompt": "面向..."
								},
								{
									"type": "position",
									"name": "面向坐标"
								}
							]
						},
						"current_to_position_facing_entity": {
							"description": "将玩家传送至目的地坐标并使玩家面向指定实体",
							"params": [
								{
									"type": "position",
									"name": "目的地坐标"
								},
								{
									"type": "plain",
									"name": "facing",
									"prompt": "面向..."
								},
								{
									"type": "selector",
									"name": "面向实体",
									"target": "entity"
								}
							]
						},
						"entity_to_position_facing_block": {
							"description": "将目标实体传送至目的地坐标并使该实体面向指定坐标",
							"params": [
								{
									"type": "selector",
									"name": "目标实体",
									"target": "entity"
								},
								{
									"type": "position",
									"name": "目的地坐标"
								},
								{
									"type": "plain",
									"name": "facing",
									"prompt": "面向..."
								},
								{
									"type": "position",
									"name": "面向坐标"
								}
							]
						},
						"entity_to_position_facing_entity": {
							"description": "将目标实体传送至目的地坐标并使该实体面向另一指定实体",
							"params": [
								{
									"type": "selector",
									"name": "目标实体",
									"target": "entity"
								},
								{
									"type": "position",
									"name": "目的地坐标"
								},
								{
									"type": "plain",
									"name": "facing",
									"prompt": "面向..."
								},
								{
									"type": "selector",
									"name": "面向实体",
									"target": "entity"
								}
							]
						}
					}
				}
			}
		}
	}
};

CA.IntelliSense.inner["addition"] = {
	"name": "补充命令库",
	"author": "CA制作组",
	"description": "该命令库是默认命令库的补充，包括了只能在多人游戏中使用的命令。",
	"uuid": "590cdcb5-3cdf-42fa-902c-b578779335ab",
	"version": [0, 0, 1],
	"require": ["acf728c5-dd5d-4a38-b43d-7c4f18149fbd"],
	"minSupportVer": "0.16.0",
	"targetSupportVer": "1.2.0.2",
	"commands": {},
	"enums": {
		"structure": {
			"endcity": "末地城",
			"fortress": "下界要塞",
			"mansion": "林地府邸",
			"mineshaft": "废弃矿井",
			"monument": "海底遗迹",
			"stronghold": "要塞",
			"temple": "沙漠神殿/丛林神庙/沼泽小屋/雪屋",
			"village": "村庄"
		}
	},
	"selectors": {},
	"help": {},
	"versionPack": {
		"0.16.0": {
			"commands": {
				"connect": {
					"alias": "wsserver"
				},
				"deop": {
					"description": "撤销玩家的管理员身份",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "selector",
									"name": "玩家",
									"target": "player"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#deop"
				},
				"list": {
					"description": "列出在服务器上的玩家",
					"noparams": true,
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#list"
				},
				"op": {
					"description": "给予一位玩家管理员身份",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "selector",
									"name": "玩家",
									"target": "player"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#op"
				},
				"wsserver": {
					"description": "尝试连接到指定的WebSocket服务器上",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "text",
									"name": "服务器URL"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#wsserver"
				}
			},
			"minSupportVer": "0.15.90.0"
		},
		"1.0": {
			"commands": {
				"locate": {
					"description": "为执行此命令的玩家在聊天窗口里显示给定类型的最近结构的坐标",
					"patterns": {
						"default": {
							"params": [{
								"type": "enum",
								"name": "结构ID",
								"list": "structure"
							}]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#locate"
				}
			},
			"minSupportVer": "0.17"
		},
		"1.0.3 build 1": {
			"commands": {
				"transferserver": {
					"description": "将玩家转送至另一服务器",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "string",
									"name": "服务器地址"
								},
								{
									"type": "uint",
									"name": "端口号"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#transferserver"
				}
			},
			"minSupportVer": "1.0.3.0"
		},
		"1.1": {
			"commands": {
				"setmaxplayers": {
					"description": "设置可加入多人联机游戏的玩家数量上限",
					"patterns": {
						"default": {
							"params": [
								{
									"type": "uint",
									"name": "数量上限"
								}
							]
						}
					},
					"help": "http://minecraft-zh.gamepedia.com/%E5%91%BD%E4%BB%A4#setmaxplayers"
				}
			},
			"minSupportVer": "1.1.0.55"
		}
	}
};

Common.themelist = {
	"light" : {
		"name" : "默认风格"
	},
	"dark" : {
		"name" : "暗黑风格",
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

CA.tips = [
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
loadingThread = null;
ctx.runOnUiThread(function() {try {
	lto.cancel();
} catch(e) {erp(e)}});
MapScript.initialize();
} catch(e) {erp(e)}}}));
loadingThread.start();