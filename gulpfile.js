import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import { deleteSync } from 'del';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import browserSync from 'browser-sync';
import useref from 'gulp-useref';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import uglifycss from 'gulp-uglifycss';
import gulpIf from 'gulp-if';
import cache from 'gulp-cache';
import spritesmith from 'gulp.spritesmith';
import runSequence from 'run-sequence';
import install from 'gulp-install';

const sass = gulpSass( dartSass );

gulp.task('install', function () {
  return gulp.src(['./package.json']).pipe(install());
});

gulp.task('browserSync', function () {
  browserSync.init({
    server: {
      baseDir: 'app',
    },
  });
});

gulp.task('sass', function (done) {
  gulp
    .src('app/assets/scss/*.*')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('app/assets/css'))
    .pipe(uglifycss({ uglyComments: true }))
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('app/assets/css'))
    .pipe(browserSync.reload({ stream: true }));
  done();
});

gulp.task('sprite', function (done) {
  const spriteData = gulp
    .src('./app/assets/images/sprites/*.*')
    .pipe(
      spritesmith({
        imgPath: '../../assets/images/sprite.png',
        imgName: 'sprite.png',
        cssName: '_sprite.scss',
        cssFormat: 'scss',
        algorithm: 'binary-tree',
        cssTemplate: 'sass.template.mustache',
        cssVarMap: function (sprite) {
          sprite.name = sprite.name;
        },
      })
    );

  spriteData.img.pipe(gulp.dest('./app/assets/images/'));
  spriteData.css.pipe(gulp.dest('./app/assets/scss/'));
  done();
});


gulp.task('watch', function () {
  gulp.watch('app/assets/images/sprites/*.*', gulp.series('sprite')).on('change', browserSync.reload);

  gulp.watch([
    'app/assets/scss/*.*',
    'app/assets/scss/**/*.*',
    'app/assets/scss/**/**/*.*'
  ], gulp.series('sass')).on('change', browserSync.reload);

  gulp.watch('app/*.html').on('change', browserSync.reload);

  gulp.watch([
    'app/assets/js/*.js',
    'app/assets/js/**/*.js',
  ]).on('change', browserSync.reload);
});


gulp.task('useref', function () {
  return gulp
    .src('app/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify().on('error', function (e) {
      console.log(e);
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('css', function () {
  return gulp.src('app/assets/css/*.css').pipe(gulp.dest('dist/assets/css'));
});

gulp.task('images', function () {
  return gulp
    .src('app/assets/images/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(
      cache(
        imagemin({
          interlaced: true,
        })
      )
    )
    .pipe(gulp.dest('dist/assets/images'));
});

gulp.task('fonts', function () {
  return gulp.src('app/assets/fonts/**/*').pipe(gulp.dest('dist/assets/fonts'));
});

gulp.task('clean', function () {
  return deleteSync('dist').then(function () {
    cache.clearAll();
  });
});

gulp.task('clean:dist', function () {
  return deleteSync(['dist/**/*', '!dist/assets/images', '!dist/assets/images/**/*']);
});

gulp.task('default', gulp.series(
  'sass',
  'sprite',
  gulp.parallel(
    'browserSync',
    'watch',
  )
));

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

