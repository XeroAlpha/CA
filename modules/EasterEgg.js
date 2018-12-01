MapScript.loadModule("EasterEgg", {
	onCreate : function() {
		G.ui(this.initIcon);
	},
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
		PWM.addPopup(EasterEgg.view);
	} catch(e) {Log.e(e)}})},
	getBitmap : function(w) {
		var zf = new java.util.zip.ZipFile(ctx.getPackageManager().getApplicationInfo("com.mojang.minecraftpe", 128).publicSourceDir);
		var b = zf.getInputStream(zf.getEntry("assets/resource_packs/vanilla/textures/blocks/command_block_front_mipmap.png"));
		var bmp = G.Bitmap.createBitmap(w, w, G.Bitmap.Config.ARGB_8888);
		var cv = new G.Canvas(bmp);
		cv.scale(w / 170, w / 170);
		var pt = new G.Paint();
		pt.setAntiAlias(true);
		pt.setShader(new G.BitmapShader(G.Bitmap.createScaledBitmap(G.BitmapFactory.decodeStream(b), 160, 160, false), G.Shader.TileMode.REPEAT, G.Shader.TileMode.REPEAT));
		cv.drawRect(0, 0, 170, 170, pt);
		pt.setShader(null);
		pt.setTextSize(60);
		var fm = pt.getFontMetrics();
		var th = fm.bottom - fm.top;
		pt.setColor(Common.argbInt(0x80, 0, 0, 0));
		pt.setShadowLayer(1, 0, 0, pt.getColor());
		cv.drawRoundRect(0, 170 - th, 170, 200, 10, 10, pt);
		pt.setColor(G.Color.WHITE);
		pt.setShadowLayer(1, 0, 0, G.Color.BLACK);
		cv.drawText(" CA_", 0, 170 - fm.descent, pt);
		return bmp;
	},
	initIcon : function() {
		var img;
		try {
			img = EasterEgg.getBitmap(480);
		} catch(e) {Log.e(e)}
		if (img) {
			CA.Icon.easteregg = function(size) {
				var zp = G.dp * size;
				var frm = new G.FrameLayout(ctx);
				var view = new G.ImageView(ctx);
				view.setImageBitmap(img);
				view.setLayoutParams(new G.FrameLayout.LayoutParams(32 * zp, 32 * zp));
				frm.addView(view);
				return frm;
			};
		}
	}
});