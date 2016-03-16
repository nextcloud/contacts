var gulp = require('gulp'),
	concat = require('gulp-concat'),
	eslint = require('gulp-eslint'),
	sourcemaps = require('gulp-sourcemaps');

gulp.task('js', function() {
	return gulp.src([
			'js/main.js',
			'js/components/**/*.js',
			'js/models/**/*.js',
			'js/services/**/*.js',
			'js/filters/**/*.js'
			])
		// ESlint
		.pipe(eslint())
		.pipe(eslint.format())

		// concat (+sourcemaps)
		.pipe(sourcemaps.init())
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

gulp.task('default', ['js']);
