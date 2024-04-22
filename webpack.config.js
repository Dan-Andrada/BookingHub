const path = require('path')

module.exports = {
  mode: 'development',
  entry: './js/calendar.js',
  resolve: {
    extensions: [ '.js' ]
  },
  output: {
    filename: 'example.js',
    path: path.join(__dirname, 'dist')
  },
  devtool: 'sourcemap'
}