"use strict"

const { src, dest } = require("gulp");
const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer");
const cssbeautify = require("gulp-cssbeautify");
const removeComments = require("gulp-strip-css-comments");
const rename = require("gulp-rename");
const sass = require("gulp-sass")(require("sass"));
const cssnano = require("gulp-cssnano");
const uglify = require("gulp-uglify");
const plumber = require("gulp-plumber");
const rigger1 = require("gulp-rigger");
const panini = require("panini");
const imagemin = require("gulp-imagemin");
const webp = require('gulp-webp');
const del = require("del");
const notify = require("gulp-notify");
const { reload, stream } = require("browser-sync");
const browserSync = require("browser-sync").create();
const htmlmin = require('gulp-htmlmin');


/*Определяем пути*/
const srcPath = "src/"; //путь для исходников
const distPath = "dist/"; //путь для компиляции проекта

function serve() {// Live Reload Server
    browserSync.init({
        server: {
            baseDir: "./" + distPath
        },
    });
}

const path = {
    //сборка
    build: {
        html: distPath,
        js: distPath + "assets/js",
        css: distPath + "assets/css",
        fonts: distPath + "assets/fonts",
        image: distPath + "assets/image"
    },
    //исходники
    src: {
        html: srcPath + "*.html",
        js: srcPath + "assets/js/*.js",
        css: srcPath + "assets/scss/*.scss",
        fonts: srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg,otf}",
        image: srcPath + "assets/image/**/*.{jpeg,jpg,png,svg,gif,ico,webp,webmanifest,xml,json}"

    },
    //отслеживаем файлы
    watch: {
        html: srcPath + "**/*.html",
        js: srcPath + "assets/js/**/*.js",
        css: srcPath + "assets/scss/**/*.scss",
        fonts: srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}",
        image: srcPath + "assets/image/**/*.{jpeg,jpg,png,svg,gif,ico,webp,webmanifest,xml,json}"
    },
    //перед компиляцией чистим предыдущую сборку
    clean: "./" + distPath
}

function html() {
    panini.refresh()
    return src(path.src.html, { base: srcPath })
        .pipe(plumber()) // отлавливаем возможные ошибки
        .pipe(panini({
            root: srcPath,
            layouts: srcPath + 'tpl/layouts/',
            partials: srcPath + 'tpl/partials/',
            // helpers: srcPath + 'tpl/helpers/',
            data: srcPath + 'tpl/data/'
        }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(dest(path.build.html)) //собираем html
        .pipe(browserSync.reload({ stream: true }))// передаем обновления веб-серверу
}

function css() {
    return src(path.src.css, { base: srcPath + "assets/scss/" })
        .pipe(plumber({
            errorHandler: notify.onError("CSS: <%= error.message %>")
        }))// отлавливаем возможные ошибки
        .pipe(sass()) //компилируем SCSS
        .pipe(autoprefixer()) //ставим автопрефиксы для правил CSS
        .pipe(cssbeautify()) //форматируем таблицу стилей для читаемости
        .pipe(dest(path.build.css))//собираем css
        .pipe(cssnano({
            zindex: false,
            discardComments: {
                removeAll: true
            }
        })) // минифицируем CSS
        .pipe(removeComments()) //удаляем коментарии из стилей
        .pipe(rename({
            suffix: ".min",
            extname: ".css"
        })) //переименовываем минифицированный файл
        .pipe(dest(path.build.css)) //копируем минифицированный файл
        .pipe(browserSync.reload({ stream: true }))// передаем обновления веб-серверу
}

function js() {
    return src(path.src.js, { base: srcPath + "assets/js/" })
        .pipe(plumber({
            errorHandler: notify.onError("JavaScript: <%= error.message %>")
        }))// отлавливаем возможные ошибки
        .pipe(rigger1())//объеденяем JS скрипты в один файл
        .pipe(dest(path.build.js)) //собираем JS файл
        .pipe(uglify()) //минифицируем собранный JS файл
        .pipe(rename({
            suffix: ".min",
            extname: ".js"
        })) //переименовываем минифицированный файл
        .pipe(dest(path.build.js)) //копируем минифицированный JS файл
        .pipe(browserSync.reload({ stream: true }))// передаем обновления веб-серверу
}

function images() {
    return src(path.src.image, { base: srcPath + "assets/images/" })
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }), //для png от 0 до 7, степень оптимизации
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ]))//минифицируем изображения
        .pipe(webp()) //преобразуем изображения в формат webp
        .pipe(dest(path.build.image)) //копируем минифицированные изображения в готовый проект
        .pipe(browserSync.reload({ stream: true }))// передаем обновления веб-серверу
}

function fonts() {
    return src(path.src.fonts, { base: srcPath + "assets/fonts/" }) //копируем шрифты из исходников в готовый проект
        .pipe(dest(path.build.fonts))
        .pipe(browserSync.reload({ stream: true }))// передаем обновления веб-серверу
}

function clean() {
    return del(path.clean) // чистим каталог с ранее скопилированным проектом
}

function watchFiles() {//отслеживаем изменения в исходниках проекта и при изменении пересобираем проект
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.fonts], fonts)
    gulp.watch([path.watch.image], images)
}


const build = gulp.series(clean, gulp.parallel(html, css, js, fonts, images));
const watch = gulp.parallel(build, watchFiles, serve);

exports.html = html;
exports.htmlmin = htmlmin;
exports.css = css;
exports.js = js;
exports.images = images;
exports.webp = webp;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;