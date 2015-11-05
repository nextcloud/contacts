var gulp = require('gulp'),
	concat = require('gulp-concat'),
	notify = require('gulp-notify'),
	jshint = require('gulp-jshint');

gulp.task('js', function() {
	return gulp.src([
			'js/main.js',
			'js/components/**/*.js',
			'js/models/**/*.js',
			'js/services/**/*.js',
			'js/filters/**/*.js'
			])
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('default'))
		.pipe(concat('script.js'))
		.pipe(gulp.dest('js/public'))
		.pipe(notify({message: 'Scripts task complete'}));
});

gulp.task('css', function() {
	return gulp.src([
			'css/**/*.css',
			'!css/public/**.css'
			])
		.pipe(concat('style.css'))
		.pipe(gulp.dest('css/public'))
		.pipe(notify({message: 'Styles task complete'}));
});

gulp.task('watch', function() {
	gulp.watch('js/**/*.js', ['js']);
	gulp.watch('css/**/*.css', ['css']);
});

gulp.task('default', ['js', 'css']);
