MapScript.loadModule("NetworkUtils", {
	queryPage : function(url) {
		return this.request(url, "GET");
	},
	postPage : function(url, data, contentType) {
		return this.request(url, "POST", data, contentType);
	},
	request : function(url, method, data, contentType) {
		var url = new java.net.URL(url);
		var conn = url.openConnection();
		conn.setConnectTimeout(5000);
		conn.setUseCaches(false);
		conn.setRequestMethod(method);
		if (data) {
			conn.setDoInput(true);
			conn.setDoOutput(true);
		}
		if (contentType) conn.setRequestProperty("Content-Type", contentType);
		var rd, s, ln;
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
			s = [conn.getResponseCode() + " " + conn.getResponseMessage()];
			if (rd) {
				rd = new java.io.BufferedReader(new java.io.InputStreamReader(rd));
				while (ln = rd.readLine()) s.push(ln);
				rd.close();
			}
			s.push(e);
			throw s.join("\n");
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
	toQueryString : function(obj) {
		var i, r = [];
		for (i in obj) {
			if (obj[i] == undefined) continue;
			r.push(i + "=" + encodeURIComponent(obj[i]));
		}
		return r.join("&");
	}
});