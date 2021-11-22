const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UnfriendlyNFT", function () {
  let hardhatToken;
  let owner;
  let signers;

  beforeEach(async function () {
    [owner, ...signers] = await ethers.getSigners();
    const dToken = await ethers.getContractFactory("UnfriendlyNFT");
    hardhatToken = await dToken.deploy();
  });

  describe("Test", function () {});
});
