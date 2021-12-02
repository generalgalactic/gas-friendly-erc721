//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "./friendly/ERC721EnumerableF.sol";

contract FriendlyNFT is ERC721EnumerableF {

    constructor() ERC721F("FriendlyNFT", "HAPY") {}

    function mint(address to) public {
        _mint(to);
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
