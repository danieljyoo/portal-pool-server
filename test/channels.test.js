require('dotenv').config()

const { Channels } = require('../lib/channels')

describe('getters and setters', () => {
  let channels = null

  beforeEach(async () => {
    channels = new Channels()
  })

  it ('should add a subscription', async () => {
    channels.subscribe('my-channel', 'my-id', 'https://my-queue.com', { hello: "world" })
    expect(channels.hasSubscribers('my-channel')).toBe(true)
    expect(channels.getSubscribers('my-channel')).toEqual([ { 
      channel: 'my-channel',
      id: 'my-id',
      queueurl: 'https://my-queue.com',
      meta: { hello: "world" } 
    } ])
    channels.subscribe('my-channel', 'other-id', 'https://my-queue.com', { foo: "bar" })
    expect(channels.hasSubscribers('my-channel')).toBe(true)
    expect(channels.getSubscribers('my-channel')).toEqual([ 
      { channel: 'my-channel', id: 'my-id', queueurl: 'https://my-queue.com', meta: { hello: "world" } },
      { channel: 'my-channel', id: 'other-id', queueurl: 'https://my-queue.com', meta: { foo: "bar" } }
    ])
  })
})
