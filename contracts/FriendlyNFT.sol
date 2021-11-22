//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "./friendly/ERC721EnumerableF.sol";

contract FriendlyNFT is ERC721EnumerableF {
    uint256 public totalTokens;

    constructor() ERC721F("FriendlyNFT", "HAPY") {}

    function safeMint(address to) public {
        totalTokens += 1;
        _safeMint(to, totalTokens);
    }
}
