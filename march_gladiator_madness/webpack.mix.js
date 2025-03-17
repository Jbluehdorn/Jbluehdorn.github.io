let mix = require('laravel-mix')

mix
    .ts('src/js/app.js', 'dist')
    .react()
    .sass('src/styles/app.scss', 'dist')