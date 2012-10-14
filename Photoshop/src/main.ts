function cTID(s) { return app.charIDToTypeID(s); }
function sTID(s) { return app.stringIDToTypeID(s); }

function main() {
  var exporter = new JSONExporter("~/Desktop/photoshop/source1.psd", app, preferences);
  exporter.process();
  return true;
}

main();
