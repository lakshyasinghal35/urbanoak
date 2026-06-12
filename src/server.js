const path = require("path");
const https = require("https");
const fs = require('fs');
const express = require("express");
const cookieParser = require("cookie-parser");
const { sendError } = require('./common/response');
const { ensureSearchIndex } = require('./modules/searchMicroservice/indexManager');
const { startSearchIndexWorker } = require('./modules/searchMicroservice/index.worker');
const { connectKafkaProducer, isKafkaEnabled } = require('./config/kafka');
const { startNotificationWorkers } = require('./modules/notificationMicroservice');

const app = express();
const routers = require("./routes/index");



//the order of the events is very important and must not be changed if lacking expertise in express framework
function start(){
	configureRequestParsing();
	addSecurity();
	addRequestInfoLogger();
	addRouters();
	addErrorHandler();
	addResponseInfoLogger();
	setupSearchIndex();
	setupKafka();
	listen();
}

function listen(){
	const isHttps = config.isHttps;
	if(isHttps){
		listenOnHttps(app);
	}
	else{
		listenOnHttp(app);
	}
}

function listenOnHttps(app){
	const httpsKeys = getHttpsKeys();
	https.createServer(httpsKeys,app).listen(config.httpsPort,function(){
		console.log("Https server started on port ",config.httpsPort);
	});
	activateHttpsRedirector();
}

function activateHttpsRedirector(){
	httpsRedirector = express();
	listenOnHttp(httpsRedirector);
	httpsRedirector.use(function(req,res){
		res.redirect("https://www.sharebooks.in"+req.originalUrl);
	});
}

function listenOnHttp(app){
	app.listen(config.httpPort,function(){
		console.log("Http server started on port ",config.httpPort);
	});
}

function configureRequestParsing(){
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(cookieParser());
	//needs to be modified and made robust
	//app.use(session({secret:config.sessionSecret,key:"",resave: true,saveUninitialized: false}));
}


function addSecurity(){
	app.disable('x-powered-by');
	//app.use(setupSecurityHeaders);
	app.use(helmet());
}




function addRouters(){
	//the order is important here as the static router should come at end. You must not disturb the order.
	for(var key in routers){
		app.use('/api',routers[key]);
	}
	
	//the static router must come at the end or else it will create havoc on routes
	//app.use('/',routers.staticRouter);

	//all the unidentified routed will be handled here
	app.all("*",function(req,res){
		res.status(400).json({success:false});
	});
}





function setupSearchIndex(){
	ensureSearchIndex().catch(error => {
		console.error('[search] index setup failed:', error.message);
	});
	startSearchIndexWorker();
}




function setupKafka(){
	if(!isKafkaEnabled()){
		return;
	}

	connectKafkaProducer().catch(error => {
		console.error('[kafka] producer connection failed:', error.message);
	});

	startNotificationWorkers().catch(error => {
		console.error('[kafka] notification workers failed to start:', error.message);
	});
}


function addErrorHandler() {
	app.use((err, req, res, next) => {
		const statusCode = err.statusCode || 500;
		const message = err.message || 'Internal server error';
		if (statusCode === 500) {
			console.error(err); // log real errors
		}
		sendError(res, message, statusCode, err.details);
	});
}



//hhtps certifcates and keys for setting up https server
function getHttpsKeys(){
	const key = fs.readFileSync(config.https.keyPath);
	const cert = fs.readFileSync(config.https.certPath);
	const ca = fs.readFileSync(config.https.caPath);

	console.log("key =>",key);
	console.log("cert =>",cert);
	console.log("ca =>",ca);
	return {key:key,cert:cert,ca:ca,passphrase:'sharebooks'};
}


function addRequestInfoLogger() {
	app.use((req, res, next) => {
		var url = req.originalUrl;
		var method = req.method;
		var ip = req.ip;
		var body = req.body;
		var query = req.query;
		var params = req.params;
		var cookies = req.cookies;
		
		var requestInfo = `URL: ${url}, Method: ${method}, Body: ${body}, Query: ${query}, Params: ${params}`;
		console.log(requestInfo);
		next();
	});
}


function addResponseInfoLogger() {
	app.use((req, res, next) => {
		var statusCode = res.statusCode;
		var data = res.data;
		var responseInfo = `Status Code: ${statusCode}, Data: ${data}`;
		console.log(responseInfo);
		next();
	});
}

module.exports = {start};



