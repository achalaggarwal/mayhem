module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Project metadata, used by the <banner> directive.
    meta: {},
    // Lists of files to be concatenated.
    concat: {
      dist: {
        src: ['src/js_beautify.js', 'src/json2.js', 'src/psd2json.js'],
        dest: 'dist/psd2json.jsx'
      }
    }
  });
};
