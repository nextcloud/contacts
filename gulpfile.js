var gulp = require('gulp'),
	concat = require('gulp-concat'),
	eslint = require('gulp-eslint'),
	ngAnnotate = require('gulp-ng-annotate'),
	KarmaServer = require('karma').Server,
	sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['eslint'], function() {
	return gulp.src([
			'js/main.js',
			'js/components/**/*.js',
			'js/models/**/*.js',
			'js/services/**/*.js',
			'js/filters/**/*.js'
			])
		// concat (+sourcemaps)
		.pipe(sourcemaps.init())
			.pipe(ngAnnotate({ single_quotes: true }))
			.pipe(concat('script.js'))
		.pipe(sourcemaps.write())

		.pipe(gulp.dest('js/public'));
});

gulp.task('eslint', function() {
	return gulp.src([
			'js/main.js',
			'js/components/**/*.js',
			'js/models/**/*.js',
			'js/services/**/*.js',
			'js/filters/**/*.js'
			])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
})

gulp.task('watch', ['js'], function() {
	gulp.watch(['js/**/*.js', '!js/public/**/*.js'], ['js']);
});

gulp.task('karma', (done) => {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});
