/**
 * @file Gulpfile that contains tasks for compiling the theme.
 */

/* Delcare a basePaths and paths object.
 * This enables us to group and use paths as variables.
 */

const log = console.log;
let environment = 'prod';   // default to prod

const babel = require('gulp-babel'),
      chalk = require('chalk'),
      debug = require('gulp-debug'),
      eslint = require('gulp-eslint')
      gulp = require('gulp'),
      sass = require('gulp-sass'),
      sourcemaps = require('gulp-sourcemaps'),
      globbing = require('gulp-sass-glob'),
      autoprefixer = require('gulp-autoprefixer'),
      gulpif = require('gulp-if'),
      runSequence = require('run-sequence'),
      sassLint = require('gulp-sass-lint'),
      size = require('gulp-size'),
      rename = require("gulp-rename"),
      svg = {
        svgo : require('gulp-svgo'),
        sprite : require('gulp-svg-sprite')
      };

const config = {
  paths : {
    images : {
      dest : './images/'
    },
    sprite : {
      src : `./build/sprite/`,
      svg : './images/sprite.svg',
      css : './scss/generic/_sprite.scss',
      template : './build/tpl/sprite-template.scss'
    },
    styles : {
      css : './css/',
      sass : './scss/'
    }
  },
  sass : {
    dev : {
      outputStyle : 'expanded',
      sourceMaps : true,
    },
    prod : {
      outputStyle : 'compressed',
      sourceMaps : false
    },
    includePaths : [
      './bower_components/breakpoint-sass/stylesheets',
      './bower_components/compass-mixins/lib'
    ],
    lint : {      
      options: {
        'formatter': 'stylish',
        'merge-default-rules': false
      },
      rules: {
        'no-ids': 1,
        'no-mergeable-selectors': 0,
        'bem-depth': 1,
        'trailing-semicolon': 1,
        'final-newline': 1
      }
    }
  },
  js : {
    src : './js/src/',
    dist : './js/dist/',
    lint_rules : {
      "comma-dangle": 2,
      "quotes": 0      
    }
  },
  svg : {
    sprite : {
      padding : 5,
      layout : 'diagonal',
      bust : false,
      mapname : 'icons'
    },
    svgo  : {
      removeTitle : true,
      removeDesc : true,
      cleanupIDs : true
    }
  },
  palette : {
    primary : '#436FFC',
    secondary : '#02B290',
    tertiary : '#EF604D',
    quaternary : '#B28A70'
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
          sprite: `${config.paths.sprite.src}*`,
          bust: config.svg.sprite.bust,
          render: {
            scss: {
              dest: "../../scss/generic/_sprite.scss",
              template: config.paths.sprite.template
            }
          }
        }
      },
      variables: {
        mapname: config.svg.sprite.mapname
      }
    }));
});

/**
 * Gulp copySpriteMixins task.
 *
 * In order to use our generated sprite, we require the sprite() mixin (and it's various mixin dependencies) 
 * available to call in our theme, so we copy it over to scss/generic and rename the file to something less 
 * generic than just _mixins.scss
 */
gulp.task('copySpriteMixins', () => {
  log(`Copying build/sass/_mixins.scss to scss/generic/sprite-mixins.scss ...`);
  return gulp
    .src('./build/sass/_mixins.scss')
    .pipe(rename("_sprite-mixins.scss"))
    .pipe(gulp.dest('./scss/generic'));
});


/**
 * Gulp svgo task.
 *
 * Optimise SVG images before sprite is created
 */
gulp.task('svgo', () => {
  log(chalk(`${config.paths.sprite.src}*`));
  
  return gulp.src(`${config.paths.sprite.src}*`)
    .pipe(debug({title: 'SVGO: Processed',showFiles:false}))
    .pipe(svg.svgo(config.svg.svgo))
    .pipe(gulp.dest(config.paths.sprite.src));
});





