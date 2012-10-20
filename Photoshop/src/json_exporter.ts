class JSONExporter {
  originalRulerUnits: any;
  doc: any;

  constructor(public path:string, public app: any, public preferences: Object){
    this.app.open(new File(path));

    this.originalRulerUnits = this.preferences.rulerUnits;
    this.doc                = this.app.activeDocument;
    this.mainDoc            = this.doc;
    this.doc                = this.mainDoc.duplicate();

    var docFileName   = this.mainDoc.name.replace(/\W+/g, '-');
    this.folder       = new Folder(this.mainDoc.fullName.path +"/"+ docFileName +"-export");
    var imagesFolder  = new Folder(this.folder.fullName +"/images");

    if(!this.folder.exists)
      this.folder.create();

    if(!imagesFolder.exists)
      imagesFolder.create();
  }

  process(){
    this.preferences.rulerUnits = Units.PIXELS;
    var dimentions = { width: parseInt(this.doc.width), height: parseInt(this.doc.height) };
    this.cleanUpLayers(this.doc.layers);
    var traversed = this.traverse(this.doc.layers);
    this.doc.close(SaveOptions.DONOTSAVECHANGES);
    this.mainDoc.close(SaveOptions.DONOTSAVECHANGES);
    traversed = { dimentions: dimentions, layers: traversed };
    this.preferences.rulerUnits = this.originalRulerUnits;
    var file = new File(this.folder.fullName +"/out.json");
    file.open('w');
    file.writeln(js_beautify(JSON.stringify(traversed), {indent_size: 2, indent_char: ' '}));
    file.close();
  }

  guessControl(name) {
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
    } else if (name.indexOf('image') != -1) {
      return "Image";
    } else {
      return null;
    }
  }

  removeControlLayers(layer, helperLayer, helperDoc) {
    var _layer, _remove = [], _properties = null;

    for(var i = 0; i < helperLayer.layers.length; i++) {
      _layer = helperLayer.layers[i];

      if (_layer.kind == LayerKind.TEXT) {
        _remove.push(_layer);
        _properties = this.render(layer.layers[i]);
      } else if (_layer.typename == "LayerSet" && _layer.bounds[0] > 0) {
        _remove.push(_layer);
      }
    }

    this.app.activeDocument = helperDoc;

    for (var i in _remove) {
      _remove[i].remove();
    }

    return _properties;
  }

  trimLayer(layer, doc) {
    doc.crop(layer.bounds);

    var desc = new ActionDescriptor();
    desc.putEnumerated(sTID("trimBasedOn"), sTID("trimBasedOn"), cTID("Trns"));

    desc.putBoolean(cTID("Left"), true);
    desc.putBoolean(cTID("Top "), true);
    desc.putBoolean(cTID("Rght"), false);
    desc.putBoolean(cTID("Btom"), false);

    try {
      executeAction(sTID("trim"), desc, DialogModes.NO);
    } catch(e) {}

    desc.putBoolean(cTID("Left"), false);
    desc.putBoolean(cTID("Top "), false);
    desc.putBoolean(cTID("Rght"), true);
    desc.putBoolean(cTID("Btom"), true);

    try {
      executeAction(sTID("trim"), desc, DialogModes.NO);
    } catch(e) {}
  }

  saveLayerAndClose(layer, doc, name) {
    var imgRelPath         = "images/" + name + ".png";
    layer.path             = this.folder.fullName + "/" + imgRelPath;
    var saveOptions        = new PNGSaveOptions;
    saveOptions.interlaced = false;

    doc.saveAs(new File(layer.path), saveOptions, true, Extension.LOWERCASE);
    doc.close(SaveOptions.DONOTSAVECHANGES);

    return layer.path;
  }

  render(layer, guessedName){
    var isVisible = true; //mLayer.isVisible;

    if (isVisible) {
      this.app.activeDocument = this.doc;
      layer.visible = true;
      this.app.activeDocument.activeLayer = layer;

      var outLayer = {
        type: guessedName,
        layer_name: layer.name.replace(/\W+/g, '-'),
        dimentions: {
          left   : layer.bounds[0].value,
          top    : layer.bounds[1].value,
          width  : layer.bounds[2].value - layer.bounds[0].value,
          height : layer.bounds[3].value - layer.bounds[1].value
        }
      };

      if (layer.kind == LayerKind.TEXT) {

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
        var tsr0 = tsr.getObjectValue(0);

        var textStyle   = null;
        var color       = null;
        var autoLeading = null;
        var size        = null;
        var leading     = null;
        var text        = null;
        var font        = null;
        var red         = null;
        var blue        = null;
        var green       = null;

        try { textStyle   = tsr0.getObjectValue(cTID("TxtS")); } catch(ex){}
        try { color       = textStyle.getObjectValue(cTID("Clr ")); } catch(ex){}
        try { autoLeading = textStyle.getBoolean(sTID("autoLeading")); } catch(ex){}
        try { size        = parseInt(textStyle.getUnitDoubleValue(cTID("Sz  ", pts))); } catch(ex){}
        try { leading     = autoLeading ? false : textStyle.getUnitDoubleValue(cTID("Ldng")); } catch(ex){}
        try { text        = ti.contents; } catch(ex){}
        try { font        = textStyle.getString(cTID("FntN")); } catch(ex){}
        try { red         = color.getInteger(cTID("Rd  ")); } catch(ex){}
        try { blue        = color.getInteger(cTID("Bl  ")); } catch(ex){}
        try { green       = color.getInteger(cTID("Grn ")); } catch(ex){}

        var details = {
          red   : red || 0,
          blue  : blue || 0,
          green : green || 0,
          size  : size,
          text  : text,
          font  : font || 'Helvetica'
        };

        if (size > maxFontSize) {
          maxFontSize = size;
        }

        if (!autoLeading) {
          if (leading > maxLineHeight) {
            maxLineHeight = leading;
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

        outLayer.details = details;

      } else {
        var helperDoc = this.doc.duplicate(),
          helperLayer = helperDoc.activeLayer;

        if (guessedName == 'Button'
         || guessedName == 'TextField'
         || guessedName == 'NavigationBar'
         || guessedName == 'Label') {
          outLayer.text = this.removeControlLayers(layer, helperLayer, helperDoc);
        }

        this.trimLayer(helperLayer, helperDoc);

        if (outLayer.text && outLayer.text.dimentions) {
          outLayer.text.dimentions.left -= outLayer.dimentions.left;
          outLayer.text.dimentions.top -= outLayer.dimentions.top;
        }

        outLayer.dimentions.left  += outLayer.dimentions.width - helperDoc.width.value;
        outLayer.dimentions.top   += outLayer.dimentions.height - helperDoc.height.value;
        outLayer.dimentions.width  = helperDoc.width.value;
        outLayer.dimentions.height = helperDoc.height.value;

        outLayer.image = this.saveLayerAndClose(helperLayer, helperDoc, outLayer.layer_name);
      }

      if (outLayer.dimentions.left < 0) outLayer.dimentions.left = 0;
      if (outLayer.dimentions.top < 0) outLayer.dimentions.top = 0;

      layer.visible = false;

      return outLayer;
    }

    return {};
  }

  cleanUpLayers(layers) {
    var _layer, _mergeLayers = [], _guessedName;

    for(var i = 0; i < layers.length; i++) {
      _layer = layers[i];
      _layer.name = _layer.name + ("-" + Math.random()).replace('0.', '');
      _guessedName = this.guessControl(_layer.name);

      if (_layer.typename == "LayerSet") {
        this.cleanUpLayers(_layer.layers);
      } else {
        var controlName = this.guessControl(_layer.name);
        if (!controlName && _layer.kind != LayerKind.TEXT) {
          _mergeLayers.push(_layer);
        }
      }
    }

    if (_mergeLayers.length > 0) {
      var newLayer = layers.parent.layerSets.add();
      newLayer.name = _mergeLayers[0].name;

      if (newLayer.parent.layers.length > 1) {
        newLayer.move(newLayer.parent.layers[newLayer.parent.layers.length-1], ElementPlacement.PLACEAFTER);
      }

      for(var i in _mergeLayers) {
        _layer = _mergeLayers.reverse()[i];
        _layer.move(newLayer, ElementPlacement.INSIDE);
      }

      newLayer.merge();
    }
  }

  traverse(layers) {
    var layer, parsed = [], name, guessedName;

    for (var i=0; i< layers.length; i++) {
      layer = layers[i];
      name  = layer.name.replace(/\W+/g, '-');
      guessedName = this.guessControl(name);

      if(layer.typename == "LayerSet"
       && guessedName != 'Button'
       && guessedName != 'Switch'
       && guessedName != 'NavigationBar'
       && guessedName != 'TextField'
       && guessedName != 'Label') {
        if (!parsed['objects']) parsed['objects'] = [];
        var x = {};
        var a = this.traverse(layer.layers);
        if (a.length == 1) {
          parsed = parsed.concat(a);
        }
        else  {
          x['objects'] = a;
          parsed = parsed.concat(x);
        }
      } else {
        var a = this.render(layer, guessedName);
        parsed = parsed.concat(a);
      }
    }

    return parsed;
  }
}
