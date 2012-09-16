function cTID(s) { return app.charIDToTypeID(s); };
function sTID(s) { return app.stringIDToTypeID(s); };

var JSONExporter = function(path){
  app.open(new File(path));
  this.originalRulerUnits = preferences.rulerUnits;
  this.mainDoc            = app.activeDocument;
  this.doc                = this.mainDoc.duplicate();

  var docFileName   = this.mainDoc.name.replace(/[:\/\\*\?\"\<\>\|\s]/g, "-");
  this.folder       = new Folder(this.mainDoc.fullName.path +"/"+ docFileName +"-export");
  var imagesFolder  = new Folder(this.folder.fullName +"/images");

  if(!this.folder.exists) {
    this.folder.create();
  }
  if(!imagesFolder.exists) {
    imagesFolder.create();
  }
};

JSONExporter.prototype.process = function(){
  preferences.rulerUnits = Units.PIXELS;
  var traversed = this.traverse(this.doc.layers);
  preferences.rulerUnits = this.originalRulerUnits;
  var file = new File(this.folder.fullName +"/out.json");
  file.open('w');
  file.writeln(js_beautify(JSON.stringify(traversed), {indent_size: 2, indent_char: ' '}));
  file.close();
  this.doc.close(SaveOptions.DONOTSAVECHANGES);
};

JSONExporter.prototype.guessControl = function(name){
  name = name.toLowerCase();

  if (name.indexOf('label') != -1) {
    return "Label";
  } else if (name.indexOf('textfield') != -1) {
    return "TextField"
  } else if (name.indexOf('button') != -1) {
    return "Button"
  } else if (name.indexOf('background') != -1) {
    return "Background";
  } else if (name.indexOf('switch') != -1) {
    return "Switch";
  } else if (name.indexOf('bar') != -1) {
    return "NavigationBar";
  } else {
    return name;
  }
}

JSONExporter.prototype.removeTextLayers = function(layer) {
  var _layer;
  var _remove = [];
  var _properties = null;

  for(var i = 1; i <= layer.layers.length; ++i) {
    index  = layer.layers.length - i;
    _layer = layer.layers[index];

    if (_layer.kind == LayerKind.TEXT) {
      _properties = this.render(_layer);
      _remove.push(_layer);
    }
  }

  for (var i in _remove) {
    _remove[i].remove();
  }

  return _properties;
};

JSONExporter.prototype.removeControlLayers = function(layer) {
  var _layer;
  var _remove = [];
  var _properties = null;

  for(var i = 0; i < layer.layers.length; i++) {
    _layer = layer.layers[i];

    if (_layer.kind == LayerKind.TEXT) {
      _remove.push(_layer);
      _properties = this.render(_layer);
    } else if (_layer.typename == "LayerSet" && _layer.bounds[0] > 0) {
      _remove.push(_layer);
    }
  }

  for (var i in _remove) {
    _remove[i].remove();
  }
  return _properties;
};

JSONExporter.prototype.traverse = function(layers){
  var layer, index, parsed = {}, name, guessedName;

  for(var i = 1; i <= layers.length; ++i) {
    index       = layers.length - i;
    layer       = layers[index];
    name        = layer.name.replace(/[:\/\\*\?\"\<\>\|]/g, "-");
    guessedName = this.guessControl(name);

    if(layer.typename == "LayerSet" && guessedName != 'Button' && guessedName != 'Switch' && guessedName != 'NavigationBar' && guessedName != 'TextField') {
      if (!parsed[name]) parsed[name] = [];
      var a = this.traverse(layer.layers);
      parsed[name] = parsed[name].concat(a);
    } else {
      if (!parsed['controls']) parsed['controls'] = [];
      var a = this.render(layer, guessedName);
      parsed['controls'] = parsed['controls'].concat(a);
    }
  }
  return parsed;
};

JSONExporter.prototype.render = function(layer, guessedName){
  var isVisible = true; //mLayer.isVisible;

  if (isVisible) {
    app.activeDocument = this.doc;
    layer.visible = true;
    app.activeDocument.activeLayer = layer;

    var outLayer = {
      name: layer.name.replace(/[:\/\\*\?\"\<\>\|]/g, "-"),
      type: null,
      dimentions : {
        left: layer.bounds[0].value,
        top: layer.bounds[1].value,
        width: layer.bounds[2].value - layer.bounds[0].value,
        height: layer.bounds[3].value - layer.bounds[1].value,
      }
    };

    if (layer.kind != LayerKind.TEXT) {
      outLayer.type = "image";

      var helperDoc = this.doc.duplicate(),
        helperLayer = helperDoc.activeLayer;

      if (guessedName == 'Button' || guessedName == 'TextField') {
        outLayer.content = this.removeTextLayers(layer);
      } else if (guessedName == 'NavigationBar') {
        outLayer.content = this.removeControlLayers(layer);
      }

      app.activeDocument = helperDoc;

      // we'll trim later. I had some files with transparent layer-edges which aren't very
      // helpful. I need to crop as well, since there are some problems with trimming and
      // resulting layer-bounds.
      helperDoc.crop(layer.bounds);


      var desc = new ActionDescriptor();
      desc.putEnumerated(sTID("trimBasedOn"), sTID("trimBasedOn"), cTID("Trns"));

      desc.putBoolean(cTID("Left"), true);
      desc.putBoolean(cTID("Top "), true);
      desc.putBoolean(cTID("Rght"), false);
      desc.putBoolean(cTID("Btom"), false);
      try {
        executeAction(sTID("trim"), desc, DialogModes.NO);
      } catch(e) {}

      outLayer.dimentions.left += outLayer.dimentions.width - helperDoc.width.value;
      outLayer.dimentions.top += outLayer.dimentions.height - helperDoc.height.value;

      desc.putBoolean(cTID("Left"), false);
      desc.putBoolean(cTID("Top "), false);
      desc.putBoolean(cTID("Rght"), true);
      desc.putBoolean(cTID("Btom"), true);
      try {
        executeAction(sTID("trim"), desc, DialogModes.NO);
      } catch(e) {}

      outLayer.dimentions.width = helperDoc.width.value;
      outLayer.dimentions.height = helperDoc.height.value;

      var imgRelPath         = "images/" + outLayer.name + ".png";
      outLayer.path          = this.folder.fullName + "/" + imgRelPath;
      var saveOptions        = new PNGSaveOptions;
      saveOptions.interlaced = false;

      helperDoc.saveAs(new File(outLayer.path), saveOptions, true, Extension.LOWERCASE);
      helperDoc.close(SaveOptions.DONOTSAVECHANGES);
    } else if (layer.kind == LayerKind.TEXT) {
      outLayer.type = "text";

      var ranges = [];
      var range;
      var maxLineHeight = 0;
      var maxFontSize = 0;

      var ti = layer.textItem;

      var info = [];
      var ref = new ActionReference();
      ref.putEnumerated(sTID("layer"), cTID("Ordn"), cTID("Trgt"));
      var desc = executeActionGet(ref);
      var list = desc.getObjectValue(cTID("Txt "));
      var tsr = list.getList(cTID("Txtt"));

      for (var i = 0; i < tsr.count; i++) {
        var tsr0              = null;
        var textStyle         = null;
        var color             = null;
        var autoLeading       = null;
        var size              = null;
        var leading           = null;
        var text              = null;
        var font              = null;
        var red               = null;
        var blue              = null;
        var green             = null;
        var fill              = null;

        try { tsr0              = tsr.getObjectValue(i); } catch(ex){}
        try { textStyle         = tsr0.getObjectValue(cTID("TxtS")); } catch(ex){}
        try { color             = textStyle.getObjectValue(cTID("Clr ")); } catch(ex){}
        try { autoLeading       = textStyle.getBoolean(sTID("autoLeading")); } catch(ex){}
        try { size              = parseInt(textStyle.getUnitDoubleValue(cTID("Sz  ", pts))); } catch(ex){}
        try { leading           = autoLeading ? false : textStyle.getUnitDoubleValue(cTID("Ldng")); } catch(ex){}
        try { text              = ti.contents; } catch(ex){}
        try { font              = textStyle.getString(cTID("FntN")); } catch(ex){}
        try { red               = color.getInteger(cTID("Rd  ")); } catch(ex){}
        try { blue              = color.getInteger(cTID("Bl  ")); } catch(ex){}
        try { green             = color.getInteger(cTID("Grn ")); } catch(ex){}
        try { fill              = textStyle.getString(cTID("Fl  ")); } catch(ex){}

        var details = {
          red               : red,
          blue              : blue,
          green             : green,
          size              : size,
          text              : text,
          font              : font,
          fill              : fill
        };

        ranges.push(details);

        if (size > maxFontSize) {
          maxFontSize = size;
        }

        if (!autoLeading) {
          if (leading > maxLineHeight) {
            maxLineHeight = leading;
          }
        }
      }

      // css uses line-heights and applies them also when the text-layer has a single line
      // whereas adobe has a "leading"-attribute which has no effect for single lines
      // => if we have a single line (probably for button-labels, headings, etc.)
      if (maxLineHeight > outLayer.dimentions.height) {
        // then we expand the height and adjust the position
        outLayer.dimentions.top += (outLayer.dimentions.height - maxLineHeight) / 2;
        outLayer.dimentions.line_height = maxLineHeight;
        outLayer.dimentions.height = maxLineHeight;
      } else if (outLayer.dimentions.height <= maxFontSize + maxFontSize / 3) {
        // we aren't sure whether the layer is single-line but chances are high in this case
        outLayer.dimentions.line_height = outLayer.dimentions.height;
      }

      outLayer.content = ranges;
    } else {
      //#TODO
    }

    layer.visible = false;

    return outLayer;
  }

  return {};
}

function main() {
  var exporter = new JSONExporter("/Users/gogo/Desktop/test.psd");
  exporter.process();
}

main();

