const { expect } = require("chai");
const { ethers } = require("hardhat");

["FriendlyNFT", "UnfriendlyNFT"].forEach((CONTRACT) => {
  describe(CONTRACT, function () {
    let contractFactory;
    let owner;
    let signers;

    beforeEach(async () => {
      [owner, ...signers] = await ethers.getSigners();
      contractFactory = await ethers.getContractFactory(CONTRACT);
    });

    describe("Friendly NFT", async function () {
      it("Can Mint", async () => {
        contract = await contractFactory.deploy();
        await expect(contract.safeMint(signers[0].address)).to.emit(
          contract,
          "Transfer"
        );
      });
    });
  });
});