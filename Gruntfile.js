'use strict';

var path = require('path');

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['api/**/*.js', 'config/*.js', '*.js']
    },
    jasmine_node: {
      projectRoot: './api/controllers',
      specFolders: ['./test/spec']
    },
    express: {
      custom: {
        options: {
          port: 3000,
          server: path.resolve('app')
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-express');

  grunt.registerTask('default', ['jshint', 'jasmine_node']);
  grunt.registerTask('s', ['express', 'express-keepalive']);
};
