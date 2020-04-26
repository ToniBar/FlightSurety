pragma solidity ^0.4.25;

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    uint public T_LENGTH;

    mapping(address => uint256) accounts;  // airline ==> account
    mapping(address => uint256) private authorizedContracts;
    //address[] multiCalls = new address[](0);
    address[] airlines = new address[](0);
    mapping(address => address[]) multiCalls; // airline => callers for registration
    mapping(address => Fund) funds; // airline address => funds
    mapping(bytes32 => address[]) insurees; // flight address => insuree addresses
    mapping(bytes32 => bool) insuranceCredited; // flight address => bool indicating whether insurance was payout.
    mapping(address => uint) insureesAccounts; // insuree address => account balance

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(string flight, uint256 timestamp, uint8 status, bool verified);
    event RegisterFlight(bytes32 key, bool hasValue);
    event CreditedInsurees(uint amount, uint length, bytes32 key);
    event Buy(bytes32 key, address buyer);
    event GetKey(bytes32 key, address airline, string flight, uint256 timestamp);

    struct Fund
    {
        uint256 balance;
        bool isFunded; // Indicates whether initial 10 ETH has been deposited by the airline
        bool hasValue;
    }

    struct Flight
    {
        address airline;
        uint insuranceAmount;
        FlightStatus status;
        bool hasValue;
    }

    // Flight data persisted forever
    struct FlightStatus {
        bool hasStatus;
        uint8 status;
    }
    mapping(bytes32 => Flight) flights;

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                )
                                public
    {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner ******");
        _;
    }

    /**
    * @dev Modifier that requires the "Contract" account to be authorized to call the function
    */
    modifier requireIsCallerAuthorized()
    {
        require(authorizedContracts[msg.sender] == 1, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the caller to be a registered airline
    */
    modifier requireIsCallerAirline()
    {
        require(isRegisteredAirline(msg.sender) == true, "Caller is not a registered airline");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }

    function isFundedAirline( address airline )
                            public
                            view
                            returns(bool)
    {
        require(airline != address(0), "Invalid airline address");
        require(isRegisteredAirline(airline), "Airline is not registered");

        return funds[airline].hasValue && ( funds[airline].balance > 0 );
    }

    function isRegisteredAirline( address airline )
                            public
                            view
                            returns(bool)
    {
        require(airline != address(0), "Invalid airline address");

        bool isRegistered = false;

        for(uint i = 0; i < airlines.length; i++ )
        {
            if(airlines[i] == airline)
            {
                isRegistered = true;
            }
        }

        return isRegistered;
    }

    function isAirline
                        (
                            address airline
                        )
                        public
                        view
                        returns(bool)
    {
        return funds[airline].hasValue;
    }

    function isRegisteredFlight
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                            public
                            //view
                            returns(bool)
    {
        bytes32 f_key = getFlightKey(airline, flight, timestamp);
        return flights[f_key].hasValue;
    }

    function isInsuranceCredited
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                            public
                            view
                            returns(bool)
    {
        return insuranceCredited[getFlightKey(airline, flight, timestamp)];
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
    {
        operational = mode;
    }

    function authorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
    }

    function deauthorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    function getAccountBalance(address insuree) external requireIsOperational view returns(uint)
    {
        return insureesAccounts[insuree];
    }

    function getNrRegisteredAirlines() public requireIsOperational view returns(uint)
    {
        return airlines.length;
    }

    function getInsuranceAmount(address airline, string flight, uint256 timestamp)  external requireIsOperational view returns(uint)
    {
        return flights[getFlightKey(airline, flight, timestamp)].insuranceAmount;
    }

    function getBuyer(address airline, string flight, uint256 timestamp)  public requireIsOperational  returns(address)
    {
        return insurees[getFlightKey(airline, flight, timestamp)][0];
    }

    function getNrBuyers(address airline, string flight, uint256 timestamp)  public requireIsOperational  returns(uint256)
    {
        return insurees[getFlightKey(airline, flight, timestamp)].length;
    }

    function getAirlineFund(address airline) public requireIsOperational view returns(uint256)
    {
        return funds[airline].balance;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerFlight
                            (
                                string flight,
                                address airl,
                                uint256 timestamp,
                                uint insAmount
                            )
                            public
                            //requireIsCallerAuthorized
    {
        bytes32 f_key = getFlightKey(airl, flight, timestamp);
        flights[f_key] = Flight({airline: airl, insuranceAmount: insAmount, status: FlightStatus({hasStatus:false, status:0}), hasValue: true });

        emit RegisterFlight(f_key, flights[f_key].hasValue);
    }

    function getMultiCalls(address airline) external view returns(address[])
    {
        return multiCalls[airline];
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
                            (
                                address airline
                            )
                            external
                            requireIsOperational
    {
        airlines.push(airline);

        funds[airline] = Fund({balance: 0, isFunded: false, hasValue: true});

        delete multiCalls[airline];
    }

    function countAirlineRegistrationCaller
                            (
                                address airline,
                                address caller
                            )
                            external
                            //requireContractOwner
    {
        multiCalls[airline].push(caller);
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                                address airline,
                                string flight,
                                uint256 timestamp,
                                address buyer
                            )
                            external
                            //requireContractOwner
    {
        bytes32 f_key = getFlightKey(airline, flight, timestamp);
        Flight memory f = flights[f_key];

        insurees[f_key].push(buyer);
        funds[f.airline].balance = funds[f.airline].balance.add(f.insuranceAmount);

       // emit Buy(f_key, buyer);
        emit GetKey(f_key, airline, flight, timestamp);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp
                                )
                                public
                                //requireContractOwner
    {
        bytes32 f_key = getFlightKey(airline, flight, timestamp);
        address[] memory insureesArray = insurees[f_key];
        uint length = insureesArray.length;
        uint amount = flights[getFlightKey(airline, flight, timestamp)].insuranceAmount.mul(3).div(2);

//        emit bv
//        hghg(insureesArray[0], insureesAccounts[insureesArray[0]]);

        for(uint i = 0; i < length; i++)
        {
            insureesAccounts[insureesArray[i]] = insureesAccounts[insureesArray[i]].add(amount);
            funds[airline].balance = funds[airline].balance.sub(amount);
        }

        delete insurees[f_key];

        emit GetKey(f_key, airline, flight, timestamp);
        //emit CreditedInsurees(amount, length, f_key);
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address insuree
                            )
                            external
    {
        insureesAccounts[insuree] = 0;
        insuree.transfer(insureesAccounts[insuree]);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                                address airline,
                                uint256 amount
                            )
                            external
    {
        funds[airline].balance = funds[airline].balance.add(amount);
        funds[airline].isFunded = true;
        funds[airline].hasValue = true;
    }

    function processFlight
                        (
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        bytes32 f_key = getFlightKey(airline, flight, timestamp);

        flights[f_key].hasValue = true;
        flights[f_key].status.status = statusCode;
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
                            external
                            payable
    {
        //fund();
    }


}

