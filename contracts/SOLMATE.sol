//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {ERC721} from "@rari-capital/solmate/src/tokens/ERC721.sol";

contract SOLMATE_TEST is ERC721 {

    constructor() ERC721("SOLMATENFT", "SOLM") {}

    function tokenURI(uint256) public pure virtual override returns (string memory) {}

    function mint(address to) external payable {
        // _safeMint's second argument now takes in a quantity, not a tokenId.
        _safeMint(to, 1);
    }


    function mintMulti(uint total, address to) public {
      for (uint i; i < total; i++) {
        _safeMint(to, i);
      }
    }
}
