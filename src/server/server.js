import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

let oracles = [];
let nr_oracles = 20;

web3.eth.getAccounts().then((accounts) => { 
  flightSuretyApp.methods.REGISTRATION_FEE()
  .call({ from: accounts[0]})
  .then(fee => { 
    for(let i=15; i<nr_oracles+15; i++) {
      flightSuretyApp.methods.registerOracle()
      .send({ from: accounts[i], value: fee,gas:6700000 })
      .then(result => {
        flightSuretyApp.methods.getMyIndexes()
        .call({from: accounts[i]})
        .then(indices =>{
          oracles[accounts[i]] = indices;
          console.log("Oracle registered: " + accounts[i] + " indices:" + indices);
        })
        .catch(error => {
          console.log("Error while retrieving indices: " + error );
        });
      })
      .catch(error => {
        console.log("Error while registering oracles: " + accounts[i] +  " Error: " + error);
      });
    }
  })
  .catch(error => {
    console.log("Error retrieving registration fee:" + error);
  });
});

flightSuretyData.events.CreditedInsurees
(
  {
    fromBlock: 0
  }, 
  function (error, event) 
  {
    if (error) console.log(error)
    else
    {
      let amount = event.returnValues.amount;
      let length = event.returnValues.length;
      let key = event.returnValues.key;
      console.log("Credited amount = "  + amount + ", length = " + length + ", key = " + key);
    }
  }
);

flightSuretyApp.events.BuyInsurance
(
  {
    fromBlock: 0
  }, 
  function (error, event) 
  {
    if (error) console.log(error)
    else
    {
      let airline = event.returnValues.airline;
      let flight = event.returnValues.flight;
      let timestamp = event.returnValues.timestamp;
      let sender = event.returnValues.insuree;
      let value = event.returnValues.amount;
      console.log("airline: " + airline);
      console.log("flight: " + flight);
      console.log("timestamp: " + timestamp);
      console.log("sender: " + sender);
      console.log("amount: " + value);     
    }
  }
);

flightSuretyData.events.Buy
(
  {
    fromBlock: 0
  }, 
  function (error, event) 
  {
    if (error) console.log(error)
    else
    {
      let key = event.returnValues.key;
      let buyer = event.returnValues.buyer;
   
      console.log("key: " + key);
      console.log("buyer: " + buyer); 
    }
  }
);

flightSuretyData.events.GetKey
(
  {
    fromBlock: 0
  }, 
  function (error, event) 
  {
    if (error) console.log(error)
    else
    {
      let key = event.returnValues.key;
      let airline = event.returnValues.airline;
      let flight = event.returnValues.flight;
      let timestamp = event.returnValues.timestamp;
   
      console.log("key: " + key);
      console.log("buyer: " + airline);
      console.log("flight: " + flight);
      console.log("timestamp: " + timestamp);
    }
  }
);

flightSuretyApp.events.OracleRequest
(
  {
    fromBlock: 0
  }, 
  function (error, event) 
  {
    if (error) console.log(error)
    else
    {
      let index = event.returnValues.index;
      let airline = event.returnValues.airline;
      let flight = event.returnValues.flight;
      let timestamp = event.returnValues.timestamp;

      for(var key in oracles)
      {
        if(oracles[key].includes(index)) // Only oracles containing an index equal to <index> are allowed to submit a response
        {
          let statusCode = 20;
          flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode)       
          .send({ from: key,gas:6700000})
          .then(result =>{
            console.log("Submitted oracle response with statuscode: "  + statusCode + " for "+ flight + " and index:"+ index);
          })
          .catch(error =>{
            console.log("Error sending Oracle response: " + error)
          });      
           
        }
      }
    }
  }
);


const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


