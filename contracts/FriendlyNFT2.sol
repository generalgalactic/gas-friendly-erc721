//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "./friendly/ERC721EnumerableF2.sol";

contract FriendlyNFT2 is ERC721EnumerableF2 {
    uint256 public totalTokens;

    constructor() ERC721F2("FriendlyNFT2", "HAPY2", 10000) {}

    function safeMint(address to) public {
        totalTokens += 1;
        _safeMint(to, totalTokens);
    }
    function mintMulti(uint total, address to) public {
      for (uint i; i < total; i++) {
        safeMint(to);
      }
    }
}
