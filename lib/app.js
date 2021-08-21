require('dotenv').config()

const AMB_ENDPOINT = process.env.AMB_ENDPOINT
const SECRETS_NAME = process.env.SECRETS_NAME
const SQS_INCOMING_URL = process.env.SQS_INCOMING_URL

const crypto = require('crypto')
const AWS = require("aws-sdk")
const secretsmanager = new AWS.SecretsManager({ region: process.env.AWS_REGION })
const { v4: uuidv4 } = require('uuid')         
const { Consumer } = require('sqs-consumer');
const { Producer } = require('sqs-producer');

const { initWeb3 } = require("./web3")
const { getSecretValue } = require("./secret")
const { Listener } = require("./listener")
const { Channels } = require('./channels')

const channels = new Channels()
const NewBlockChannel = "block"

async function main() {
  const web3 = await configWeb3()
 
  const incoming = Consumer.create({
    queueUrl: SQS_INCOMING_URL,
    handleMessage: createSubscribeHandler(channels)
  })

  const listener = new Listener(web3)
  listener.em.on("block", blockHandler)
  listener.em.on("transaction", transactionHandler)
  listener.listen()

  incoming.start()
}

async function configWeb3() {
  // Fetch the aws IAM user access keys from secrets manager 
  let secrets = null
  try {
    secrets = await getSecretValue(secretsmanager, SECRETS_NAME)
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500, // Internal Server Error
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ errorMessage: err.message })
    }
  }

  // Initialize web3 and web3 provider
  const web3 = initWeb3({ 
    endpoint: AMB_ENDPOINT,
    credentials: { 
      accessKeyId: secrets.accessKeyId, 
      secretAccessKey: secrets.secretAccessKey
    } 
  })
  return web3
}

function createSubscribeHandler(channels) {
  return (message) => {
    try {
      let { action, data } = message.Body && JSON.parse(message.Body) 
      switch (action) {
        case "subscribe":
          data.channels.forEach(channel => {
            console.log(`[SUB] ${channel} ${data.id} ${data.queueurl}`)
            channels.subscribe(channel, data.id, data.queueurl, data.meta || { })
          })
          return true
        case "unsubscribe":
          data.channels.forEach(channel => {
            console.log(`[UNSUB] ${channel} ${data.id}`)
            channels.unsubscribe(channel, data.id)
          })
          return true
        default:
          return true
      }
    } catch (err) {
      console.error(err)
      return true
    }
  }
}

async function blockHandler(block) {
  console.log(`[BLOCK] ${block.number}`)

  let subscribers = channels.getSubscribers(NewBlockChannel)
  if (subscribers.length > 0) {
    await send(subscribers, { block })
  }
}

async function transactionHandler({ status, value, receipt }) {
  let from = value.from
  let to = value.to
  let hash = value.hash

  let subscribers = channels.getSubscribers(from)
    .concat(channels.getSubscribers(to))
    .concat(channels.getSubscribers(hash))
  
  if (subscribers.length > 0) {
    await send(subscribers, { status, value, receipt })
  }
}


main()
.then(web3 => {
  console.log(web3)
})
.catch(err => {
  console.error(err)
})


async function send(subscribers, event) {
  console.log(`[SEND] (${subscribers.length} subscribers) ${JSON.stringify(event, null, 2)}`)
  // Very naive: we just send one at a time
  for await (let { channel, id, queueurl, meta } of subscribers) {
    let queue = Producer.create({ queueUrl: queueurl })
    let body = {
      id: uuidv4(),
      t: Date.now(),
      action: 'event',
      data: { channel, id, queueurl, meta, event },
    }
    let message = {
      id: body.id,
      body: JSON.stringify(body),
      groupId: id,
      deduplicationId: createDeduplicationId(JSON.stringify(body))
    }
    await queue.send([ message ])
  }
}

function createDeduplicationId(data) {
  return crypto.createHash('sha1').update(data).digest('base64');
}
