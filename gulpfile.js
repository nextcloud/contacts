var gulp = require('gulp'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify');

gulp.task('scripts', function() {
	return gulp.src([
			'js/main.js',
			'js/components/**/*.js'
			])
		.pipe(concat('script.js'))
		.pipe(gulp.dest('js/public'))
		.pipe(notify({message: 'Scripts task complete'}));
});
