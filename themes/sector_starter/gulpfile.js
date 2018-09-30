/**
 * @file Gulpfile that contains tasks for compiling the theme.
 */

/* Delcare a basePaths and paths object.
 * This enables us to group and use paths as variables.
 */

const log = console.log;
let environment = 'prod';   // default to prod

const gulp = require('gulp'),
      rename = require("gulp-rename"),
      svg = {
        sprite : require('gulp-svg-sprite')
      };

const config = {
  paths : {
    images : {
      src : '.images/',
      dest : './images/'
    },
    sprite : {
      src : './build/sprite/',
      svg : '../../images/sprite.svg',
      mixins : {
        src : './build/sass/_mixins.scss',
        filename : '_sprite-mixins.scss',
        dist : './scss/generic'
      },
      dist : '_sprite.scss', // contains generated $icons variable
      template : './build/tpl/sprite-template.scss'
    },
    styles : {
      css : './css/',
      sass : './scss/'
    }
  },
  svg : {
    sprite : {
      padding : 5,
      layout : 'diagonal',
      bust : false,
      mapname : 'icons'
    }
  }
};

/**
 * Gulp svgSprite task.
 */
gulp.task('svgSprite', () => {
  return gulp.src(`${config.paths.sprite.src}*`)
    .pipe(svg.sprite({
      shape: {
        spacing: {
          padding: config.svg.sprite.padding
        }
      },
      mode: {
        css: {
          dest: "./",
          layout: config.svg.sprite.layout,
          sprite : config.paths.sprite.svg,
          bust: config.svg.sprite.bust,
          render: {
            scss: {
              dest: '_sprite.scss',
              template: config.paths.sprite.template    // ./build/tpl/sprite-template.scss
            }
          }
        }
      },
      variables: {
        mapname: config.svg.sprite.mapname
      }
    }))
    .pipe(gulp.dest(`${config.paths.styles.sass}generic`));
});

/**
 * Gulp copySpriteMixins task.
 *
 * In order to use our generated sprite, we require the sprite() mixin (and it's various mixin dependencies)
 * available to call in our theme, so we copy it over to scss/generic and rename the file to something less
 * generic than just _mixins.scss
 */
gulp.task('copySpriteMixins', () => {
  log(`Copying ${config.paths.sprite.mixins.src} to ${config.paths.sprite.dist} ...`);
  return gulp.src(config.paths.sprite.mixins.src)
    .pipe(rename(config.paths.sprite.mixins.filename))
    .pipe(gulp.dest(config.paths.sprite.mixins.dist));
});

gulp.task('default', ['svgSprite','copySpriteMixins']);
