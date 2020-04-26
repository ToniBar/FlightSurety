import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [];
        this.insuranceAmount = Web3.utils.toWei('0.3', "ether");
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            let airline1 = accts[1];
            console.log("airline1 = ", airline1);

            let flight1 = "SN4563";
            let flight2 = "SN3663";
            let flight3 = "SN1144";

            let timestamp1 = 1587674402;
            let timestamp2 = 1587674402;
            let timestamp3 = 1587674402;

            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                console.log("airline = ", accts[counter]);
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            this.flights.push(flight1);
            this.flights.push(flight2);
            this.flights.push(flight3);

            // Register airlines
            //this.registerAirline(airline1);
            this.fundAirline(airline1);
            let af = this.getAirlineFunds();
            console.log("Airline ", airline1, ", fund = ", af);
            //this.registerAirline(accts[2]);

            // Register flights
            this.registerFlight(airline1, flight1, timestamp1, this.insuranceAmount);
            console.log("Registering flight ... airline: ", airline1, ", flight: ", flight1, ", timestamp: ", timestamp1);
            this.registerFlight(airline1, flight2, timestamp2, this.insuranceAmount);
            this.registerFlight(airline1, flight3, timestamp3, this.insuranceAmount);


            callback();
        });
    }

    retrieveFlights()
    {
        let self = this;
        return this.flights;        
    }

    registerAirline(airline){
        let self =this;
        self.flightSuretyApp.methods
            .registerAirline(airline)
            .send({from: this.airlines[0]}, (error, result) => { });
    }

    fundAirline(airline){
        let self = this;
        let fund = Web3.utils.toWei('10', "ether");

        self.flightSuretyApp.methods
            .fundAirline()
            .send({from: airline, value: fund}, (error, result) =>{ });
    }
    
    registerFlight(airline, flight, timestamp, insuranceAmount){
        let self =this;
        self.flightSuretyApp.methods
            .registerFlight(airline, flight, timestamp, insuranceAmount)
            .send({from: airline, gas: 6700000}, (error, result) => { });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: 1587674402
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    isRegistered(callback) {
        let self = this;
        self.flightSuretyApp.methods
             .isRegistered()
             .call({ from: self.owner}, callback);
     }

     buy(flight, callback)
     {
         let self = this;
         let data = {
             airline: this.airlines[0],
             flight_i: flight,
             passenger: this.passengers[1]
         };
         self.flightSuretyApp.methods
           .buy ( data.airline, flight, 1587674402 )
           .send({ from: data.passenger, value: this.insuranceAmount, gas: 6700000}, (error, result) =>{
               callback(error, data)
            });
     }

     processFlightStatus(flight, callback)
     {
        let self = this;
        let data = {
            airline: this.airlines[0],
            fl: flight,
            tstamp: 1587674402,
            statusCode: 20,
            passenger: this.passengers[1]
        };
        self.flightSuretyApp.methods
          .processFlightStatus ( data.airline, data.fl, data.tstamp, data.statusCode)
          .send({ from: data.passenger, gas: 6700000}, (error, result) =>{
              callback(error, data)
           });
     }

     getAccountBalance(callback)
     {
        let self = this;
        self.flightSuretyApp.methods.
        getAccountBalance(this.passengers[1])
        .call({ from: self.owner}, callback);
     }

     withdraw(callback)
     {
        let self = this;
        self.flightSuretyApp.methods
        .withdraw()
        .send({ from: this.passengers[1], gas: 6700000 }, callback);
     }
}