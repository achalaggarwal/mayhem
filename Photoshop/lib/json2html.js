var fs   = require('fs')
  , util = require('util')
  , ejs  = require('ejs');

var _json = JSON.parse(fs.readFileSync("/Users/gogo/Desktop/photoshop/source-psd-export/out.json"));

var Renderer = function() {
};

Renderer.prototype.toStyle = function(data){
  return util.format("width: %dpx; height: %dpx; left: %dpx; top: %dpx; background: url(%s) no-repeat 0 0",
    data.dimentions.width, data.dimentions.height, data.dimentions.left, data.dimentions.top, data.path.replace('~/Desktop/photoshop/', ''));
};

Renderer.prototype.asElement = function(data) {
  if (data.type === 'Button') {
    return util.format("<button class='element %s' style='%s'>%s</button>\n",
      data.layer_name, this.toStyle(data), data.content || '');
  } else if (data.type === 'TextField') {
    var fontSize = data.text.details.size || data.dimentions.height*50/100;
    return util.format("<input type='text' class='element %s' style='%s; font-size: %dpx'>%s</input>\n",
      data.layer_name, this.toStyle(data), fontSize, data.content || '');
  } else {
    return util.format("<div class='element %s' style='%s'>%s</div>\n",
      data.layer_name, this.toStyle(data), data.content || '');
  }
};

var renderer = new Renderer();
var _content = "";
for (var i in _json.layers) {
  var _layer = _json.layers[i];
  _content += renderer.asElement(_layer);
}
_content = util.format("<div class='body' style='width: %dpx; height: %dpx;'>\n%s</div>", _json.dimentions.width, _json.dimentions.height, _content);

var _ejs = fs.readFileSync("/Users/gogo/Desktop/photoshop/source.ejs");

var html = ejs.render('' + _ejs, { body: _content });

fs.writeFileSync("/Users/gogo/Desktop/photoshop/source.html", html);
