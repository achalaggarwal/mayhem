var fs = require('fs');

class JSONNormalize {
  constructor(public file_path:string){
    this.json = JSON.parse(fs.readFileSync(file_path));
    this.data = {};
    this.data.width  = this.json.dimensions.width;
    this.data.height = this.json.dimensions.height;
    this.data.objects = [];
  }

  normalize(data){
    var x1=9999,y1=9999,x2=0,y2=0,control,controls=[],out={};

    if (!data.objects) {
      out.dimensions = data.dimensions;
      out.type       = data.type;
      out.frame      = this.stringify(out.dimensions);

      if (data.type == 'Button') {
        if (data.text) {
          out.background = data.image || "";
        } else {
          out.image = data.image;
        }
      } else {
        out.image = data.image;
      }

      if (data.text) {
        out.text = data.text.details.text;
        out.font = data.text.details.font;
        out.fontSize = data.text.details.size || 17;
        out.fontcolor = [data.text.details.red/255, data.text.details.blue/255, data.text.details.green/255, 1.0];
      }

    } else {
      for (var i=0; i< data.objects.length; i++) {
        control  = data.objects[i];
        controls = controls.concat(this.normalize(control));
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

      out.dimensions = { left: x1, top: y1, width: x2-x1, height: y2-y1 };
      out.frame      = this.stringify(out.dimensions);
      out.type       = 'View';
      out.objects    = controls;
    }

    return out;
  }

  stringify (dimensions) {
    return "{{x1,y1},{width,height}}".replace('x1', dimensions.left).replace('y1', dimensions.top).replace('width', dimensions.width).replace('height', dimensions.height)
  }

  start(){
    console.log(JSON.stringify(this.normalize(this.json), null, 2)); 
  }
}


var n = new JSONNormalize('/Users/gogo/Desktop/photoshop/source1-psd-export/out.json');
n.start();
