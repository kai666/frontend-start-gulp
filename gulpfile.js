const path = require('path')
const gulp = require('gulp')
const watch = require('gulp-watch')
const gutil = require('gulp-util')
const concat = require('gulp-concat')
const sass = require('gulp-sass')
const sourcemaps = require('gulp-sourcemaps')
const htmlmin = require('gulp-htmlmin')
const imagemin = require('gulp-imagemin')
const connect = require('gulp-connect')
const babel = require('gulp-babel')
const babelify = require('babelify')
const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const source = require('vinyl-source-stream')
const watchify = require('watchify')
const uglify = require('gulp-uglify')
const gulpif = require('gulp-if')
const gnf = require('gulp-npm-files')
const del = require('del')

const srcDir = path.resolve(__dirname, 'src')
const builtDir = path.resolve(__dirname, 'built')
const productionDir = path.resolve(builtDir, 'production')
const developmentDir = path.resolve(builtDir, 'development')
const envDir = process.env.NODE_ENV === 'production' ? productionDir : developmentDir
const destDir = path.resolve(envDir, 'dist')

const paths = {
  html: [srcDir + '/*.html'],
  img: [srcDir + '/images/**/*'],
  js: [srcDir + '/scripts/app.js'],
  scss: [srcDir + '/styles/sass/**/*.scss'],
}

const jsDistFile = process.env.NODE_ENV === 'production' ? 'app.min.js' : 'app.js'

gulp.task('env', () => {
  gutil.log('NODE_ENV is ' + process.env.NODE_ENV)
})

// console.log(gutil.env.type === 'production')
// .pipe(gutil.env.type === 'production' ? sass({outputStyle: 'compressed'}) : gutil.noop())
// 'node_modules/bootstrap/dist/css/bootstrap.min.css'

// gulp.task('concat', () => {
//   gulp.src([
//     srcDir + '/scripts/1.js',
//     srcDir + '/scripts/2.js',
//   ])
//     .pipe(concat('app.js'))
//     .on('error', gutil.log)
//     .pipe(gulp.dest(destDir + '/js'))
// })

// gulp.task('js', () => {
//   return gulp.src(paths.js)
//     .pipe(sourcemaps.init())
//     .pipe(babel({presets: ['es2015', 'stage-0']}))
//     .pipe(concat('app.js'))
//     .pipe(gulpif(process.env.NODE_ENV === 'production', uglify()))
//     .pipe(sourcemaps.write('./'))
//     .pipe(connect.reload())
//     .pipe(gulp.dest(destDir + '/js'))
// })

gulp.task('js', () => {
  watchify(browserify(paths.js), { debug: true })
    .transform('babelify', {presets: ['es2015', 'stage-0']})
    .bundle()
    .on('error', (err) => { console.error(err) })
    .pipe(source(jsDistFile))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(gulpif(process.env.NODE_ENV === 'production', uglify()))
    .pipe(sourcemaps.write('./'))
    .pipe(connect.reload())
    .pipe(gulp.dest(destDir + '/js'))
})

gulp.task('copyNpmDependenciesOnly', () => {
  gulp.src(gnf(), {base: './'}).pipe(gulp.dest(envDir))
})

// gulp.task('lib', () => {
//   return gulp.src([
//     'node_modules/jquery/dist/jquery.min.js',
//     'node_modules/bootstrap/dist/css/bootstrap.min.css',
//     'node_modules/bootstrap/dist/js/bootstrap.min.js',
//     'node_modules/bootstrap/dist/fonts/*',
//   ])
//     .pipe(gulp.dest(envDir + '/lib'))
// })

gulp.task('scss', () => {
  return gulp.src(paths.scss)
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(connect.reload())
    .pipe(gulp.dest(destDir + '/css'))
})

gulp.task('img', () => {
  gulp.src(paths.img)
    .pipe(imagemin())
    .pipe(connect.reload())
    .pipe(gulp.dest(destDir + '/images'))
})

gulp.task('connect', () => {
  connect.server({
    root: envDir,
    livereload: true
  })
})

gulp.task('htmlmin', () => {
  return gulp.src(paths.html)
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest(envDir))
})

gulp.task('clean', () => {
  del([envDir])
})

gulp.task('watch', () => {
  htmlCopyAndWatch()
  imagesCopyAndWatch()
  gulp.watch(paths.img, ['img'])
  gulp.watch([srcDir + '/scripts/**/*.js'], ['js'])
  gulp.watch(paths.scss, ['scss'])
})

function htmlCopyAndWatch() {
  return gulp.src(paths.html, {base: srcDir})
    .pipe(watch(paths.html, {base: srcDir}))
    .pipe(connect.reload())
    .pipe(gulp.dest(envDir))
}

function imagesCopyAndWatch() {
  return gulp.src(paths.img, {base: srcDir})
    .pipe(watch(paths.img, {base: srcDir}))
    .pipe(connect.reload())
    .pipe(gulp.dest(destDir))
}

gulp.task('default', ['env', 'copyNpmDependenciesOnly', 'connect', 'js', 'scss', 'watch'])