const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UnfriendlyNFT", function () {
  let contractFactory;
  let owner;
  let signers;

  beforeEach(async () => {
    [owner, ...signers] = await ethers.getSigners();
    contractFactory = await ethers.getContractFactory("UnfriendlyNFT");
  });

  describe("Unfriendly NFT", async function () {
    it("Should do something", async () => {
      contract = await contractFactory.deploy();
      await contract.safeMint(signers[0].address);
    });
  });
});
