const { EventEmitter } = require('events')

class Listener {
  
  constructor(web3) {
    this.web3 = web3
    this.em = new EventEmitter()
  }

  listen() {
    this.web3.eth.subscribe("pendingTransactions").on("data", this.processPending.bind(this))
    this.web3.eth.subscribe("newBlockHeaders").on("data", this.processNewBlockHeader.bind(this))
    //this.web3.eth.subscribe("logs")
  }

  async processPending(hash) {
    let tx = await this.web3.eth.getTransaction(hash)
    this.em.emit("transaction", { status: 'pending', value: tx })
  }

  async processNewBlockHeader(header) {
    let block = await this.web3.eth.getBlock(header.number)
    this.em.emit("block", block)
    await this.processTransactions(block.transactions)
  }

  // Very naive: we do these serially
  async processTransactions(transactions) {
    for await (let hash of transactions) {
      let value = await this.web3.eth.getTransaction(hash)
      let receipt = await this.web3.eth.getTransactionReceipt(hash)
      this.em.emit("transaction", { status: 'block', value, receipt })
    }
  }
}

module.exports = {
  Listener
}