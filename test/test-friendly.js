["FriendlyNFT", "FriendlyNFT2", "UnfriendlyNFT"].forEach((CONTRACT) => {
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
        contract = await contractFactory.deploy();
        await expect(contract.safeMint(signers[0].address)).to.emit(
          contract,
          "Transfer"
        );
      });
      it("Can Mint 100", async () => {
        contract = await contractFactory.deploy();
        await expect(contract.mintMulti(100, signers[0].address)).to.emit(
          contract,
          "Transfer"
        );
      });
    });
    describe("Reading", async function () {
      it("Can get totalSupply() after minting 1", async () => {
        contract = await contractFactory.deploy();
        await contract.safeMint(signers[0].address);
        expect((await contract.totalSupply()).toNumber()).to.equal(1);
      });
      it("Can get totalSupply() after minting 500", async () => {
        contract = await contractFactory.deploy();
        await contract.mintMulti(100, signers[0].address);
        expect((await contract.totalSupply()).toNumber()).to.equal(100);
      });
    });
  });
});
