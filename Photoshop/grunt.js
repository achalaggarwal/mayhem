module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' */'
    },
    concat: {
      dist: {
        src: ['src/js_beautify.js', 'src/json2.js', '<banner:meta.banner>',  'src/psd2json.js'],
        dest: 'dist/psd2json.jsx'
      }
    },
    watch: {
      files: ['src/js_beautify.js', 'src/json2.js', 'src/psd2json.js'],
      tasks: 'concat'
    }
  });
};
