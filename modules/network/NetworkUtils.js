MapScript.loadModule("NetworkUtils", {
	queryPage : function(url) {
		return this.request(url, "GET");
	},
	postPage : function(url, data, headers) {
		return this.request(url, "POST", data, headers);
	},
	request : function(url, method, data, headers) {
		var url = new java.net.URL(url);
		var conn = url.openConnection(), i;
		conn.setConnectTimeout(5000);
		conn.setUseCaches(false);
		conn.setRequestMethod(method);
		if (data) {
			conn.setDoInput(true);
			conn.setDoOutput(true);
		}
		if (headers) {
			if (headers instanceof Object) {
				for (i in headers) {
					conn.setRequestProperty(i, headers[i]);
				}
			} else {
				conn.setRequestProperty("Content-Type", headers);
			}
		}
		var rd, s, ln, err;
		try {
			conn.connect();
			if (data) {
				var wr = conn.getOutputStream();
				wr.write(new java.lang.String(data).getBytes());
				wr.flush();
			}
			rd = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
			s = [];
			while (ln = rd.readLine()) s.push(ln);
			rd.close();
			return s.join("\n");
		} catch(e) {
			try {
				rd = conn.getErrorStream();
			} catch(er) {
				throw e;
			}
			err = this.RequestError.create(e);
			err.responseCode = conn.getResponseCode();
			err.responseMessage = String(conn.getResponseMessage());
			s = [];
			if (rd) {
				rd = new java.io.BufferedReader(new java.io.InputStreamReader(rd));
				while (ln = rd.readLine()) s.push(ln);
				rd.close();
			}
			err.errorMessage = s.join("\n");
			throw err;
		}
	},
	download : function(url, path) {
		const BUFFER_SIZE = 8192;
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
		is.close();
	},
	downloadGz : function(url, path, sha1) {
		const BUFFER_SIZE = 8192;
		var url = new java.net.URL(url);
		var conn = url.openConnection();
		conn.setConnectTimeout(5000);
		conn.setUseCaches(false);
		conn.setRequestMethod("GET");
		conn.connect();
		var is, os, buf, hr, digest;
		digest = java.security.MessageDigest.getInstance("SHA-1");
		is = new java.util.zip.GZIPInputStream(new java.security.DigestInputStream(conn.getInputStream(), digest));
		os = new java.io.FileOutputStream(path);
		buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, BUFFER_SIZE);
		while ((hr = is.read(buf)) > 0) os.write(buf, 0, hr);
		os.close();
		is.close();
		return android.util.Base64.encodeToString(digest.digest(), android.util.Base64.NO_WRAP) == sha1;
	},
	verifyFile : function(path, sha1) {
		const BUFFER_SIZE = 8192;
		var is, digest, buf, hr;
		digest = java.security.MessageDigest.getInstance("SHA-1");
		is = new java.io.FileInputStream(path);
		buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, BUFFER_SIZE);
		while ((hr = is.read(buf)) > 0) digest.update(buf, 0, hr);
		is.close();
		return android.util.Base64.encodeToString(digest.digest(), android.util.Base64.NO_WRAP) == sha1;
	},
	toQueryString : function(obj) {
		var i, r = [];
		for (i in obj) {
			if (obj[i] == undefined) continue;
			r.push(i + "=" + encodeURIComponent(obj[i]));
		}
		return r.join("&");
	},
	getIps : function() {
		var ni = Common.iterableToArray(java.net.NetworkInterface.getNetworkInterfaces());
		var i, e, ips = [];
		for (i = 0; i < ni.length; i++) {
			e = Common.iterableToArray(ni[i].getInetAddresses());
			for (j = 0; j < e.length; j++) {
				ip = e[j];
				if (ip instanceof java.net.Inet4Address) {
					ips.push(ip.getHostAddress());
				}
			}
		}
		return ips;
	},
	RequestError : (function() {
		var o = Object.create(Error.prototype);
		o.toString = function() {
			return [
				"RequestError: " + this.responseCode + " " + this.responseMessage,
				this.errorMessage,
				this.error
			].join("\n");
		}
		o.create = function(err) {
			var r = Object.create(this);
			r.error = err;
			r.message = err.message;
			r.stack = err.stack;
			return r;
		}
		return o;
	})()
});