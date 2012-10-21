module.exports = function(grunt) {
  grunt.loadTasks('./grunt');

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
    typescript: {
      base: {
        src: ['src/json_exporter.ts', 'src/main.ts', 'src/json_normalize.ts', 'src/psd_to_ios.ts'],
        dest: 'lib'
      }
    },
    concat: {
      dist: {
        src: ['lib/js_beautify.js', 'lib/json2.js', 'lib/async.min.js', '<banner:meta.banner>', 'lib/src/json_exporter.js', 'lib/src/main.js'],
        dest: 'dist/psd2json.jsx'
      }
    },
    watch: {
      files: ['src/json_exporter.ts', 'src/main.ts', 'src/json_normalize.ts', 'src/psd_to_ios.ts'],
      tasks: 'typescript concat'
    }
  });

  grunt.registerTask('default', 'typescript concat');
};
