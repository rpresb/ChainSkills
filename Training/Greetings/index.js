var Web3 = require('web3'),
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545")),
    solc = require('solc'),
    fs = require('fs');

var accounts = web3.eth.accounts;
var sourceCode = fs.readFileSync('Greetings.sol').toString();
var compiledCode = solc.compile(sourceCode);
var contractABI = JSON.parse(compiledCode.contracts[':Greetings'].interface);
var greetingsContract = web3.eth.contract(contractABI);

var byteCode = compiledCode.contracts[':Greetings'].bytecode;

var greetingsDeployed = greetingsContract.new({ data: byteCode, from: web3.eth.accounts[0], gas: 4700000 });

// var greetingsInstance = greetingsContract.at(greetingsDeployed.address);

// console.log(greetingsInstance.getGreetings());

// greetingsInstance.setGreetings("Hello Rodrigo", {from: web3.eth.accounts[0]})