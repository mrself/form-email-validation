var gulp = require('gulp'),
	Browserify = require('gulp.browserify--adapter'),
	browserSync = require('browser-sync');

gulp.task('browser-test', function() {
	Browserify.run({
		entry: './browser-test/index.js'
	});
	Browserify.run({
		entry: './browser-test/faker.js'
	});

	browserSync.init({
		server: './browser-test',
		open: false,
		files: ['browser-test']
	});
});