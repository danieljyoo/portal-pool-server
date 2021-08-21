require('dotenv').config()

const { BlockCache } = require('../lib/blockcache')

describe('add', () => {
  let blocks = null

  it ('should init a cache of size 3', async () => {
    blocks = new BlockCache({ n: 3 })
    expect(blocks.blocks.length).toBe(3)
  })

  it ('should add a new block to an empty cache', async () => {
    blocks = new BlockCache({ n: 3 })
    let block = { number: 1, transactions: [ "0x01", "0x02", "0x03" ] }
    blocks.add(block)
    expect(blocks.txs["0x01"].block).toEqual(block)
    expect(blocks.newest).toEqual({ i: 0, block })
  })

  it ('should wrap and remove old blocks', async () => {
    blocks = new BlockCache({ n: 3 })
    let block1 = { number: 1, transactions: [ "0x01", "0x02", "0x03" ] }
    let block2 = { number: 2, transactions: [ "0x04", "0x05", "0x06" ] }
    let block3 = { number: 3, transactions: [ "0x07", "0x08", "0x09" ] }
    blocks.add(block1)
    blocks.add(block2)
    blocks.add(block3)
    expect(blocks.newest).toEqual({ i: 2, block: block3 })
    expect(blocks.txs["0x01"].block).toEqual(block1)

    let block4 = { number: 4, transactions: [ "0x10", "0x11", "0x12" ] }
    blocks.add(block4)
    expect(blocks.newest).toEqual({ i: 0, block: block4 })
    expect(blocks.oldest).toEqual({ i: 1, block: block2 })
    expect(blocks.txs["0x10"].block).toEqual(block4)
    expect(blocks.txs["0x01"]).toBeFalsy()
  })
})

describe('wrapIndex', () => {
  let blocks = null

  beforeEach(async () => {
    blocks = new BlockCache({ n: 3 })
  })

  it ('should noop within range', async () => {
    expect(blocks.wrapIndex(0)).toBe(0)
    expect(blocks.wrapIndex(1)).toBe(1)
  })

  it ('should wrap on right side (positive)', async () => {
    expect(blocks.wrapIndex(3)).toBe(0)
    expect(blocks.wrapIndex(4)).toBe(1)
    expect(blocks.wrapIndex(5)).toBe(2)
    expect(blocks.wrapIndex(6)).toBe(0)
  })

  it ('should wrap on left side (negative)', async () => {
    expect(blocks.wrapIndex(-1)).toBe(2)
    expect(blocks.wrapIndex(-2)).toBe(1)
    expect(blocks.wrapIndex(-3)).toBe(0)
    expect(blocks.wrapIndex(-4)).toBe(2)
  })
})

describe('indexOfBlock', () => {
  let blocks = null

  beforeEach(async () => {
    blocks = new BlockCache({ n: 3 })
  })

  it ('should get index of existing block number', async () => {
    let block1 = { number: 10, transactions: [ "0x01", "0x02", "0x03" ] }
    let block2 = { number: 11, transactions: [ "0x04", "0x05", "0x06" ] }
    let block3 = { number: 12, transactions: [ "0x07", "0x08", "0x09" ] }

    blocks.add(block1)
    blocks.add(block2)
    blocks.add(block3)

    expect(blocks.indexOfBlock(10)).toBe(0)
    expect(blocks.indexOfBlock(11)).toBe(1)
    expect(blocks.indexOfBlock(12)).toBe(2)
  })

  it ('should return -1 if block is too old', async () => {
    let block1 = { number: 10, transactions: [ "0x01", "0x02", "0x03" ] }
    let block2 = { number: 11, transactions: [ "0x04", "0x05", "0x06" ] }
    let block3 = { number: 12, transactions: [ "0x07", "0x08", "0x09" ] }

    blocks.add(block1)
    blocks.add(block2)
    blocks.add(block3)

    expect(blocks.indexOfBlock(9)).toBe(-1)
  })

  it ('should return -1 if block is in the future', async () => {
    let block1 = { number: 10, transactions: [ "0x01", "0x02", "0x03" ] }
    let block2 = { number: 11, transactions: [ "0x04", "0x05", "0x06" ] }
    let block3 = { number: 12, transactions: [ "0x07", "0x08", "0x09" ] }

    blocks.add(block1)
    blocks.add(block2)
    blocks.add(block3)

    expect(blocks.indexOfBlock(13)).toBe(-1)
  })
})


