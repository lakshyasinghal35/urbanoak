const path = require("path");
const https = require("https");
const fs = require('fs');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const helmet = require("helmet");
const { sendError } = require('./utils/response');

const app = express();

const routers = require("./routes/index");
const enums = require(path.join(appRoot+"/models/enums/enums"));
const STATUS_CODES = enums.ERROR_CODES; 

const noSessionUrls = [{url:"/",method:"GET"},{url:"/api/login",method:"POST"},{url:"/api/users",method:"PUT"}];


//the order of the events is very important and must not be changed if lacking expertise in express framework
function start(){
	configure();
	addStaticResources();
	addSessionValidator();
	addSecurityHeaders();
	addRouters();
	addErrorHandler();
	handleUnidentifiedRoutes();
	
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

function configure(){
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended:true}));
	app.use(cookieParser());
	//needs to be modified and made robust
	app.use(session({secret:config.sessionSecret,key:"",resave: true,saveUninitialized: false}));
}


function addSecurityHeaders(){
	app.disable('x-powered-by');
	app.use(function(req,res,next){
		//cross site scripting header
		res.set('X-XSS-Protection','1; mode=block');
		//browser sniffing protection
		res.set('X-Frame-Options',"SAMEORIGIN");
		//no sniffing of mime types
		res.set("X-Content-Type-Options","nosniff");
		next();
	});
	//app.use(helmet());
}

function addSessionValidator(){
	app.use(function(req,res,next){
		const url = req.originalUrl;
		const method = req.method;
		const session = req.session;
		const isAjax = req.xhr;
		const isSessionRequired = config.isSessionRequired;

		console.log("Method =>",req.method);
		console.log("Url =>",req.originalUrl);
		console.log("isAjax =>",isAjax);
		/*check if session exists by checking whether the user object is set in session
		The user object will only be set if the user has looged in*/
		if(isSessionRequired && !session.user){   //session doesn't exist
			if(isNoSessionUrl(url,method)){   //the url and method type don't need an existing session
				next();
			}
			else{   //the url needs an existing session
				if(isAjax){   //if it is an ajax request we will send a json response with session expired status code
					res.json({success:false,statusCode:STATUS_CODES.SESSION_EXPIRED,errorCode:-1});
				}
				else{    //else we will send an appropriate html page to address the situation
					res.sendFile(path.join(appRoot +'/public/pages/unauthorized_access.html'));
				}
			}
		}
		else{    //session exists
			next();
		}

		
	});
}

function isNoSessionUrl(url,method){
	var i=0,len=noSessionUrls.length;
	var noSessionUrl;
	for(;i<len;i++){
		noSessionUrl = noSessionUrls[i];
		if(url==noSessionUrl.url && method==noSessionUrl.method){
			return true;
		}
	}
	return false;
}





/*get all static resource paths and add them with the path static
all the static resources will be available from /static path. Example => http://localhost:8070/static/login.js */
function addStaticResources(){
	const paths = config.staticResourcePaths;
	for(var i=0,l=paths.length;i<l;i++){
		app.use('/static',express.static(paths[i]));
	}
	//app.use('/',express.static("."));
}

function addRouters(){
	//the order is important here as the static router should come at end. You must not disturb the order.
	for(var key in routers){
		if(key!="staticRouter"){
			app.use('/api',routers[key]);
		}
	}
	//the static router must come at the end or else it will create havoc on routes
	app.use('/',routers.staticRouter);
}


function addErrorHandler() {
	app.use((err, req, res, next) => {
		const statusCode = err.statusCode || 500;
		const message = err.message || 'Internal server error';
		if (statusCode === 500) {
			console.error(err); // log real errors
		}
		sendError(res, message, statusCode);
	});
}


/*all the unidentified routed will be handled here
If the request is ajax type, json response will be send otherwise url_error page will be displayed on client side*/
function handleUnidentifiedRoutes(){
	app.all("*",function(req,res){
		const isAjax = req.xhr;
		if(isAjax){
			res.status(400).json({success:false,statusCode:0});
		}
		else{
			res.sendFile(path.join(appRoot +'/public/pages/url_error.html'));
		}
	});
}

//
function getHttpsKeys(){
	const key = fs.readFileSync(config.https.keyPath);
	const cert = fs.readFileSync(config.https.certPath);
	const ca = fs.readFileSync(config.https.caPath);

	console.log("key =>",key);
	console.log("cert =>",cert);
	console.log("ca =>",ca);
	return {key:key,cert:cert,ca:ca,passphrase:'sharebooks'};
}



module.exports = {start};



