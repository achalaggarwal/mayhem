var PSD2IOS = require('../lib/src/psd_to_ios').PSD2IOS;

var a = new PSD2IOS('/Users/gogo/Desktop/photoshop/source1.psd', '/Users/gogo/Desktop/export');
a.convert(function(data){
  console.log(data);
});