gulp.task('sass', () => {
  let sass_config = config.sass[environment];
  sass_config.includePaths = config.sass.includePaths;
  
  //gulp.src('scss/**/*.s+(a|c)ss')
    
  
  return gulp.src('scss/**/*.s+(a|c)ss')
    // Initialize the source maps.
    .pipe(gulpif(sass_config.sourceMaps, sourcemaps.init()))
    // Enable globbing and configure it to look for SCSS files.
    .pipe(globbing())
    // Compile the SASS
    .pipe(sass(sass_config).on('error', sass.logError))
    // Run autoprefixer with the default settings.
    .pipe(autoprefixer())
    // Write sourcemaps into the CSS file.
    .pipe(gulpif(sass_config.sourceMaps, sourcemaps.write()))
    .pipe(sassLint(config.sass.lint))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
    // Send output through vinyl-fs to play nice with ownership.
    .pipe(gulp.dest('./css'));
});






/**
  * Gulp babel task.
  *
  * Transpiles files in ./js/src directory from ES6 to browser compatible 
  * javascript (ES5) and outputs it in ./js/dist directory
  */
gulp.task('babel', () => {
  return gulp.src(`${config.js.src}*.js`)
    .pipe(babel({
      presets: ['env']
      })
    )
    .pipe(gulp.dest(config.js.dist))
});


/**
  * Gulp eslint task.
  *
  * Inherits rules from .eslintrc, applies to files in js/src
  */
gulp.task('eslint', () => {
  return gulp.src(['./js/src/*.js','!node_modules/**'])
    .pipe(eslint({
      "parserOptions": {
        "ecmaVersion": 6,
      }
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()
  );
});




/**
 * Gulp watch task.
 *
 * Watches directories for changes and runs some tasks if changes
 * are detected. Changes are logged to the console with a relative path.
 */
gulp.task('watch', () => {
    
  gulp.watch(`${config.paths.styles.sass}**/*.{scss,sass}`, runSequence(
    'sass'
  )).on('change', function(event) {
    let path = event.path.replace(process.cwd(), '..');
    log(chalk`File {bold.hex('${config.palette.primary}') ${path}} was ${event.type} , recompiling...`);
  });
  
  gulp.watch(`${config.paths.sprite.src}*.svg`, runSequence(
    'svgSprite',
    'copySpriteMixins'
  )).on('change', (event) => {
    let path = event.path.replace(process.cwd(), '..');    
    log(chalk`File {bold.hex('${config.palette.primary}') ${path}} was ${event.type}, rebuilding sprite...`); 
  });
  
  gulp.watch(`${config.js.src}*.js`, runSequence(
    'eslint',
    'babel'
  )).on('change', (event) => {
    let path = event.path.replace(process.cwd(), '..');    
    log(chalk`File {bold.hex('${config.palette.primary}') ${path}} was ${event.type}, transpiling javascripts...`); 
  });
});




// development
gulp.task('dev', () => {
  log(chalk`{bold.hex('${config.palette.primary}') ########### \nDevelopment pipeline running ... }`);
  
  environment = 'dev';
  runSequence(
    'lint',
    'babel',
    'svgo',
    'svgSprite',
    'copySpriteMixins',
    'sass',
    () => log(chalk`{bold.hex('${config.palette.primary}') Development pipeline done\n########### }`)
  );
});


// sprite-only task
gulp.task('sprite', () => {
  log(chalk`{bold.hex('${config.palette.quaternary}') ########### \Sprite-only pipeline running ... }`);
  
  runSequence(
    'svgo',
    'svgSprite',
    'copySpriteMixins',
    'sass',
    () => log(chalk`{bold.hex('${config.palette.quaternary}') Sprite-only pipeline done\n########### }`)
  );
});



// Run production tasks by default
gulp.task('default', () => {
  log(chalk`{bold.hex('${config.palette.tertiary}') ########### \nProduction pipeline running ... }`);
  
  runSequence(
    'eslint',
    'babel',
    'svgo',
    'svgSprite',
    'copySpriteMixins',
    'sass',
    () => log(chalk`{bold.hex('${config.palette.tertiary}') Production pipeline done\n########### }`)
  );
});