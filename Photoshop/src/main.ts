function cTID(s) { return app.charIDToTypeID(s); }
function sTID(s) { return app.stringIDToTypeID(s); }

function main(options:string) {
  var exporter = new PSD2JSON(options, app, preferences);
  exporter.process();
  return true;
}

function parsePreferences() {
  var b = new File("~/psd2json.json");
  b.open('r');
  var str = "";
  while(!b.eof)
  str += b.readln();
  b.close();
  return JSON.parse(str);
}

main(parsePreferences());
