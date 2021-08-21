const AWS = require("aws-sdk")
const Web3 = require('web3')
const { AWSWebsocketProvider } = require("./aws-websocket-provider.js")

const DEFAULT_ENDPOINT = "http://localhost:8545"

function initWeb3(options) {
  options = options || { }
  const endpoint = options.endpoint || DEFAULT_ENDPOINT
  let provider = null
  if (isAMB(endpoint)) {
    provider = initAWSWebsocketProvider(endpoint, options.credentials) // initAWSHttpProvider(endpoint, options.credentials)
  } else {
    provider = new Web3.providers.WebsocketProvider(endpoint)
  }
  return new Web3(provider)
}

function isAMB(endpoint) {
  return endpoint
    && endpoint.includes("ethereum.managedblockchain") 
    && endpoint.endsWith("amazonaws.com")
}

function initAWSWebsocketProvider(endpoint, credentials) {
  return new AWSWebsocketProvider(endpoint, {
    credentials: new AWS.Credentials(credentials.accessKeyId, credentials.secretAccessKey)
  })
}

module.exports = {
  initWeb3
}
