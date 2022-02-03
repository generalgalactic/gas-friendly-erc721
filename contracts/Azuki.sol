//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

// import "erc721a/contracts/ERC721A.sol";
import "./friendly/ERC721A.sol";

contract ERC721A_TEST is ERC721A {
  constructor() ERC721A("Azuki", "AZUKI") {}

  function mint(address to) external payable {
    // _safeMint's second argument now takes in a quantity, not a tokenId.
    _safeMint(to, 1);
  }

  function mintMulti(uint total, address to) public {
    _safeMint(to, total);
  }
}