var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    less = require('gulp-less'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    markdown = require('gulp-markdown'),
    convert = require('gulp-convert'),
    imagemin = require('gulp-imagemin'),
    changed    = require('gulp-changed'),
    replace = require('gulp-replace'),
    jsoncombine = require("gulp-jsoncombine"),
    jsonmin = require('gulp-jsonmin'),
    fs = require('fs'),
    del = require('del'),
    _ = require('lodash'),
    config = require('./src/scripts/config.js');


var jsMain = [
    'bower_components/jquery/dist/jquery.js',
    'bower_components/bootstrap/js/transition.js',
    'bower_components/bootstrap/js/button.js',
    'bower_components/bootstrap/js/collapse.js',
    'bower_components/bootstrap/js/dropdown.js',
    'bower_components/bootstrap/js/tooltip.js',
    'bower_components/bootstrap/js/popover.js',
    'bower_components/d3/d3.js',
    'bower_components/leaflet/dist/leaflet.js',
    'bower_components/leaflet.locatecontrol/src/L.Control.Locate.js',
    'bower_components/jquery.scrollTo/jquery.scrollTo.js',
    'bower_components/chosen-build/chosen.jquery.js',
    'bower_components/lodash/lodash.js',
    'bower_components/topojson/topojson.js',
    'bower_components/L.EasyButton/easy-button.js',
    'src/scripts/vendor/log.js',
    'src/scripts/vendor/Object.observe.poly.js',
    'src/scripts/vendor/jquery-ui-1.10.3.custom.min.js',
    'src/scripts/vendor/table2CSV.js',
    'src/scripts/vendor/Chart.js',
    'src/scripts/vendor/typeahead.js',
    'src/scripts/vendor/jquery-tourbus.js',
    'src/scripts/vendor/classlist.js',
    'src/scripts/functions/calculations/*.js',
    'src/scripts/functions/*.js',
    'src/scripts/config.js',
    'src/scripts/main.js'
];

var jsReport = [
    'bower_components/jquery/dist/jquery.js',
    'bower_components/bootstrap/js/button.js',
    'bower_components/leaflet/dist/leaflet.js',
    'bower_components/Leaflet.label/dist/leaflet.label.js',
    'bower_components/topojson/topojson.js',
    'bower_components/lodash/lodash.js',
    'src/scripts/vendor/Chart.js',
    'src/scripts/functions/calculations/*.js',
    'src/scripts/functions/generics.js',
    'src/scripts/functions/calculations.js',
    'src/scripts/config.js',
    'src/scripts/report.js'
];


// Unit tests
gulp.task('test-build', function() {
    return gulp.src(_.without(jsMain, 'src/scripts/main.js'))
        .pipe(concat('app.js'))
        .pipe(gulp.dest('src/tests'));
});
gulp.task('qunit', function() {
    // fire up qunit page
    browserSync(['./src/tests/*.*'], {
        server: {
            baseDir: "./src/tests"
        }
    });
});

// Web server
gulp.task('browser-sync', function() {
    browserSync(['./dist/**/*.css', './dist/**/*.js', './dist/**/*.html'], {
        server: {
            baseDir: "./dist"
        }
    });
});


// Less processing
gulp.task('less', function() {
    return gulp.src(['src/less/main.less', 'src/less/report.less'])
        .pipe(less())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(gulp.dest('dist/css'));
});
gulp.task('less-build', function() {
    return gulp.src(['src/less/main.less', 'src/less/report.less'])
        .pipe(less())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(minifycss())
        .pipe(gulp.dest('dist/css'));
});

// JavaScript
gulp.task('js', function() {
    gulp.src(jsMain)
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist/js'));
    return gulp.src(jsReport)
        .pipe(concat('report.js'))
        .pipe(gulp.dest('dist/js'));
});
gulp.task('js-build', function() {
    gulp.src(jsReport)
        .pipe(concat('report.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
    return gulp.src(jsMain)
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

// markdown
gulp.task('markdown', ['clean'], function() {
    return gulp.src('src/data/meta/*.md')
        .pipe(markdown())
        .pipe(gulp.dest('dist/data/meta/'));
});

// CSV to JSON
gulp.task('convert', ['clean'], function() {
    return gulp.src('src/data/metric/*.csv')
        .pipe(convert({
            from: 'csv',
            to: 'json'
        }))
        .pipe(jsonmin())
        .pipe(gulp.dest('dist/data/metric/'));
});

// merge json
gulp.task('merge-json', ['clean', 'convert'], function() {
    return gulp.src("dist/data/metric/*.json")
        .pipe(jsoncombine("merge.json", function(data){ return new Buffer(JSON.stringify(data)); }))
        .pipe(jsonmin())
        .pipe(gulp.dest("dist/data"));
});

// image processing
gulp.task('imagemin', function() {
    return gulp.src('src/images/build/*')
        .pipe(changed('dist/images'))
        .pipe(imagemin({
            optimizationLevel: 5,
            svgoPlugins: [{removeViewBox: false}]
        }))
        .pipe(gulp.dest('dist/images'));
});

// cache busting
gulp.task('replace', function() {
    return gulp.src('src/*.html')
        .pipe(replace("{{cachebuster}}", Math.floor((Math.random() * 100000) + 1)))
        .pipe(replace("{{neighborhoodDescriptor}}", config.neighborhoodDescriptor))
        .pipe(replace("{{gaKey}}", config.gaKey))
        .pipe(gulp.dest('dist/'));
});

// watch
gulp.task('watch', function () {
    gulp.watch(['./src/*.html'], ['replace']);
    gulp.watch(['./src/less/**/*.less'], ['less']);
    gulp.watch('src/scripts/**/*.js', ['js', 'test-build']);
});

// rename files for basic setup
gulp.task('init', function() {
    // make sure people don't run this twice and end up with no search.js
    fs.exists('src/scripts/functions/search.js.basic', function(exists) {
        if (exists) {
            console.log("renaming search files...");
            // rename mecklenburg search file to search.js.meck
            fs.rename('src/scripts/functions/search.js', 'src/scripts/functions/search.js.advanced', function(err) {
                if ( err ) { console.log('ERROR: ' + err); }
            });
            // rename default search file to search.js
            fs.rename('src/scripts/functions/search.js.basic', 'src/scripts/functions/search.js', function(err) {
                if ( err ) { console.log('ERROR: ' + err); }
            });
        }
  });
});

// clean junk before build
gulp.task('clean', function(cb) {
    del([
    'dist/data/meta/*.html',
    'dist/data/metric/*.json',
    'dist/data/merge.json'
  ], cb);
});

// clean data out for new location
gulp.task('clean-data', function(cb) {
    del([
    'src/data/meta/*.md',
    'src/data/metric/*.csv',
    'dist/data/geography.topo.json'
  ], cb);
});


// controller tasks
gulp.task('default', ['less', 'js', 'replace', 'watch', 'browser-sync']);
gulp.task('build', ['less-build', 'js-build', 'replace', 'imagemin']);
gulp.task('datagen', ['clean', 'markdown', 'convert', 'merge-json']);
gulp.task('test', ['test-build', 'qunit', 'watch']);
