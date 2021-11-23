//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "./friendly/ERC721EnumerableF.sol";

contract FriendlyNFT is ERC721EnumerableF {
    uint256 public totalTokens;

    constructor(string memory _name, string memory _symbol) ERC721F(_name, _symbol) {}

    function safeMint(address to) public {
        totalTokens += 1;
        _safeMint(to, totalTokens);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    function mintMulti(uint total, address to) public {
        for (uint i; i < total; i++) {
            safeMint(to);
        }
    }
}
