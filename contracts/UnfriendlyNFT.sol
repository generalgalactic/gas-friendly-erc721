//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract UnfriendlyNFT is ERC721Enumerable {
    uint256 public totalTokens;

    constructor() ERC721("UnfriendlyNFT", "SAD") {}

    function mint(address to) public {
        _mint(to, totalTokens);
        totalTokens += 1;
    }
    function mintMulti(uint total, address to) public {
      for (uint i; i < total; i++) {
        mint(to);
      }
    }
    function burn(uint tokenId) public {
      _burn(tokenId);
    }
}
