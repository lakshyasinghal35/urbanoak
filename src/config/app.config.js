/**
* The functions in this file will read the app config json file and will provide an interface to use the properties.
*/

var fs = require("fs");




const config = (function(){
	var config = fs.readFileSync(appRoot+"/config/app.config.json");
	console.log(config.toString());
	config = JSON.parse(config);
	console.log(config);
	return config;
})();



/**
 * will validate all config properties in a recursive manner
 * @return {success:false,errMess:"Empty property host"} [description]
 */
function validate(){
	return {success:true};
}





module.exports = config;