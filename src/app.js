const path = require("path");

global.appRoot = path.resolve(__dirname);
global.config = require("./config");

require("./config/db");
const server = require("./server.js");



// function getPropertiesFromDB(){
// 	const properties = propertyDao.getProperties();
// 	for(var key in properties){
// 		console.log("key =>", properties[key]);
// 	}
// }


function startServer(){
	try{
		server.start();
	}
	catch(err){
		console.log(err);
	}
}

//getPropertiesFromDB();
startServer();
