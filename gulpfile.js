var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var replace = require('gulp-replace');

var paths = {
  sass: ['./scss/**/*.scss']
};

function saveConfig(environment) {

  var config = require('./config/' + environment + '.json');

  // Use `constants.js` as the source.
  gulp.src(['constants.js'])

    // Replace all occurrences of @apiUrl@.
    .pipe(replace(/@apiUrl@/g, config.apiUrl))

    // Save the result in www/js.
    .pipe(gulp.dest('www/js'));
}

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

function saveConfig(environment) {

  var config = require('./config/' + environment + '.json');

  // Use `constants.js` as the source.
  gulp.src(['constants.js'])

    // Replace all occurrences of @apiUrl@.
    .pipe(replace(/@apiUrl@/, config.apiUrl))
    .pipe(replace(/@mapboxMapId@/, config.mapboxMapId))
    .pipe(replace(/@mapboxAccessToken@/, config.mapboxAccessToken))

    // Save the result in www/js.
    .pipe(gulp.dest('www/js'));
}

gulp.task('config-development', function(){
  saveConfig('development');
});

gulp.task('config-production', function(){
  saveConfig('production');
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

