var gulp = require('gulp'),
	concat = require('gulp-concat'),
	eslint = require('gulp-eslint'),
	stylelint = require('gulp-stylelint');
	ngAnnotate = require('gulp-ng-annotate'),
	KarmaServer = require('karma').Server,
	sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['eslint', 'stylelint'], function() {
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
});

gulp.task('stylelint', function() {
	return gulp.src('css/*.scss')
		.pipe(stylelint({
			reporters: [
			{formatter: 'string', console: true}
			]
		}));
});

gulp.task('watch', ['default'], function() {
	gulp.watch(['js/**/*.js', '!js/public/**/*.js', 'css/*.scss'], ['default']);
});

gulp.task('karma', function(done){
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});
