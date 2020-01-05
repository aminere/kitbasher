const webpack = require('webpack');
const copyPlugin = require('copy-webpack-plugin');
const resolvePath = _path => require('path').resolve(__dirname, _path);

const sources = [
  resolvePath("../src"),
  resolvePath("../../spider-engine/src"),
];

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
        include: sources,
        loader: 'tslint-loader',
        options: {
          typeCheck: false
        }        
      },
      {
        test: /\.tsx?$/,
        include: sources,
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
    new webpack.DefinePlugin({      
      'process.env.PLATFORM': JSON.stringify('web'),
      'process.env.CONFIG': JSON.stringify('standalone')
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new copyPlugin([
      { from: '../spider-engine/dist/default-assets.json', to: '.' }
    ])
  ]
};
