# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Run test
A variable <run_original> has been added in the file test/flightSurety.js. When set to 1 the original test cases will be runned. 
When set to 0 the new test cases added for this project will be runned. The reason for introducing this is because the original test 
cases have an impact that make my new test cases fail. 

## Dapp usage
I made a very basic simple dapp with minimal functionality. The available functionality is just enough to show that the code works fine. 
The dapp has 3 flights with same timestamps that are preloaded during initialization. Because the timestamps are the same I didn't introduce extra fields
showing the timestamps. First there is a drop down showing the flight numbers. 

After selecting one of the flights the "Buy" button can be pressed. 
By doing so insurance is bought for this flight. During our initialization some passenger accounts are preloaded. We made the buy functionality such 
that the second passenger will be the one buying insurances and withdrawing money. So after pressing the "Buy" button, insurance will be bought by the 
second passenger. A display will be shown showing the address of the passenger and the flight number.

Note that the way I made this dapp is slightly different than the orinal task description. I made the dapp in such a way that each flight determines for itself
how big the insurance amount is that the passenger has to pay. I set this insurance amount to 0.3 ETH during the initialization of the dapp and this for each flight.
This means that a passenger has to pay exactly 0.3 ETH when buying insurance and will receive 0.45 ETH when the flight is late. So this is a slightly different approach 
than asked but it doesn't lower the difficulty of the project. I just did it this way because I overlooked this part in the task desciption and realized this afterwards. 

After having bought the insurance it is now possible to ask the flight status to the oracles by pressing on the "Submit to Oracles" button. However, next to this button
there is another drop down menu with the different flights. Select here the same flight as the flight you bought insurance for before you press the "Submit to Oracles" button. 
The oracles are made in such a way that the response number will always be 20 (flight too late), so that the passenger will always receive 0.45 ETH on his account. 

There is a button "Get account balance". If you submitted an oracle request for a flight you bought insurance for, then after pressing the "Get account balance" button, you should see 
text showing that the passenger has 0.45 ETH in his balance. If you buy insurance for another flight and submit again to oracle, then you will see that your balance will be 0.9 ETH. 
The passenger can withdraw the money in its balance to its account by pressing the "Withdraw money" button. After doing that you can see that the account balance for the passenger in 
the smart contract is 0 again. 

## Oracles
Concerning the oracles code, I do have a question. The insurees should be credited after 3 oracles give a same reply. However I had 8 oracles replying the same message and this caused 
the passenger to receive too much money on its balance. The reason was that money was put on his balance at the third oracle request that ented, but also at the subsequent oracle replies. 
In order to avoid this, I used the isOpen attribute and set this to false in the function "submitOracleResponse". Is this a correct approach ? To me it looks a good approach but it doesn't 
fit the error message in that function: 

require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

This is what makes me hesitate my solution. 

