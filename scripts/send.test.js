  require("dotenv").config()
  const axios = require('axios').default

  async function main() {
    const url = `${process.env.PORTAL_BASEURL}/contracts/0x4EA6082373114AFA7FcF4f305246cD34624cB1e7/store`
    let body = {
      "types": [ "uint256" ],
      "parameters": [ 21 ]
    }
    let headers = {
      "authorization": "Basic bXktYXBwLTIxOm15LXNlY3JldA=="
    }
    let response = await axios.post(url, body, { headers })
    return response.data
  }

  main()
  .then(data => {
    console.log(JSON.stringify(data, null, 2))
  })
  .catch(err => {
    console.error(err)
  })