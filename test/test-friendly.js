const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FriendlyNFT", function () {
  let hardhatToken;
  let owner;
  let signers;

  beforeEach(async function () {
    [owner, ...signers] = await ethers.getSigners();
    const dToken = await ethers.getContractFactory("FriendlyNFT");
    hardhatToken = await dToken.deploy();
  });

  describe("Test", function () {});
});
