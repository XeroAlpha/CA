(function() {
	/*LOADER
		source = JSON.stringify(fs.readFileSync(parentDir + "/../../pages/about.html", "utf-8").replace(new RegExp("\\s*\n\\s*", "g"), ""));
	*/
	var rd, s = [], q;
	rd = new java.io.BufferedReader(new java.io.InputStreamReader(Loader.open("pages/about.html")));
	while (q = rd.readLine()) s.push(q);
	rd.close();
	return s.join("\n");
})()