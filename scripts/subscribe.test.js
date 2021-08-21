require('dotenv').config()
const crypto = require('crypto')
const { Producer } = require('sqs-producer');
const { Consumer } = require('sqs-consumer');
const address = "0x4EA6082373114AFA7FcF4f305246cD34624cB1e7"
const { v4: uuidv4 } = require('uuid')         

const producer = Producer.create({
  queueUrl: process.env.SQS_INCOMING_URL,
  region: process.env.AWS_REGION
})

async function main() {

  // send a subscription 
  let messageId = uuidv4()
  let messageBody = JSON.stringify({ 
    id: messageId, 
    t: Date.now(), 
    action: 'subscribe', 
    data: {
      channels: [ "block" ], 
      id: 'my-conn-id',
      queueurl: process.env.WEBSOCKET_SQS_URL,
      meta: {
        connectionId: 'my-conn-id'
      }
    }
  })
  let message = { 
    id: messageId, 
    body: messageBody,
    groupId: uuidv4(),
    deduplicationId: createDeduplicationId(messageBody)
  }
  
  await producer.send([ message ])
  
}

function createDeduplicationId(data) {
  return crypto.createHash('sha1').update(data).digest('base64');
}


main()
.then(data => {
  console.log('done')
})
.catch(err => {
  console.error(err)
})
