// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "./ERC721F.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

/**
 * @dev This implements an optional extension of {ERC721} defined in the EIP that adds
 * enumerability of all the token ids in the contract as well as all token ids owned by each
 * account.
 */
abstract contract ERC721EnumerableF is ERC721F, IERC721Enumerable {

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC721F) returns (bool) {
        return interfaceId == type(IERC721Enumerable).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual override returns (uint256) {
        require(index < ERC721F.balanceOf(owner), "ERC721Enumerable: owner index out of bounds");
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < _tokens.length; i++) {
          if (_tokens[i] == owner) {
            if (currentIndex == index) {
              return i;
            }
            currentIndex += 1;
          }
        }
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        uint256 supply = 0;
        for (uint256 i = 0; i < _tokens.length; i++) {
          if (_tokens[i] == address(0)) {
            supply += 1;
          }
        }
        return supply;
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index) public view virtual override returns (uint256) {
        require(index < _tokens.length, "ERC721Enumerable: global index out of bounds");
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < _tokens.length; i++) {
          if (_tokens[i] != address(0)) {
            if (currentIndex == index) {
              return i;
            }
            currentIndex += 1;
          }
        }
    }
}
