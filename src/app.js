const path = require("path");

//const propertyDao = require("./database/mysql/propertyDao.js");

global.appRoot = path.resolve(__dirname);
global.config = require("./config/app.config.json");

const server = require("./server/server.js");



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