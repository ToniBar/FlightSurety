
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

     /*   contract.isRegistered((error, result) => {
            console.log(error,result);
            display('Airline Registration', 'Check if airline is registered', [ { label: 'Registration Status', error: error, value: result} ]);
        });

        contract.getAirlineFunds((error, result) => {
            console.log(error,result);
            display('Airline Fund', 'Check airline fund', [ { label: 'Airline fund', error: error, value: result} ]);
        });*/
    
        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flights2').value;
            // Write transaction
            
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ==> ' + result.timestamp} ]);
            });
        });

        let dropdown = document.getElementById('framework');
        let dropdown2 = document.getElementById('flights2');
        let fls = contract.retrieveFlights();

        console.log("fls ==> ", fls);

        var arrayLength = fls.length;
        for (var i = 0; i < arrayLength; i++) {            
            dropdown.options[i] = new Option(fls[i], fls[i]);
            dropdown2.options[i] = new Option(fls[i], fls[i]);
        }

        DOM.elid('buy-flight1').addEventListener('click', () => {
            let flight = DOM.elid('framework').value;
            // Write transaction
            contract.buy(flight, (error, result) => {
                console.log(error,result);
                display('Insurance bought', 'Overview', [ { label: 'Passenger ', error: error, value: result.passenger}, { label: 'Flight ', error: error, value: result.flight_i} ]);
            });
          /*  contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ==> ' + result.timestamp} ]);
            });*/
        })

      /*  DOM.elid('simulate-oracle').addEventListener('click', () => {            
            // Write transaction
            let flight = DOM.elid('framework').value;
            contract.processFlightStatus(flight, (error, result) => {
                console.log(error,result);
                display('Simulating oracle', 'Process flight status', [ { label: 'Status ', error: error, value: result.statusCode}, { label: 'Flight ', error: error, value: result.fl} ]);
            });
        });*/

        DOM.elid('getbalance').addEventListener('click', () => {            
            // Write transaction
            contract.getAccountBalance((error, result) => {
                console.log(error,result);
                display('Account balance', '', [ { label: 'Status ', error: error, value: result}]);
            });
        });

        DOM.elid('withdraw').addEventListener('click', () => {            
            // Write transaction
            contract.withdraw((error, result) => {
                console.log(error,result);
            });
        });

    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







