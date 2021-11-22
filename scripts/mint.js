/* eslint no-use-before-define: "warn" */
const fs = require("fs").promises;
const chalk = require("chalk");
const { config, ethers } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");


const main = async () => {
  // ADDRESS TO MINT TO:
  const { deployer, tokenOwner } = await getNamedAccounts();

  const contract = await ethers.getContract("Contract", tokenOwner);
  

  for (i=0;i<1440;i++) {
    console.log("😀 Minting");
    const mintResponse = await contract.mint();
    const txHash = mintResponse.hash;
    console.log(`😀 Hash ${txHash}`);   
  }
};


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });