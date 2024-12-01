process.env.NODE_ENV = 'development'


const webpack = require('webpack')
const configFactory = require('../config/webpack.config')

const config = configFactory('development')

const compiler = webpack(config)

compiler.run((err, stats) => {
  if(err) {
    console.error(err)
  }
  console.log(stats.toJson({ all: false, warnings: true, errors: true }))
})