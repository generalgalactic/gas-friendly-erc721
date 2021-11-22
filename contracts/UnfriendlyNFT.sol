//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract UnfriendlyNFT is ERC721Enumerable {
    uint256 public totalTokens;

    constructor() ERC721("UnfriendlyNFT", "SAD") {}

    function safeMint(address to) public {
        totalTokens += 1;
        _safeMint(to, totalTokens);
    }
}