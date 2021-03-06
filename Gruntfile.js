module.exports = function (grunt) {

    'use strict';

    var banner = '/* Greg Davies CV */\n'
            + '/* <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        paths = {
            home: process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'],
            css: grunt.file.expand([
                'src/public/vendor/bootstrap/dist/css/bootstrap.css',
                'src/public/module/**/*.css'
            ]),
            js: grunt.file.expand([
                'src/public/vendor/jquery/dist/jquery.js',
                'src/public/vendor/angular/angular.js',
                'src/public/vendor/angular-route/angular-route.js',
                'src/public/vendor/bootstrap/dist/js/bootstrap.js',
                'src/public/module/*/module.js',
                'src/public/module/**/*.js',
                'src/public/data/application.js'
            ])
        };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/public/vendor/bootstrap/dist/fonts/',
                        src: ['**'],
                        dest: 'dist/fonts/'
                    }
                ]
            }
        },
        cssmin: {
            dist: {
                options: {
                    banner: banner
                },
                files: {
                    'dist/css/min.css': paths.css
                }
            }
        },
        jslint: {
            client: {
                src: [ 'src/public/module/**/*.js' ],
                directives: {
                    browser: true,
                    predef: [
                        "angular"
                    ]
                }
            },
            grunt: {
                src: [ 'Gruntfile.js', 'src/template/data/*.js', 'src/template/data/**/*.js' ],
                directives: { node: true }
            }
        },
        ngtemplates: {
            application: {
                cwd:    'src/public',
                src:    'module/**/*.html',
                dest:   'dist/min.js',
                options:  {
                    append: true,
                    htmlmin: {
                        collapseBooleanAttributes:      true,
                        collapseWhitespace:             true,
                        removeAttributeQuotes:          true,
                        removeComments:                 true, // Only if you don't use comment directives! 
                        removeEmptyAttributes:          true,
                        removeRedundantAttributes:      true,
                        removeScriptTypeAttributes:     true,
                        removeStyleLinkTypeAttributes:  true
                    }
                }
            }
        },
        template: {
            dev: {
                options: {
                    data: {
                        prefix: 'src/public/',
                        paths: paths
                    }
                },
                files: {
                    'src/public/index.html': ['src/template/index.html.tpl']
                }
            }
        },
        uglify: {
            options: {
                banner: banner
            },
            dist: {
                files: {
                    'dist/min.js': paths.js
                }
            }
        },
        watch: {
            bootstrap: {
                files: '<%= jslint.client.src %>',
                tasks: [ 'template:dev', 'jslint:client' ]
            },
            bower: {
                files: [ 'bower.json' ],
                tasks: [ 'bower' ]
            },
            gruntfile: {
                files: '<%= jslint.grunt.src %>',
                tasks: [ 'jslint:grunt' ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-template');

    // By default, generate dev template
    grunt.registerTask('default', [ 'template:dev' ]);

    // Distribution code generation
    grunt.registerTask('dist', [
        'jslint',
        'copy:dist',
        'uglify',
        'ngtemplates:application',
        'cssmin',
        'template:dist'
    ]);

    // Deploys dist code to Google Drive
    grunt.registerTask('deploy', [ 'copy:deploy' ]);
};
