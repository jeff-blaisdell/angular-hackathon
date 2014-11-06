
'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var pagespeed = require('psi');
var es = require('event-stream');
var _ = require('lodash');
var runSequence = require('run-sequence');
var reload = browserSync.reload;


var venderScripts = [
  { 'angular': [ 'bower_components/angular/angular.min.js' ] },
  { 'jquery': [ 'bower_components/jquery/dist/jquery.min.js' ] },
  { 'lodash': [ 'bower_components/lodash/dist/lodash.min.js' ] },
  { 'bootstrap': [ 'bower_components/bootstrap/dist/js/bootstrap.js' ] },
  { 'bootstrap-typeahead': [ 'bower_components/mention/bootstrap-typeahead.js' ] },
  { 'mention': [ 'bower_components/mention/mention.js' ] }
];

var venderStyles = [
  { 'bootstrap': [ 'bower_components/bootstrap/dist/**/*.*', '!bower_components/bootstrap/dist/{js/**, .js}' ] }
];

// Prepare vendor scripts.
gulp.task('scripts:vendor', function () {

  var streams = _.map(venderScripts, function(vendor) {
    var name = _.keys(vendor);
    var scripts = vendor[name];
    var target = 'app/scripts/lib'

    return gulp.src(scripts)
        .pipe($.concat(name + '.js'))
        .pipe(gulp.dest(target));
  });

  return es.merge.apply(null, streams);
});

gulp.task('styles:vendor', function () {

  var streams = _.map(venderStyles, function(vendor) {
    var name = _.keys(vendor);
    var styles = vendor[name];
    var target = 'app/styles/lib/' + name;

    return gulp.src(styles)
        .pipe(gulp.dest(target));
  });

  return es.merge.apply(null, streams);
});

// Prepare Angular template cache.
gulp.task('scripts:views', function () {

  var streams = _.map(venderScripts, function(vendor) {
    var name = _.keys(vendor);
    var scripts = vendor[name];
    var target = 'app/scripts'

    return gulp.src('app/scripts/**/*.html')
        .pipe($.minifyHtml())
        .pipe($.angularTemplatecache({
            standalone: true,
            module:     'hackathon.templates',
            root: 'hackathon',
            filename:   'templates.js'
        }))
        .pipe(gulp.dest(target));
  });

  return es.merge.apply(null, streams);
});

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src(['app/scripts/**/*.js', '!app/scripts/lib/**/*.js', '!app/scripts/templates.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jshint.reporter('fail'))
    .pipe(reload({stream: true}));
});

// Optimize Images
gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe(reload({stream: true, once: true}))
    .pipe($.size({title: 'images'}));
});

// Automatically Prefix CSS
gulp.task('styles:css', function () {
  return gulp.src('app/styles/**/*.css')
    .pipe($.autoprefixer('last 1 version'))
    .pipe(gulp.dest('app/styles'))
    .pipe(reload({stream: true}))
    .pipe($.size({title: 'styles:css'}));
});

// Compile Any Other Sass Files You Added (app/styles)
gulp.task('styles:scss', function () {
  return gulp.src(['app/styles/**/*.scss'])
    .pipe($.rubySass({
      style: 'expanded',
      precision: 10,
      loadPath: ['app/styles', 'app/styles/components'],
      sourcemap: true
    }))
    .pipe($.autoprefixer('last 1 version'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size({title: 'styles:scss'}));
});

// Output Final CSS Styles
gulp.task('styles', ['styles:scss', 'styles:css', 'styles:vendor']);

// Scan Your HTML For Assets & Optimize Them
gulp.task('html', [], function () {
  return gulp.src('app/**/*.html')
    .pipe($.useref.assets({searchPath: '{.tmp,app}'}))

    // Safe guard Angular module names against minification.
    .pipe($.if('*.js', $.ngmin()))

    // Concatenate And Minify JavaScript
    .pipe($.if('*.js', $.uglify()))

    // Concatenate And Minify Styles
    .pipe($.if('*.css', $.csso()))
    // Remove Any Unused CSS
    // Note: If not using the Style Guide, you can delete it from
    // the next line to only include styles your project uses.
    .pipe($.useref.restore())
    .pipe($.useref())
    // Update Production Style Guide Paths
    //.pipe($.replace('components/components.css', 'components/main.min.css'))
    // Minify Any HTML
    .pipe($.if('*.html', $.minifyHtml()))
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

gulp.task('build', ['clean'], function () {
    runSequence(
        ['scripts:vendor', 'scripts:views', 'images', 'styles'],
        'html'
    );
});

// Clean Output Directory
gulp.task('clean', function (cb) {
    return gulp.src(['dist/*', '!dist/{.git,.git/**,README.md}', 'app/scripts/lib/*', 'app/styles/lib/*'])
      .pipe($.clean());
});

// Watch Files For Changes & Reload
gulp.task('serve', ['clean', 'build'], function () {
  browserSync.init({
    server: {
      baseDir: ['app', '.tmp']
    },
    notify: false
  });

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(['app/styles/**/*.scss'], ['styles']);
  gulp.watch(['.tmp/styles/**/*.css'], reload);
  gulp.watch(['app/scripts/**/*.js', '!app/scripts/lib/**/*.js'], ['jshint']);
  gulp.watch(['app/scripts/templates**/*.html'], ['scripts:views']);
  gulp.watch(['app/images/**/*'], ['images']);
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  runSequence('styles', ['jshint', 'html', 'images'], cb);
});
