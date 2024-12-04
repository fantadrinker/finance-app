process.env.NODE_ENV = 'development'

const webpack = require('webpack')
const configFactory = require('../config/webpack.config')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')

const config = configFactory('development')

const compiler = webpack(config)

compiler.run((err, stats) => {
  if (err) {
    console.error(err)
  }
  const statsJson = stats.toJson({ all: false, warnings: true, errors: true })
  console.log(formatWebpackMessages(statsJson))
  if (statsJson.errors.length > 0 || statsJson.warnings.length > 0) {
    process.exit(1)
  }
})
