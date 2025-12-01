const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv').config().parsed;

module.exports = {
  mode: 'production',
  devtool: 'source-map', // For debugging
  entry: {
    content: './src/content/content.js',
    background: './src/background/background.js',
    auth: './src/pages/auth/auth.js',
    popup: './src/popup/popup.js',
    calibration: './src/pages/calibration/calibration-script.js',
    "page-webgazer-bootstrap": './src/content/page-webgazer-bootstrap.js',
    tfjs: './node_modules/@tensorflow/tfjs',
    "tfjs-backend": './node_modules/@tensorflow/tfjs-backend-wasm',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [

    // Generate auth.html
    new HtmlWebpackPlugin({
      template: './src/pages/auth/auth.html',
      filename: 'pages/auth/auth.html',
      chunks: ['auth']
    }),

    // Generate poup.html
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup/popup.html',
      chunks: ['popup']
    }),

    // Generate calibration.html
    new HtmlWebpackPlugin({
      template: './src/pages/calibration/calibration.html',
      filename: 'pages/calibration/calibration.html',
      chunks: ['calibration']
    }),

    // Copy manifest.json and webgazer library (assets)
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public/icons', to: 'icons', noErrorOnMissing: true },
        { from: 'public/webgazer', to: 'webgazer' },

        // TensorFlow.js core and wasm backend JS files
        { from: './node_modules/@tensorflow/tfjs/dist/tf.min.js', to: 'tf/tf.min.js' },
        { from: './node_modules/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.min.js', to: 'tf/tf-backend-wasm.min.js' },

        // TensorFlow.js wasm binaries: copy all .wasm variants you ship
        // Include the exact filenames that match your TFJS version:
        // - tfjs-backend-wasm.wasm
        // - tfjs-backend-wasm-simd.wasm
        // - tfjs-backend-wasm-threaded-simd.wasm
        { from: './node_modules/@tensorflow/*.wasm', to: 'tf/[name][ext]', noErrorOnMissing: true },
      ]
    }),

    // inject .env variables for build
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(dotenv)
    })
  ],
  optimization: {
    splitChunks: false
  }
};