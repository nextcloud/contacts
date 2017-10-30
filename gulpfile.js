var gulp = require('gulp'),
	concat = require('gulp-concat'),
	eslint = require('gulp-eslint'),
	stylelint = require('gulp-stylelint');
	ngAnnotate = require('gulp-ng-annotate'),
	merge = require('merge-stream'),
	KarmaServer = require('karma').Server,
	sourcemaps = require('gulp-sourcemaps');

var dependencies = require('./vendorScripts.json');

gulp.task('build', function() {
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

gulp.task('vendor', function() {
	let stream = require('merge-stream')();;

	for(let dependency in dependencies.scripts) {
		stream.add(
			gulp.src(dependencies.scripts[dependency])
				.pipe(gulp.dest(`js/vendor/${dependency}`))
		);
	}

	for(let dependency in dependencies.styles) {
		stream.add(
			gulp.src(dependencies.styles[dependency])
				.pipe(gulp.dest(`css/vendor/${dependency}`))
		);
	}

	return stream;
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

gulp.task('karma', function(done){
	new KarmaServer({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done).start();
});


gulp.task('default', ['vendor', 'eslint', 'stylelint', 'build']);

gulp.task('test', ['karma']);

gulp.task('watch', ['default'], function() {
	gulp.watch(['js/**/*.js', '!js/public/**/*.js', 'css/*.scss'], ['eslint', 'stylelint', 'build']);
});
