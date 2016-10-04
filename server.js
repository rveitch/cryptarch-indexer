var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

/* local json */
var COMMENTS_FILE = path.join(__dirname, 'xur-exotic.json');
var XUR_FILE = path.join(__dirname, 'xur.json');

/* SQLITE3 db */
var file = 'world_sql_content_3e5044d2a0fb84c00430485829c9c9de.db';
var exists = fs.existsSync(file);
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/******************************************************************************/

// Additional middleware which will set headers that we need on each request.
app.use(function(req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Disable caching so we'll always get the latest comments.
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

app.get('/api/comments', function(req, res) {
  fs.readFile(COMMENTS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/comments', function(req, res) {
  fs.readFile(COMMENTS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    var comments = JSON.parse(data);
    // NOTE: In a real implementation, we would likely rely on a database or
    // some other approach (e.g. UUIDs) to ensure a globally unique id. We'll
    // treat Date.now() as unique-enough for our purposes.
    var newComment = {
      id: Date.now(),
      author: req.body.author,
      text: req.body.text,
    };
    comments.push(newComment);
    fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.json(comments);
    });
  });
});

/* Xur Base Endpoint */
app.get('/xur/', function(req, res) {
  fs.readFile(XUR_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
		var xurData = JSON.parse(data).Response.data;

    res.json(xurData);

  });
});

/* Xur Exotic Gear Endpoint */
app.get('/xur/exotic-gear', function(req, res) {
  fs.readFile(XUR_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
		var saleItems = JSON.parse(data).Response.data.saleItemCategories;

		var val = "Exotic Gear"
		var index = saleItems.findIndex(function(item, i){
		  return item.categoryTitle === val
			console.log(item.categoryTitle === val);
		});


    res.json(saleItems[index].saleItems);
		//res.json(JSON.parse(data).Response); // original code
  });
});

/* Item Endpoint */
// example: http://localhost:3000/item/?id=2661471739
app.get('/item/', function(req, res) {
	if (req.query.id) {
		//console.log(req.query.id);
		var itemID = req.query.id;
	}

	var options = { method: 'GET',
  url: 'https://www.bungie.net/platform/Destiny/Manifest/InventoryItem/' + req.query.id +'/',
  headers: {
		'cache-control': 'no-cache',
     'x-api-key': '743110a0a6bf4723b458b18eed7e1205' } };

	request(options, function (error, response, body) {
	  if (error) throw new Error(error);
		var inventoryItem = JSON.parse(body).Response.data.inventoryItem;
		res.json(inventoryItem);
	}) //.pipe(res);

});

/* Get Item Name Function */
function getItem(itemID, callback) {
		var options = { method: 'GET',
		url: 'https://www.bungie.net/platform/Destiny/Manifest/InventoryItem/' + itemID +'/',
		headers: {
			'cache-control': 'no-cache',
			 'x-api-key': '743110a0a6bf4723b458b18eed7e1205' } };

    request(options, function (err, data, response) {
				//var finalData = JSON.parse(response).Response.data.inventoryItem.itemName;
				var finalData = JSON.parse(response).Response.data.inventoryItem;
				//console.log(finalData);
				return callback(finalData);
    });
}

/* Get Item Name Function */
function getXur(callback) {
		// https://www.bungie.net/Platform/Destiny/Advisors/Xur/
		// http://localhost:3000/xur/
		var options = { method: 'GET',
		url: 'http://localhost:3000/xur/',
		headers: {
			'cache-control': 'no-cache',
			 'x-api-key': '743110a0a6bf4723b458b18eed7e1205' } };

    request(options, function (err, data, response) {
				//var finalData = JSON.parse(response).Response.data.inventoryItem.itemName;
				var finalData = JSON.parse(response);
				console.log(finalData);
				return callback(finalData);
    });
}


/* Get XUR Example */
app.get('/get/xur', function(req, res) {
	// example: http://localhost:3000/get/item/?id=2661471739
	var itemID = '1234';
	getXur(function(response){
	    // Here you have access to your variable
	    console.log(response);
			resJSON = { 'nextRefreshDate': response.nextRefreshDate };
			res.json(resJSON);
	})
});

/* Get Item Name Example */
app.get('/get/item', function(req, res) {
	// example: http://localhost:3000/get/item/?id=2661471739
	var itemID = req.query.id;
	getItem(itemID, function(response){
	    // Here you have access to your variable
	    console.log(response);
			resJSON = { 'itemName': response.itemName };
			res.json(resJSON);
	})
});

/****************** LISTEN *********************/

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');


	db.each("SELECT rowid AS id, json FROM DestinyItemCategoryDefinition", function(err, row) {
	    //console.log(row.id + ": " + JSON.parse(row.json).identifier);
			//console.log('DestinyEnemyRaceDefinition:');
			console.log(JSON.parse(row.json).identifier);
	  });

});
