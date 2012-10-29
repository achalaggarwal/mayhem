var fs = require('fs');

class JSON2IOS {
  constructor(public json:any){
  }

  normalize(data){
    var x1=9999,y1=9999,x2=0,y2=0,control,controls=[],out={};

    if (!data.objects) {

      if(data.type == 'NavigationBar') {
        this.navBar = data;
        console.log(this.navBar);
        return null;
      }

      out.dimensions = { left: data.dimensions.left/2, top: data.dimensions.top/2, width: data.dimensions.width/2, height: data.dimensions.height/2 };
      out.type       = (data.type || 'Image').toLowerCase();
      out.frame      = this.stringify(out.dimensions);

      if (out.type == 'background')
        out.type = 'image';

      if (out.type == 'button') {
        if (data.text) {
          out.background = data.image || "";
        } else {
          out.image = data.image;
        }
      } else {
        out.image = data.image;
      }

      if (data.text) {
        out.text      = data.text.text;
        out.font      = data.text.font;
        out.fontsize  = (data.text.size || 34)/2;
        out.fontcolor = [data.text.red/255, data.text.blue/255, data.text.green/255, 1.0];
      } else if (out.type == 'button' || out.type == "textfield") {
        out.text      = "";
        out.font      = "Helvetica";
        out.fontsize  = 17;
        out.fontcolor = [0, 0, 0, 1.0];
      }

    } else {
      for (var i=0; i< data.objects.length; i++) {
        control  = data.objects[i];
        var normalized_objects = this.normalize(control);
        if (normalized_objects !== null)
          controls = controls.concat(normalized_objects);
      }

      for (var i=0; i< controls.length; i++) {
        control = controls[i];
        if (control.dimensions.left < x1)
          x1 = control.dimensions.left;
        if (control.dimensions.top < y1)
          y1 = control.dimensions.top;
        if (control.dimensions.left + control.dimensions.width > x2)
          x2 = control.dimensions.left + control.dimensions.width;
        if (control.dimensions.top + control.dimensions.height > y2)
          y2 = control.dimensions.top + control.dimensions.height;
      }

      for (var i=0; i< controls.length; i++) {
        control = controls[i];
        control.dimensions.left -= x1;
        control.dimensions.top  -= y1;
        control.frame = this.stringify(control.dimensions);
      }

      out.dimensions = { left: x1, top: y1, width: (x2-x1), height: (y2-y1) };
      out.frame      = this.stringify(out.dimensions);
      out.type       = 'view';
      out.objects    = controls;
    }

    return out;
  }

  stringify (dimensions) {
    return "{{x1,y1},{width,height}}".replace('x1', dimensions.left).replace('y1', dimensions.top).replace('width', dimensions.width).replace('height', dimensions.height)
  }

  convert(){
    this.data         = this.normalize(this.json);
    this.data.appname = "TestApp";

    if (this.navBar) {
      this.data.navbar  = {
        "hidden"            : (this.navBar.image.length > 0)? 0:1,
        "background"        : this.navBar.image
      };

      if(this.navBar.image.length > 0) {
        for (var i=0; i< this.data.objects.length; i++) {
          var _object = this.data.objects[i];
          _object.dimensions.top -= 44;
          _object.frame      = this.stringify(_object.dimensions);
        }
      }
    } else {
      this.data.navbar  = {
        "hidden"            : 1,
        "background"        : null
      };
    }

    this.data.device = 0;
    this.data.width  = this.json.dimensions.width/2;
    this.data.height = this.json.dimensions.height/2;

    return this.data;
  }
}

exports.JSON2IOS = JSON2IOS;
