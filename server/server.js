const addressSecret = "RIPPLE-SECRET";
const stripeKey = "STRIPE-KEY";
const app = require("express")();
const stripe = require("stripe")(stripeKey);
const fetch = require('node-fetch');
const RippleAPI = require('ripple-lib').RippleAPI;
app.use(require("body-parser").text()); 
const api = new RippleAPI({server: 'wss://s1.ripple.com'});

//-------- constant objects -------- 
//pricing
const pricing = {
  other: {
    hostingFee: .50,
    total: .50
  },
  stripe: {
    percentage: .035,
    flatFee: .30,
  },
  xrp: {
    reserveAmount: 20,
    rate: 0,
    total: 0
  }
}

const XrpReserveAmount = 20; 

const host = "https://xrp.walletactivation.com";

// --------------- functions -----------------

//make an XRP payment 
async function xrpMakePayment(toAddress, amountInXRP) {
  api.on('error', (errorCode, errorMessage) => {
    console.log(errorCode + ': ' + errorMessage);
  });
  api.on('connected', () => {
    //console.log('connected');
  });
  api.on('disconnected', (code) => {
    // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
    // will be 1000 if this was normal closure
    //console.log('disconnected, code:', code);
  });
  const transaction = {publicKey: toAddress};
  const result = await new Promise((resolve, reject) => {
    api.connect()
    .then(() => {
      const myAddress = 'rhYkBRrkZJBuZs4DP8XaJwmFPQ7HXR7aiz';
      //0.1 XRP = 100000 drops
      const amountInDrops = (amountInXRP * 1000000).toString();
      const payment = {
        "source": {
          "address": myAddress,
          "maxAmount": {
            "value": amountInDrops,
            "currency": "drops"
          }
        },
        "destination": { 
          "address": toAddress,
          "amount": {
            "value": amountInDrops,
            "currency": "drops"
          }
        }
      };
      transaction.xrpAmount = amountInXRP.toString();
      return api.preparePayment(myAddress, payment)
    })
    .then(prepared => { 
      //console.log(prepared)
      return prepared.txJSON 
    })
    .then(txJSON => {
      //OPTIONAL keypair
      //const keypair = { privateKey: '00ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A', publicKey: '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8' };
      return api.sign(txJSON, addressSecret);
    })
    .then(submit => {
      //set to object for use later down the chain
      //console.log(submit.id);
      transaction.transactionHash = submit.id;
      return api.submit(submit.signedTransaction)
    })
    .then(submitted => {
      //resolve promise
      transaction.submitted = submitted;
      //kick off make receipt function here
      resolve(transaction);
    })
    .then(() => {
      //console.log("disconnected")
      return api.disconnect();
    })
    .catch(error => {
      resolve(error);
      api.disconnect();
    })
  });
  return result;
}

//check an XRP payment 
async function xrpCheckPayment(transactionHash) {
  api.on('error', (errorCode, errorMessage) => {
    console.log(errorCode + ': ' + errorMessage);
  });
  api.on('connected', () => {
    //console.log('connected');
  });
  api.on('disconnected', (code) => {
    // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
    // will be 1000 if this was normal closure
    //console.log('disconnected, code:', code);
  });
  const result = await new Promise((resolve, reject) =>{
    api.connect()
    .then(() => {
      return api.getTransaction(transactionHash)
    })
    .then((res) => {
      resolve(res)
      api.disconnect();
    })
    .then(() => {
      api.disconnect();
    }).catch(console.error);
  })
  return result
}

//get Ripple Price (data API)
async function ripplePrice() {
  const result = await new Promise((resolve, reject) => {
      fetch('https://data.ripple.com/v2/exchange_rates/XRP/USD+rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B?')
      .then(response => {
          return response.json();
      })
      .then(data => {
          //get XRP rate to USD
          resolve(data["rate"]);
      })
      .catch(err => {
          // Do something for an error here
          //this.setState({price: "error"});
      });
  });
  return result;
}

