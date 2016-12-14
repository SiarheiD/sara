'use strict';

var gulp = require('gulp'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    rigger = require('gulp-rigger'),
    cssmin = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    rimraf = require('rimraf'),
    browserSync = require("browser-sync"),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    gulpPath = require('path'),
        img64 = require('gulp-img64'),
        inlinesource = require('gulp-inline-source'),
    reload = browserSync.reload;

var path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        video: 'build/video/',
        php: 'build/php/',
        purecss: 'build/css/',
        fonts: 'build/fonts/',
        b64html: 'htmlonly/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/*.js',
        style: 'src/style/main.scss',
        img: 'src/img/*.*',
        video: 'src/video/*.*',
        php: 'src/php/*.php',
        purecss: 'src/style/*.css',
        fonts: 'src/fonts/**/*.*',
        svg: 'src/img/svg_sprite/*.*',
        b64html: 'src/*.html'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/style/**/*.scss',
        img: 'src/img/*.*',
        video: 'src/video/*.*',
        php: 'src/php/*.*',
        purecss: 'src/style/*.css',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './build'
};

var config = {
    server: {
        baseDir: "./build"
    },
    tunnel: false,
    host: 'localhost',
    port: 9000
};

gulp.task('webserver', function () {
    browserSync(config);
});

gulp.task('htmlonly', function(){
    gulp.src('build/*.html')
        .pipe(inlinesource())
        .pipe(img64())
        .pipe(gulp.dest(path.build.b64html));
});

gulp.task('b64', function(){
    gulp.src(path.src.b64html)
        .pipe(img64())
        .pipe(gulp.dest(path.build.b64html));
});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('html:build', function () {
    gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));
});

gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
});

gulp.task('style:build', function () {
    gulp.src(path.src.style)
        .pipe(sass({
            includePaths: ['src/style/'],
            outputStyle: 'compressed',
            sourceMap: true,
            errLogToConsole: true
        }))
        .pipe(prefixer({
          browsers: ['last 15 versions'],
          cascade: false
        }))
        .pipe(cssmin())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});

gulp.task('image:build', function () {
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
});

gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});

gulp.task('php:build', function() {
    gulp.src(path.src.php)
        .pipe(gulp.dest(path.build.php))
});

gulp.task('video:build', function() {
    gulp.src(path.src.video)
        .pipe(gulp.dest(path.build.video))
});

gulp.task('purecss:build', function() {
    gulp.src(path.src.purecss)
        .pipe(gulp.dest(path.build.purecss))
});

gulp.task('svgstore', function () {
    return gulp
        .src('src/img/svg_sprite/*.svg')
        .pipe(svgmin(function (file) {
            var prefix = gulpPath.basename(file.relative,  gulpPath.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: true
                    }
                }]
            }
        }))
        .pipe(svgstore())
        .pipe(gulp.dest('src/img'));
});

gulp.task('build', [
    'html:build',
    'js:build',
    'style:build',
    'fonts:build',
    'image:build',
    'video:build',
    'php:build',
    'purecss:build'
]);


gulp.task('watch', function(){
    watch([path.watch.html], function(event, cb) {
            gulp.start('html:build');
    });
    watch([path.watch.style], function(event, cb) {
        setTimeout(function(){
            gulp.start('style:build');
        }, 300);
    });
    watch([path.watch.js], function(event, cb) {
        setTimeout(function(){
            gulp.start('js:build');
        }, 300);
    });
    watch([path.watch.php], function(event, cb) {
        setTimeout(function(){
            gulp.start('php:build');
        }, 300);
    });
    watch([path.watch.purecss], function(event, cb) {
        setTimeout(function(){
            gulp.start('purecss:build');
        }, 300);
    });
    watch([path.watch.img], function(event, cb) {
        gulp.start('image:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
});


gulp.task('default', ['build', 'webserver', 'watch']);
