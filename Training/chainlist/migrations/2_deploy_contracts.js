var ChainList = artifacts.require("./ChainList.sol");
var Ownable = artifacts.require("./Ownable.sol");

module.exports = function(deployer) {
  deployer.deploy(ChainList);
  deployer.deploy(Ownable);
}
