const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
  shouldBehaveLikeERC721Enumerable,
} = require("./test.behaviors.js");

const contractName = "FriendlyNFT";
const name = "Friendly NFT";
const symbol = "HAPY";

describe("FriendlyNFT", function () {
  shouldBehaveLikeERC721("ERC721", contractName, name, symbol);
  shouldBehaveLikeERC721Metadata("ERC721", contractName, name, symbol);
  shouldBehaveLikeERC721Enumerable("ERC721", contractName, name, symbol);
});