//get wallet info (data API)
async function getWalletData(hash) {
  api.on('error', (errorCode, errorMessage) => {
    console.log(errorCode + ': ' + errorMessage);
  });
  api.on('connected', () => {
   // console.log("connected")
  });
  api.on('disconnected', (code) => {
    // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
    // will be 1000 if this was normal closure
    //console.log('disconnected, code:', code);
  });
  const result = await new Promise((resolve, reject) => {
    api.connect()
    .then(() => {
      return api.getAccountInfo(hash)      
    })
    .then(() => {
      resolve("alreadyActive")
    })
    .then(() => {
      api.disconnect();
    })
    .catch((e) => {
      if (e.data){
        resolve(e.data.error) 
        api.disconnect();
      }
    })
  });
  return result
}

//send me push notifications to my iphone via slack
function sendMessageToSlack(data) {
  //turn data into an object
  const obj = JSON.parse(data)
  let message, channel;
  if (obj.xrpSent && obj.xrpChecked) {
    message = `$${obj.tip} tip \n(total $${obj.totalCharge} for ${obj.xrpAmountSent} xrp)\n sent to *${obj.xrpPublicKey}*\n@Elliot Chapple`;
    channel = "#daily";
  } else {
    message = `sent: ${obj.xrpSent}, confirmed: ${obj.xrpChecked}\nfor: *${obj.xrpPublicKey}* charged: *${obj.totalCharge}*\n@Elliot Chapple`;
    channel = "#fail";
  }

  fetch('https://hooks.slack.com/services/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', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"text": message, "channel": channel, "username": "spray", "icon_emoji": ":nerd_face:", "link_names": 1})
  });
}

//--------------- Listeners --------------------
app.post("/pricing", async (req, res) => { 
  res.header("Access-Control-Allow-Origin", `${host}`);
  try {
    async function getVars() {
      let xrpPrice = await ripplePrice(req.body).then(data => {
        return data
      });
      function twoDecimals(num) {
        const clean = Number(parseFloat(num).toFixed(2));
        return clean
      }
      //set pricing object values
      pricing.xrp.rate = twoDecimals(xrpPrice);
      pricing.xrp.total = twoDecimals(xrpPrice * pricing.xrp.reserveAmount);
      return pricing
    }
    getVars().then(data => {
      res.json({data});
    })

  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
})

app.post("/walletInfo", async (req, res) => {  
  res.header("Access-Control-Allow-Origin", `${host}`);
  try {
    getWalletData(req.body)
    .then(data => {
      res.json({data})
    }).catch(console.error)
  } catch (err) {
    res.status(500).end();
  }
})

app.post("/charge", async (req, res) => {  
  res.header("Access-Control-Allow-Origin", `${host}`);
  try {
    const parse = JSON.parse(req.body);
    const descriptor = (`XRP Wallet ${parse.publicKey}`).substring(0, 22);
    await stripe.charges.create({
      amount: Math.floor(parse.price * 100),
      currency: "usd",
      description: `20XRP sent to ripple public key: ${parse.publicKey}`,
      source: parse.token,
      statement_descriptor: descriptor
    }).then(data => {
      res.json({data});
    })
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
})

app.post("/xrpPayment", async (req, res) => {  
  res.header("Access-Control-Allow-Origin", `${host}`);
  try {
    const address = req.body;
    xrpMakePayment(address, XrpReserveAmount).then(data => {
      res.json({data});
    });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
})

app.post("/xrpTransactionCheck", async (req, res) => {  
  res.header("Access-Control-Allow-Origin", `${host}`);
  try {
    const transactionHash = req.body;
    xrpCheckPayment(transactionHash).then(data => {
      res.json({data});
    });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
})

app.post("/notifyElliot", async (req, res) => {  
  res.header("Access-Control-Allow-Origin", `${host}`);
  try {
    sendMessageToSlack(req.body)
    res.status(200)
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
})

app.listen(8080, () => console.log("Listening on port 8080"));