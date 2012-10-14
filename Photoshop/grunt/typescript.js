module.exports = function(grunt) {
  grunt.registerMultiTask('typescript', 'Compile TypeScript files', function() {
    var dest = this.file.dest,
        options = this.data.options,
        extension = this.data.extension;

    var done = this.async();

    grunt.utils.async.forEachSeries(grunt.file.expandFiles(this.file.src), function(filepath, next) {
      grunt.helper('compile', filepath, dest, grunt.utils._.clone(options), extension, function(err, stdout){
        next();
      });
    }, function( err ){
      done();
    });
  });

  grunt.registerHelper('compile', function(src, destPath, options, extension, done) {
    var path = require('path')
    , exec = require('child_process').exec;

    var ext = path.extname(src);
    var newFile;
    if(ext){
      newFile = src.substr(0, src.length - ext.length) + ".js";
    }else{
      newFile = src + ".js";
    }

    exec("tsc --out " + path.join(destPath, newFile) + " " + src, function(err, stdout, stderr){
      if (err || stderr) { done(err || stderr, stdout); return; }
      done(null, stdout);
    });
  });
}
