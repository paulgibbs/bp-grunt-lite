/* jshint node:true */
module.exports = function( grunt ) {
	var SOURCE_DIR = '',
	BUILD_DIR = 'build/',

	BP_CSS = [
		'bp-activity/admin/css/*.css',
		'bp-core/admin/css/*.css',
		'bp-core/css/*.css',
		'bp-groups/admin/css/*.css',
		'bp-messages/css/*.css',
		'bp-templates/bp-legacy/css/*.css',
		'bp-xprofile/admin/css/*.css'
	],

	BP_JS = [
		'bp-activity/admin/js/*.js',
		'bp-core/js/*.js',
		'bp-friends/js/*.js',
		'bp-groups/admin/js/*.js',
		'bp-groups/js/*.js',
		'bp-messages/js/*.js',
		'bp-templates/bp-legacy/js/*.js',
		'bp-xprofile/admin/js/*.js'
	],

	BP_EXCLUDED_FILES = [
		// Ignore these
		'!tests/**',  // unit tests
		'!Gruntfile.js',
		'!package.json',
		'!.gitignore',
		'!.jshintrc',
		'!.travis.yml',

		// And these from .gitignore
		'!**/.{svn,git}/**',
		'!lib-cov/**',
		'!*.seed',
		'!*.log',
		'!*.csv',
		'!*.dat',
		'!*.out',
		'!*.pid',
		'!*.gz',
		'!pids/**',
		'!logs/**',
		'!results/**',
		'!.DS_Store',
		'!node_modules/**',
		'!npm-debug.log',
		'!build/**'
	];

	// Load tasks.
	require( 'matchdep' ).filterDev( 'grunt-*' ).forEach( grunt.loadNpmTasks );

	// Project configuration.
	grunt.initConfig({
		clean: {
			all: [ BUILD_DIR ]
		},
		copy: {
			files: {
				files: [
					{
						cwd: SOURCE_DIR,
						dest: BUILD_DIR,
						dot: true,
						expand: true,
						src: new Array( '**' ).concat( BP_EXCLUDED_FILES )
					}
				]
			}
		},
		cssjanus: {
			core: {
				expand: true,
				cwd: BUILD_DIR,
				dest: BUILD_DIR,
				ext: '-rtl.css',
				src: BP_CSS,
				options: { generateExactDuplicates: true }
			}
		},
		cssmin: {
			css: {
				cwd: BUILD_DIR,
				dest: BUILD_DIR,
				expand: true,
				src: BP_CSS,
				options: { banner: '/*! https://wordpress.org/plugins/buddypress/ */' }
			}
		},
		jshint: {
			options: grunt.file.readJSON( '.jshintrc' ),
			core: {
				expand: true,
				cwd: SOURCE_DIR,
				src: BP_JS,

				/**
				 * Limit JSHint's run to a single specified file: grunt jshint:core --file=filename.js
				 *
				 * @param {String} filepath
				 * @returns {Bool}
				 */
				filter: function( filepath ) {
					var index, file = grunt.option( 'file' );

					// Don't filter when no target file is specified
					if ( ! file ) {
						return true;
					}

					// Normalise filepath for Windows
					filepath = filepath.replace( /\\/g, '/' );
					index = filepath.lastIndexOf( '/' + file );

					// Match only the filename passed from cli
					if ( filepath === file || ( -1 !== index && index === filepath.length - ( file.length + 1 ) ) ) {
						return true;
					}

					return false;
				}
			}
		},
		jsvalidate:{
			options:{
				globals: {},
				esprimaOptions:{},
				verbose: false
			},
			build: {
				files: { src: BUILD_DIR + '/**/*.js' }
			},
			dev: {
				files: { src: BP_JS }
			}
		},
		uglify: {
			core: {
				cwd: BUILD_DIR,
				dest: BUILD_DIR,
				expand: true,
				src: BP_JS
			},
			options: {
				banner: '/*! https://wordpress.org/plugins/buddypress/ */\n'
			}
		},
		phpunit: {
			'default': {
				cmd: 'phpunit',
				args: ['-c', 'tests/phpunit.xml']
			},
			multisite: {
				cmd: 'phpunit',
				args: ['-c', 'tests/multisite.xml']
			}
		},
		exec: {
			bbpress: {
				command: 'svn export https://bbpress.svn.wordpress.org/tags/1.2 bbpress',
				cwd: BUILD_DIR + 'bp-forums',
				stdout: false
			}
		}
	});


	grunt.registerMultiTask( 'phpunit', 'Runs PHPUnit tests, including the ajax and multisite tests.', function() {
		grunt.util.spawn( {
			cmd:  this.data.cmd,
			args: this.data.args,
			opts: { stdio: 'inherit' }
		}, this.async() );
	});

	// Build tasks.
	grunt.registerTask( 'dev',     [ 'clean:all', 'jsvalidate:dev' ] );
	grunt.registerTask( 'test',    [ 'phpunit' ] );
	grunt.registerTask( 'release', [ 'clean:all', 'phpunit', 'copy:files', 'cssjanus:core', 'cssmin:css', 'jsvalidate:build', 'uglify:core', 'exec:bbpress' ] );

	// Default task.
	grunt.registerTask( 'default', [ 'dev' ] );
};