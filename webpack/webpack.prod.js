const webpack = require('webpack');
const resolvePath = _path => require('path').resolve(__dirname, _path);

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: resolvePath('../dist'),
    filename: 'bundle.js',
    publicPath: '/dist'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        enforce: 'pre',
        include: resolvePath("../src"),
        loader: 'tslint-loader',
        options: {
          typeCheck: false
        }        
      },
      {
        test: /\.tsx?$/,
        include: resolvePath("../src"),
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        loader: 'file-loader',
        exclude: [
          /\.html$/,
          /\.(js|jsx)$/,
          /\.(ts|tsx)$/,
          /\.css$/,
          /\.json$/
        ],
        options: {
          name: 'static/media/[name].[hash:8].[ext]',
        },
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  mode: 'production',
  plugins: [    
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    })
  ]
};
