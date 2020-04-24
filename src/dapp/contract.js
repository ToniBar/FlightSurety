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
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            let airline1 = accts[1];

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

            // Register airlines
            //this.fundAirline(airline1);
            //let af = this.getAirlineFunds();
            //console.log("Airline ", airline1, ", fund = ", af);
            this.registerAirline(accts[2]);

            //console.log("Trying to register airline 2");

            // Fund airline
            //this.fundAirline(this.airlines1);

            // Register flights
         /*   this.registerFlight(airline1, flight1, timestamp1, Web3.utils.toWei('0.3', "ether"));// Web3.utils.toWei('0.5', "ether"));//);//
            console.log("Airline ", airline1, ", fund = ", this.getAirlineFunds());
            
            console.log("Is operational ? => ", this.isOperational());
            console.log("Is flight registered ? => ", this.isRegisteredFlight());*/
          /*  this.registerFlight(airline1, flight2, timestamp2, Web3.utils.toWei("0.5", "ether"));
            this.registerFlight(airline1, flight3, timestamp3, Web3.utils.toWei("0.5", "ether"));

            this.flights.push(flight1.concat(":", timestamp1));
            this.flights.push(flight2.concat(":", timestamp2));
            this.flights.push(flight3.concat(":", timestamp3));*/

            callback();
        });
    }

    registerAirline(airline){
        let self =this;
        self.flightSuretyApp.methods
            .registerAirline(airline)
            .send({from: this.airlines[0]}, (error, result) => { });
    }

    getAirlineFunds(callback) {
        let self = this;
        self.flightSuretyApp.methods
             .getAirlineFunds()
             .call({ from: self.owner}, callback);
     }

    fundAirline(airline){
        let self = this;
        let fund = Web3.utils.toWei('1', "ether");

        console.log("********** fundAirline is called ! Airline = ", airline, ", funds = ", fund);
        self.flightSuretyApp.methods
            .fundAirline()
            .send({from: airline, value: fund, gas:10000000}, (error, result) =>{ });
    }
    
    registerFlight(airline, flight, timestamp, insuranceAmount){
        let self =this;
        self.flightSuretyApp.methods
            .registerFlight(airline, flight, timestamp, insuranceAmount)
            .send({from: self.owner, gas:10000000}, (error, result) => { });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    isRegisteredFlight(callback) {
        let self = this;
        self.flightSuretyApp.methods
             .isRegisteredFlight()
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
}