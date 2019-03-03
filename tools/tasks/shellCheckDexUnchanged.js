const fs = require("fs");
const crc32 = require("../crc32");
function crc32wrap(buffer) {
	return crc32(0, buffer, buffer.length, 0);
}
module.exports = function(context, args) {
	var crc = crc32wrap(fs.readFileSync(context.shellcwd + "/app/build/intermediates/dex/release/mergeDexRelease/out/classes.dex")).toString(16);
	return context.dexCrc == crc;
}