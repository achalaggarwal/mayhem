// var PSD2IOS = require('../lib/src/psd_to_ios').PSD2IOS;

// var a = new PSD2IOS('/Users/gogo/Desktop/photoshop/source1.psd', '/Users/gogo/Desktop/export');
// a.convert(function(data){
//   console.log(data);
// });

var fs = require('fs');
var util = require('util');

var JSON2IOS = require('../lib/src/json_to_ios').JSON2IOS;
fs.readFile(__dirname + '/ps_out.json','utf8', function(err, data){
  var a = new JSON2IOS(JSON.parse(data));
  a.convert();
});
