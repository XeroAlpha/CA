const signscript = require("../signscript");
module.exports = function(context, args) {
	return signscript(args[0], context.shellsign);
}