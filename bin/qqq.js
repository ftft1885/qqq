#!/usr/bin/env node

var d = require('qqqd');
//var mkdirp = require('mkdirp');

var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');


var $ = "/qqq";

init($, function(err){

if (err) {
  console.log(err);
  console.log("end");
} else {

// main

var mime = require('../lib/mime.json');

var port = 888;

try {

  var $config = require(path.join($, '.config.json'));
  if ('port' in $config) {
    port = $config.port;
  }
  console.log("Server on PORT: " + port); 

} catch(e) {
  console.log("WARNING: cannot fonud .config.json in " + $);
}
console.log("Server Root Path: " + $);



d(function() {


  http.createServer(function(req, res) {

    var pathname = url.parse(req.url).pathname;
    var extname = path.extname(pathname);

    var filepath = path.join($, pathname);
    fs.readFile(filepath, function(err, data) {
      
      if (err) {

        console.log(err);
        // EISDIR
        if ('code' in err && err.code === "EISDIR") {

          // index
          if (filepath.charAt(filepath.length-1) != '/') {
            res.writeHead(302, {'Location': pathname + '/'});
            res.end();
            return;
          }
          getIndexFile(filepath, function(err, indexFile) {
            if (!err) {
              res.end(indexFile);
            }
          });  
          return;

        }
        res.writeHead(404);
        res.end('404 not found\nby qqq server');

      } else {
      
        if (extname in mime) {
          res.writeHead(200, {'Content-Type': mime[extname]});
          res.end(data);

        } else {

          // unkwown type but exist, return application/json, why? I just know ali do same thing..
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(data);
        }

      }

    })

  }).listen(port);



}).on('restart', function() {
  this.stdout.write('Restarting');
});

}

});

function getIndexFile(dir, cb) {

  console.log(dir);

  fs.readdir(dir, function(err, files) {
      if (err) {
        cb(err);
      } else {
        var indexFile = "";
        var _index_files = [];
        files.forEach(function(file) {
            
          if (file.indexOf('index') === 0) {

            _index_files.push(file);

          }

        });
        //console.log(_index_files);
        if (_index_files.length < 1) {
          // no index
          cb('no index file');
          return;
        }
        indexFile = _index_files[0];
        for (var i = 0, _file; _file = _index_files[i]; i++) {
          if (_file == 'index.html') {
            indexFile = _file;
          }
        }
        fs.readFile(path.join(dir, indexFile), function(err, data) {
            cb(err, data);
        })
      }
  });
  
}


function init($, cb) {
  // make sure qqq exist and is a directory
  fs.exists($, function(e) {
    
    if (e) {

      fs.stat($, function(err, stats) {

        if (stats.isDirectory()) {

          cb();

        } else {
          // there is a file
          cb('ERROR: '+$+'is not a directory');
        }

      })

    } else {

      // no this directory
      fs.mkdir($, function(err) {
        if (err) {
          cb && cb(err);
        } else {
          cb();
        }
      });
    }

  })
}
