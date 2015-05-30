var fs = require("fs");

var path = require("path");

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    stylus: {
      compress: {
        files: [ {
          expand: true,
          cwd: "apps",
          src: [ "**/modules.styl" ],
          dest: "dist/css",
          rename: function(dest, filepath) {
            return path.join(dest, filepath.replace("pages/", "").replace("/modules", ""));
          },
          ext: ".css"
        } ]
      }
    },
    cssmin: {
      compress: {
        files: [ {
          expand: true,
          cwd: "dist/css",
          src: "**/*.css",
          dest: "dist/css",
          ext: ".min.css"
        } ]
      }
    },
    watch: {
      scripts: {
        files: [ "apps/**/common.js", "libs/client/**/*.js" ],
        tasks: [ "combine" ]
      },
      stylesheets: {
        files: [ "**/*.styl" ],
        tasks: [ "stylus" ]
      },
      jade: {
        files: [ "**/*.jade" ],
        tasks: [ "jade" ]
      }
    },
    jade: {
      site: {
        files: {
          "dist/template": [ "modules/**/*.jade" ]
        }
      },
      options: {
        basePath: "modules"
      }
    },
    uglify: {
      compress: {
        files: [ {
          expand: true,
          cwd: "dist/js",
          src: "**/*.js",
          dest: "dist/js",
          ext: ".min.js"
        } ]
      }
    },
    requirejs: {
      std: {
        options: {
          baseUrl: ".",
          dir: "dist/js/temp",
          optimize: "none",
          keepBuildDir: false,
          mainConfigFile: "config.js",
          paths: {
            jquery: "libs/client/jquery-1.11.1",
            "jquery-cookie": "libs/client/jquery-cookie",
            underscore: "libs/client/underscore",
            backbone: "libs/client/backbone",
            oz: "libs/client/oz",
            jaderuntime: "libs/client/runtime"
          },
          modules: [ {
            name: "apps/api/common"
          }, {
            name: "apps/m/common"
          }, {
            name: "apps/manage/common"
          }, {
            name: "apps/www/common"
          }, {
            name: "apps/api/pages/data/main"
          }, {
            name: "apps/api/pages/sign/main"
          }, {
            name: "apps/api/pages/user/main"
          }, {
            name: "apps/m/pages/index/main"
          }, {
            name: "apps/manage/pages/api/main"
          }, {
            name: "apps/manage/pages/crud/main"
          }, {
            name: "apps/manage/pages/index/main"
          }, {
            name: "apps/manage/pages/login/main"
          }, {
            name: "apps/manage/pages/schema/main"
          }, {
            name: "apps/manage/pages/task/main"
          }, {
            name: "apps/www/pages/index/main"
          } ]
        }
      }
    },
    copy: {
      common: {
        expand: true,
        cwd: "dist/js/temp",
        src: [ "apps/**/common.js", "!node_modules/**/*.*" ],
        dest: "dist/js",
        filter: "isFile",
        rename: function(dest, filepath) {
          return path.join(dest, filepath.replace("apps/", "").replace("pages/", "").replace("/modules", ""));
        }
      },
      modules: {
        expand: true,
        cwd: "dist/js/temp",
        src: [ "**/main.js", "!node_modules/**/*.*" ],
        dest: "dist/js",
        filter: "isFile",
        rename: function(dest, filepath) {
          return path.join(dest, filepath.replace("apps/", "").replace("pages/", "").replace("/main", ""));
        }
      }
    },
    clean: {
      js: [ "dist/js/temp" ]
    },
    filerev: {
      options: {
        algorithm: "sha1",
        length: 16
      },
      js: {
        files: [ {
          expand: true,
          cwd: "dist/",
          src: "js/**/*.js",
          dest: "dist",
          filter: function(filepath) {
            return !filepath.match(/\w+\.\w{16}\.js/);
          }
        } ]
      },
      tpl: {
        files: [ {
          expand: true,
          cwd: "dist/",
          src: "template/**/*.js",
          dest: "dist",
          filter: function(filepath) {
            return !filepath.match(/\w+\.\w{16}\.js/);
          }
        } ]
      },
      "tpl-ver": {
        src: "dist/template/tpl-ver.js",
        dest: "dist/template",
        filter: function(filepath) {
          return !filepath.match(/\w+\.\w{16}\.js/);
        }
      },
      css: {
        files: [ {
          expand: true,
          cwd: "dist/",
          src: "css/**/*.css",
          dest: "dist",
          filter: function(filepath) {
            console.log(filepath);
            return !filepath.match(/\w+\.\w{16}\.css/);
          }
        } ]
      }
    },
    "string-replace": {
      src: {
        files: [ {
          expand: true,
          cwd: "./",
          src: [ "**/*.jade", "**/*.html", "!node_modules/**/*.*", "!dist/**/*.*" ],
          dest: "./"
        } ],
        options: {
          replacements: [ {
            pattern: /\/dist\/(.*\.(js|css))/gm,
            replacement: function(match) {
              var file = match.replace(/(.*\.)\w{16}\.(js|css)/, "$1$2");
              ori = file.replace("/dist", "dist");
              console.log(file);
              return grunt.filerev.summary[ori].replace(/^dist/g, "/dist");
            }
          } ]
        }
      }
    },
    newapp: {
      options: {
        dest: ""
      }
    },
    newpage: {
      options: {
        dest: ""
      }
    },
    newmodule: {
      options: {
        modulePath: "modules",
        jsPrefix: "modules/",
        stylPrefix: "../../../../"
      }
    },
    addmodule: {
      options: {
        modulePath: "modules",
        jsPrefix: "modules/",
        stylPrefix: "../../../../",
        path: ""
      }
    },
    rmmodule: {
      options: {
        modulePath: "modules",
        jsPrefix: "modules/",
        stylPrefix: "../../../../",
        path: ""
      }
    }
  });
  grunt.loadNpmTasks("grunt-requirejs");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-stylus");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("private-grunt-jade-runtime");
  grunt.loadNpmTasks("grunt-filerev");
  grunt.loadNpmTasks("grunt-string-replace");
  grunt.loadNpmTasks("grunt-carrier-helper");
  grunt.registerTask("default", [ "watch" ]);
  grunt.registerTask("tpl-ver", function() {
    var summary = grunt.filerev.summary;
    var map = {};
    for (var key in summary) {
      if (key.indexOf("dist/template") == 0) {
        var file = key.replace("dist/template/", "").replace(".js", "");
        var md5File = summary[key].replace("dist/template/", "");
        map[file] = md5File;
      }
    }
    var str = "window.tplMapping = " + JSON.stringify(map);
    fs.writeFileSync("dist/template/tpl-ver.js", str);
  });
  grunt.registerTask("md5", [ "filerev", "tpl-ver", "string-replace" ]);
  grunt.registerTask("combine", [ "requirejs", "copy", "clean" ]);
  grunt.registerTask("build", [ "combine", "stylus", "cssmin", "uglify", "jade", "filerev:tpl", "tpl-ver", "filerev:tpl-ver", "filerev:js", "filerev:css", "string-replace" ]);
};