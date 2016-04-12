module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: ['public']
    },
    concat: {
      dist: {
        src: ['app/scripts/*.js'],
        dest: 'public/js/main.js'
      }
    },
    copy: {
      dist: {
        files: [{
          cwd: 'app/',
          expand: true,
          src: ['images/*'],
          dest: 'public/'
        }]
      }
    },
    express: {
      options: {
        script: 'index.js'
      },
      dev: {
        options: {
          args: ['dev']
        }
      },
      dist: {
        options: {
          args: ['dist']
        }
      }
    },
    includeSource: {
      dev: {
        options: {
          basePath: 'app',
          baseUrl: '/'
        },
        files: {
          'app/index.html': 'app/template.index.html'
        }
      },
      dist: {
        options: {
          basePath: 'public',
          baseUrl: '/'
        },
        files: {
          'public/index.html': 'app/template.index.html'
        }
      },
      options: {
        templates: {
          html: {
            html: '<script type="text/html" id="{filePath}">{fileContent}</script>'
          }
        }
      }
    },
    jshint: {
      files: {
        src: ['app/**/*.js', '!app/vendor/**/*.js']
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        port: 9999,
        singleRun: true,
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],
        plugins: ['karma-jasmine', 'karma-phantomjs-launcher']
      }
    },
    watch: {
      html: {
        files: ['app/*.html'],
        tasks: ['includeSource:dev', 'wiredep:dev'],
        options: {
          livereload: 1338
        }
      },
      javascript: {
        files: ['!app/**/*.test.js', 'app/**/*.js'],
        tasks: ['jshint'],
        options: {
          livereload: 1338
        }
      },
      javascriptTests: {
        files: ['app/**/*.test.js'],
        tasks: ['wiredep:dev', 'karma'],
        options: {
          livereload: 1338
        }
      },
      sass: {
        files: ['app/styles/**/*.scss'],
        tasks: ['sass:dev'],
        options: {
          livereload: 1338
        }
      }
    },
    wiredep: {
      dev: {
        src: [
          'app/index.html',
          'karma.conf.js'
        ],
        fileTypes: {
          js: {
            block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
            detect: {
                js: /'(.*\.js)'/gi
            },
            replace: {
                js: '\'{{filePath}}\','
            }
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-include-source');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-wiredep');

  grunt.registerTask('no-default', function () {
    console.log('Default tasks are for the bad kind of lazy programmer. For shame!')
  });

  grunt.registerTask('default', ['no-default']);
  grunt.registerTask('dev', ['express:dev', 'jshint', 'includeSource:dev', 'wiredep:dev', 'watch']);
  grunt.registerTask('dist', ['express:dist', 'clean', 'concat:dist', 'copy:dist', 'includeSource:dist', 'wiredep:dist', 'karma']);
};
