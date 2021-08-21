const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid') 
const { Producer } = require('sqs-producer');

class Channels {

  constructor() {
    this.channels = { }
  }

  getSubscribers(channel) {
    if (!this.hasSubscribers(channel)) return [ ]
    return Object.keys(this.channels[channel]).map(id => this.channels[channel][id])
  }

  getSubscription(channel, id) {
    if (!this.hasSubscribers(channel)) return null
    return this.channels[channel][id]
  }

  hasSubscribers(channel) {
    return this.channels[channel] && true || false
  }

  subscribe(channel, id, queueurl, meta) {
    if (!this.hasSubscribers(channel)) {
      this.channels[channel] = { }
    }
    this.channels[channel][id] = { channel, id, queueurl, meta }
  }

  unsubscribe(channel, id) {
    if (!this.hasSubscribers(channel)) return null
    let data = this.channels[channel][id]
    delete this.channels[channel][id]
    if (Object.keys(this.channels[channel]).length == 0) {
      delete this.channels[channel]
    }
    return data
  }
}

module.exports = {
  Channels
}