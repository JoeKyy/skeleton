var gulp = require('gulp'),
  sass = require('gulp-sass'),
  browserSync = require('browser-sync'),
  useref = require('gulp-useref'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  uglifycss = require('gulp-uglifycss'),
  gulpIf = require('gulp-if'),
  imagemin = require('gulp-imagemin'),
  cache = require('gulp-cache'),
  del = require('del'),
  spritesmith = require('gulp.spritesmith'),
  runSequence = require('run-sequence'),
  install = require("gulp-install");

gulp.task('install', function () {
  return gulp.src(['./package.json'])
    .pipe(install());
});

gulp.task('browserSync', function () {
  browserSync({
    server: {
      baseDir: 'app'
    }
  })
});

gulp.task('sass', function () {
  return gulp.src('app/assets/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('app/assets/css'))
    .pipe(uglifycss({ 'uglyComments': true }))
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('app/assets/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('sprite', function () {
  var spriteData =
    gulp.src('./app/assets/images/sprites/*.*')
      .pipe(spritesmith({
        imgPath: '../assets/images/sprite.png',
        imgName: 'sprite.png',
        cssName: '_sprite.sass',
        cssFormat: 'sass',
        algorithm: 'binary-tree',
        cssTemplate: 'sass.template.mustache',
        cssVarMap: function (sprite) {
          sprite.name = sprite.name
        }
      }));

  spriteData.img.pipe(gulp.dest('./app/assets/images/'));
  spriteData.css.pipe(gulp.dest('./app/assets/scss/'));

});

gulp.task('watch', function () {
  gulp.watch('app/assets/images/sprites/*.*', gulp.series('sprite'));
  gulp.watch('app/assets/scss/**/*.scss', gulp.series('sass'));
  gulp.watch('app/assets/scss/**/**/*.scss', gulp.series('sass'))
  gulp.watch('app/*.html').on('change', browserSync.reload);
  gulp.watch('app/assets/js/**/*.js').on('change', browserSync.reload);
});

gulp.task('useref', function () {
  return gulp.src('app/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify().on('error', function (e) {
      console.log(e);
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('css', function () {
  return gulp.src('app/assets/css/*.css')
    .pipe(gulp.dest('dist/assets/css'))
});

gulp.task('images', function () {
  return gulp
    .src('app/assets/images/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(
      cache(
        imagemin({
          interlaced: true
        })
      )
    )
    .pipe(gulp.dest('dist/assets/images'))
})


gulp.task('fonts', function () {
  return gulp.src('app/assets/fonts/**/*')
    .pipe(gulp.dest('dist/assets/fonts'))
})

gulp.task('clean', function () {
  return del.sync('dist').then(function (cb) {
    return cacheopclearAll(cb);
  });
})

gulp.task('clean:dist', function () {
  return del.sync(['dist/**/*', '!dist/assets/images', '!dist/assets/images/**/*']);
});

gulp.task('default', function (callback) {
  runSequence(['sass', 'browserSync', 'sprite'], 'watch',
    callback
  )
})

gulp.task('default',
  gulp.parallel(
    'sass',
    'browserSync',
    'watch',
    'sprite',
  )
);

gulp.task('build',
  gulp.parallel(
    'clean:dist',
    'sass',
    'useref',
    'images',
    'css',
    'fonts',
  ),
);

gulp.task('run', gulp.series(
  'install',
  function (done) {
    done();
  }
));
