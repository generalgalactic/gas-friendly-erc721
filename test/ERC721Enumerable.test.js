const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
  shouldBehaveLikeERC721Enumerable,
} = require("./ERC721.behavior.js");
const { ethers } = require("hardhat");
const { accounts } = require("@openzeppelin/test-environment");

describe("ERC721Enumerable", function () {
  const name = "Non Fungible Token";
  const symbol = "NFT";

  beforeEach(async function () {
    try {
      const ERC721Factory = await ethers.getContractFactory(
        "ERC721EnumerableMock"
      );
      this.token = await ERC721Factory.deploy(name, symbol);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  shouldBehaveLikeERC721("ERC721", ...accounts);
  shouldBehaveLikeERC721Metadata("ERC721", name, symbol, ...accounts);
  shouldBehaveLikeERC721Enumerable("ERC721", ...accounts);
});
