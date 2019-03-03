const clibspawn = require("../clibspawn");
module.exports = function(context, args) {
	return clibspawn(args[0]);
}
module.exports.input = "cli";