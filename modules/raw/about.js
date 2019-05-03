(function() {
	/*LOADER
		source = JSON.stringify(fs.readFileSync(parentDir + "/../../pages/about.html", "utf-8").replace(new RegExp("\\s*\n\\s*", "g"), ""));
	*/
	return Loader.readFile("./pages/about.html");
})()