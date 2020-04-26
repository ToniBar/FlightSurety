var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

var Web3 = require('web3');
var web3 = new Web3('ws://localhost:8545');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  let run_original = 1; // set to 1 to run original test cases; set to any other value for new test cases

  if( run_original == 0)
  {
    it(`(multiparty) has correct initial isOperational() value`, async function () {

      // Get operating status
      let status = await config.flightSuretyData.isOperational.call();
      assert.equal(status, true, "Incorrect initial operating status value");
      
    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try 
        {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
              
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try 
        {
            await config.flightSuretyData.setOperatingStatus(false);
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
        
    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    // console.log("***** Number registered airlines = ",await config.flightSuretyData.getNrRegisteredAirlines());
        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try 
        {
            await config.flightSurety.setTestingMode(true);
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
      
      // ARRANGE
      let newAirline = accounts[2];

      // ACT
      try {
          await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
      }
      catch(e) {
      }

      let result = await config.flightSuretyData.isAirline.call(newAirline); 

      // ASSERT
      assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });
  }
  else{

    it('(MultiParti Consensus + Funding Test) ', async () => {
      // ARRANGE
      let newAirline = accounts[2];
      await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: web3.utils.toWei('10', "ether")});

      let result = await config.flightSuretyData.isFundedAirline.call(config.firstAirline);
      assert.equal(result, true, "Airline should be funded");

      // ACT
      try {
          await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
      }
      catch(e) {
      }
      let result2 = await config.flightSuretyData.isAirline.call(newAirline);

      // ASSERT
      assert.equal(result2, true, "Airline should be registered");

      // Register more airlines
      // ACT
      try {
          await config.flightSuretyApp.registerAirline(accounts[3], {from: config.firstAirline});
          await config.flightSuretyApp.registerAirline(accounts[4], {from: config.firstAirline});
          await config.flightSuretyApp.registerAirline(accounts[5], {from: config.firstAirline});
          await config.flightSuretyApp.registerAirline(accounts[6], {from: config.firstAirline});
          
      }
      catch(e) {
      }

      // ASSERT
      assert.equal(await config.flightSuretyData.isAirline.call(accounts[3]), true, "Airline should be registered");
      assert.equal(await config.flightSuretyData.isAirline.call(accounts[4]), true, "Airline should be registered");
      assert.equal(await config.flightSuretyData.isAirline.call(accounts[5]), true, "Airline should be registered");
      assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]), false, "Airline should not be registered as less than M/2 calls occured for its registration");

      // FUND AIRLINES
      await config.flightSuretyApp.fundAirline({from: accounts[3], value: web3.utils.toWei('10', "ether")});
      await config.flightSuretyApp.fundAirline({from: accounts[4], value: web3.utils.toWei('10', "ether")});
      await config.flightSuretyApp.fundAirline({from: accounts[5], value: web3.utils.toWei('10', "ether")});

      // REGISTRATION REQUESTS
      await config.flightSuretyApp.registerAirline(accounts[6], {from: accounts[3]});
      assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]), false, "Airline should not be registered as less than M/2 calls occured for its registration");
      await config.flightSuretyApp.registerAirline(accounts[6], {from: accounts[4]});
      assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]), true, "Airline should be registered"); // 3 accounts registered account[6] ==> account[6] is accepted as airline

    });

    it('(Register Flight Test) ', async () => {
      let airline1 = config.firstAirline;
      let flight1 = "BRXA007";
      let timestamp1 = 24102020;

      // FUND AIRLINE
      await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: web3.utils.toWei('10', "ether")})

      // REGISTER FLIGHT
      await config.flightSuretyApp.registerFlight( airline1, flight1, timestamp1, web3.utils.toWei('0.2', "ether"), {from: config.firstAirline});

      let result = await config.flightSuretyData.isRegisteredFlight.call(airline1, flight1, timestamp1);
      assert.equal(result, true, "Flight should be registered");

      // BUY INSURANCE
      await config.flightSuretyApp.buy( airline1, flight1, timestamp1, {from: accounts[7], value: web3.utils.toWei('0.2', "ether")} );
      await config.flightSuretyApp.buy( airline1, flight1, timestamp1, {from: accounts[8], value: web3.utils.toWei('0.2', "ether")} );

      // CREDIT INSUREES
      await config.flightSuretyData.creditInsurees(airline1, flight1, timestamp1);
      let balance = await config.flightSuretyData.getAccountBalance.call(accounts[7]);
      let balance2 = await config.flightSuretyData.getAccountBalance.call(accounts[8]);

      assert.equal(balance, web3.utils.toWei('0.3', "ether"), "Incorrect payout to insuree");
      assert.equal(balance, web3.utils.toWei('0.3', "ether"), "Incorrect payout to insuree");

      // BUY INSURANCE
      await config.flightSuretyApp.buy( airline1, flight1, timestamp1, {from: accounts[9], value: web3.utils.toWei('0.2', "ether")} );
      
      // PROCESS FLIGHT STATUS: ON TIME
      await config.flightSuretyApp.processFlightStatus( airline1, flight1, timestamp1, 10 );

      let balance3 = await config.flightSuretyData.getAccountBalance.call(accounts[9]);
      assert.equal(balance3, web3.utils.toWei('0', "ether"), "Incorrect payout to insuree");
                              
      // PROCESS FLIGHT STATUS: LATE
      await config.flightSuretyApp.processFlightStatus( airline1, flight1, timestamp1, 20 );

      balance3 = await config.flightSuretyData.getAccountBalance.call(accounts[9]);
      assert.equal(balance3, web3.utils.toWei('0.3', "ether"), "Incorrect payout to insuree");

    });
  }

});
