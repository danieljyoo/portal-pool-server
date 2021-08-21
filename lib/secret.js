const { promisify } = require('util')

async function getSecretValue(secretsmanager, secretName) {
  let getSecretValue = promisify(secretsmanager.getSecretValue).bind(secretsmanager)
  let data = await getSecretValue({ SecretId: secretName })
  return data.SecretString && JSON.parse(data.SecretString) || null
}

module.exports = {
  getSecretValue
}