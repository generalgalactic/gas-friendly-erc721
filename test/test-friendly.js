const { expect } = require("chai");
const { ethers } = require("hardhat");

["ERC721S_TEST", "ERC721E_TEST", "ERC721A_TEST", "SOLMATE_TEST"].forEach((CONTRACT) => {
  describe(CONTRACT, async function () {
    let contractFactory;
    let owner;
    let signers;

    beforeEach(async () => {
      [owner, ...signers] = await ethers.getSigners();
      contractFactory = await ethers.getContractFactory(CONTRACT);
    });

    describe("Minting", async function () {
      it("Can Mint 1", async () => {
        const contract = await contractFactory.deploy();
        await expect(contract.mint(signers[0].address)).to.emit(
          contract,
          "Transfer"
        );
      });
      const total = 100;
      it(`Can Mint ${total}`, async () => {
        const contract = await contractFactory.deploy();
        await expect(contract.mintMulti(total, signers[0].address)).to.emit(
          contract,
          "Transfer"
        );
      });
    });

    // const total = 1001;
    // describe(`Minting ${total.toLocaleString()}, and reading totalSupply and balanceOf`, async function () {
    //   let contract;

    //   beforeEach(async () => {
    //     contract = await contractFactory.deploy();
    //     await contract.mint(signers[0].address);
    //     for (let i = 0; i < (total - 1) / 100; i += 1) {
    //       await contract.mintMulti(100, signers[1].address);
    //     }
    //   });

    //   it(`totalSupply() should equal ${total.toLocaleString()}`, async () => {
    //     expect((await contract.totalSupply()).toNumber()).to.equal(total);
    //   });
    //   it("balanceOf(signer[0]) should be 1", async () => {
    //     expect((await contract.balanceOf(signers[0].address)).toNumber()).to.equal(1);
    //   });
    //   it(`balanceOf(signer[1]) should be ${(total - 1).toLocaleString()}`, async () => {
    //     expect((await contract.balanceOf(signers[1].address)).toNumber()).to.equal(total - 1);
    //   });
    //   it(`tokenOfOwnerByIndex(signer[0], 0) should equal 0`, async () => {
    //     expect((await contract.tokenOfOwnerByIndex(signers[0].address, 0)).toNumber()).to.equal(0);
    //   });
    //   it(`tokenOfOwnerByIndex(signer[1], 0) should equal 1`, async () => {
    //     expect((await contract.tokenOfOwnerByIndex(signers[1].address, 0)).toNumber()).to.equal(1);
    //   });
    //   it(`tokenOfOwnerByIndex(signer[1], ${total - 2}) should equal ${total - 1}`, async () => {
    //     expect((await contract.tokenOfOwnerByIndex(signers[1].address, total - 2)).toNumber()).to.equal(total - 1);
    //   });
    //   it(`tokenByIndex(${total - 1}) should equal ${total - 1}`, async () => {
    //     expect((await contract.tokenByIndex(total - 1)).toNumber()).to.equal(total - 1);
    //   });
    //   it(`tokenByIndex(999) should equal ${1000} if one was burned`, async () => {

    //     // THIS IS CONFUSING
    //     // We think OpenZeppelin is wrong
    //     // await contract.burn(4);
    //     // console.log(`total supply!!!! ${(await contract.totalSupply()).toNumber()}`);
    //     // expect((await contract.totalSupply()).toNumber()).to.equal(total - 1);
    //     // expect((await contract.tokenByIndex(4)).toNumber()).to.equal(5);
    //   });
    // });
  });
});