describe('handleChainReorg', () => {

  it ('should handle a reorg of the last block', async () => {
    blocks = new BlockCache({ n: 3 })
    let block1 = { number: 1, transactions: [ "0x01", "0x02", "0x03" ] }
    let block2 = { number: 2, transactions: [ "0x04", "0x05", "0x06" ] }
    blocks.add(block1)
    blocks.add(block2)
    expect(blocks.newest).toEqual({ i: 1, block: block2 })
    let block2b = { number: 2, transactions: [ "0x04b", "0x05b", "0x06b" ] }
    blocks.add(block2b)
    expect(blocks.newest).toEqual({ i: 1, block: block2b })
    expect(blocks.txs["0x04b"].block).toEqual(block2b)
    expect(blocks.txs["0x04"]).toBeFalsy()
    expect(blocks.blocks[0]).toEqual(block1)
    expect(blocks.blocks[1]).toEqual(block2b)
  })

  it ('should handle a reorg of multiple blocks', async () => {
    blocks = new BlockCache({ n: 3 })
    let block1 = { number: 1, transactions: [ "0x01", "0x02", "0x03" ] }
    let block2 = { number: 2, transactions: [ "0x04", "0x05", "0x06" ] }
    let block3 = { number: 3, transactions: [ "0x07", "0x08", "0x09" ] }
    blocks.add(block1)
    blocks.add(block2)
    blocks.add(block3)
    let block2b = { number: 2, transactions: [ "0x04b", "0x05b", "0x06b" ] }
    blocks.add(block2b)
    expect(blocks.newest).toEqual({ i: 1, block: block2b })
    expect(blocks.txs["0x04b"].block).toEqual(block2b)
    expect(blocks.txs["0x04"]).toBeFalsy()
    expect(blocks.blocks[0]).toEqual(block1)
    expect(blocks.blocks[1]).toEqual(block2b)
    expect(blocks.blocks[2]).toBeFalsy()
  })

  it ('should handle a reorg of entire chain', async () => {
    blocks = new BlockCache({ n: 3 })
    let block1 = { number: 1, transactions: [ "0x01", "0x02", "0x03" ] }
    let block2 = { number: 2, transactions: [ "0x04", "0x05", "0x06" ] }
    let block3 = { number: 3, transactions: [ "0x07", "0x08", "0x09" ] }
    let block4 = { number: 4, transactions: [ "0x10", "0x11", "0x12" ] }
    blocks.add(block1)
    blocks.add(block2)
    blocks.add(block3)
    blocks.add(block4)
    let block2b = { number: 2, transactions: [ "0x04b", "0x05b", "0x06b" ] }
    blocks.add(block2b)
    expect(blocks.newest).toEqual({ i: 0, block: block2b })
    expect(blocks.txs["0x04b"].block).toEqual(block2b)
    expect(blocks.txs["0x04"]).toBeFalsy()
    expect(blocks.txs["0x10"]).toBeFalsy()
    expect(blocks.blocks[0]).toEqual(block2b)
    expect(blocks.blocks[1]).toBeFalsy()
    expect(blocks.blocks[2]).toBeFalsy()
  })

  it ('should handle a reorg with wraparound', async () => {
    blocks = new BlockCache({ n: 3 })
    let block1 = { number: 1, transactions: [ "0x01", "0x02", "0x03" ] }
    let block2 = { number: 2, transactions: [ "0x04", "0x05", "0x06" ] }
    let block3 = { number: 3, transactions: [ "0x07", "0x08", "0x09" ] }
    let block4 = { number: 4, transactions: [ "0x10", "0x11", "0x12" ] }
    blocks.add(block1)
    blocks.add(block2)
    blocks.add(block3)
    blocks.add(block4)
    let block3b = { number: 3, transactions: [ "0x07b", "0x07b", "0x07b" ] }
    blocks.add(block3b)
    expect(blocks.newest).toEqual({ i: 2, block: block3b })
    expect(blocks.oldest).toEqual({ i: 1, block: block2 })
    expect(blocks.txs["0x04"].block).toEqual(block2)
    expect(blocks.txs["0x07b"].block).toEqual(block3b)
    expect(blocks.txs["0x07"]).toBeFalsy()
    expect(blocks.txs["0x10"]).toBeFalsy()
    expect(blocks.blocks[0]).toBeFalsy()
    expect(blocks.blocks[1]).toEqual(block2)
    expect(blocks.blocks[2]).toEqual(block3b)
  })
})