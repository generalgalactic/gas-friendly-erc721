const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { ZERO_ADDRESS } = constants;
const { BigNumber } = require("ethers");
// TODO: Replace with a real ethers/hardhat contract deploy like we do for the others
// const {
//   shouldSupportInterfaces,
// } = require("../../utils/introspection/SupportsInterface.behavior");

// const ERC721ReceiverMock = artifacts.require("ERC721ReceiverMock");
const ERC721ReceiverMock = undefined;

const Error = [
  "None",
  "RevertWithMessage",
  "RevertWithoutMessage",
  "Panic",
].reduce((acc, entry, idx) => Object.assign({ [entry]: idx }, acc), {});

const firstTokenId = 5042;
const secondTokenId = 79217;
const nonExistentTokenId = 13;
const fourthTokenId = 4;
const baseURI = "https://api.example.com/v1/";

const RECEIVER_MAGIC_VALUE = "0x150b7a02";

function shouldBehaveLikeERC721(errorPrefix, contractName, name, symbol) {
  let contractFactory;
  let token;
  var owner, newOwner, approved, anotherApproved, operator, other;

  // shouldSupportInterfaces(["ERC165", "ERC721"]);
  beforeEach(async function () {
    contractFactory = await ethers.getContractFactory(contractName);
    this.token = await contractFactory.deploy(name, symbol);
    [owner, newOwner, approved, anotherApproved, operator, other] =
      await ethers.getSigners();
  });

  context("with minted tokens", function () {
    beforeEach(async function () {
      console.log("with minted tokens, beforeEach");
      await this.token.mint(owner.address, firstTokenId);
      await this.token.mint(owner.address, secondTokenId);
      this.toWhom = other.address; // default to other for toWhom in context-dependent tests
    });

    describe("balanceOf", function () {
      context("when the given address owns some tokens", function () {
        it("returns the amount of tokens owned by the given address", async function () {
          console.log(await this.token.balanceOf(owner.address));
          expect(await this.token.balanceOf(owner.address)).to.be.equal(
            BigNumber.from(2)
          );
        });
      });

      context("when the given address does not own any tokens", function () {
        it("returns 0", async function () {
          expect(await this.token.balanceOf(other.address)).to.be.equal(
            BigNumber.from(0)
          );
        });
      });

      context("when querying the zero address", function () {
        it("throws", async function () {
          await expectRevert(
            this.token.balanceOf(ZERO_ADDRESS),
            "ERC721: balance query for the zero address"
          );
        });
      });
    });

    describe("ownerOf", function () {
      context("when the given token ID was tracked by this token", function () {
        const tokenId = firstTokenId;

        it("returns the owner of the given token ID", async function () {
          expect(await this.token.ownerOf(tokenId)).to.be.equal(owner.address);
        });
      });

      context(
        "when the given token ID was not tracked by this token",
        function () {
          const tokenId = nonExistentTokenId;

          it("reverts", async function () {
            await expectRevert(
              this.token.ownerOf(tokenId),
              "ERC721: owner query for nonexistent token"
            );
          });
        }
      );
    });

    describe("transfers", function () {
      const tokenId = firstTokenId;
      const data = "0x42";

      let logs = null;

      beforeEach(async function () {
        await this.token.approve(approved.address, tokenId, {
          from: owner.address,
        });
        await this.token.setApprovalForAll(operator.address, true, {
          from: owner.address,
        });
      });

      const transferWasSuccessful = function ({ owner, tokenId, approved }) {
        it("transfers the ownership of the given token ID to the given address", async function () {
          expect(await this.token.ownerOf(tokenId)).to.be.equal(this.toWhom);
        });

        it("emits a Transfer event", async function () {
          expectEvent.inLogs(logs, "Transfer", {
            from: owner,
            to: this.toWhom,
            tokenId: tokenId,
          });
        });

        it("clears the approval for the token ID", async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(
            ZERO_ADDRESS
          );
        });

        it("emits an Approval event", async function () {
          expectEvent.inLogs(logs, "Approval", {
            owner,
            approved: ZERO_ADDRESS,
            tokenId: tokenId,
          });
        });

        it("adjusts owners balances", async function () {
          expect(await this.token.balanceOf(owner)).to.be.equal(
            BigNumber.from(1)
          );
        });

        it("adjusts owners tokens by index", async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          expect(
            await this.token.tokenOfOwnerByIndex(this.toWhom, 0)
          ).to.be.equal(BigNumber.from(tokenId));

          expect(
            await this.token.tokenOfOwnerByIndex(owner, 0)
          ).to.be.not.equal(BigNumber.from(tokenId));
        });
      };

      const shouldTransferTokensByUsers = function (transferFunction) {
        context("when called by the owner", async function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(
              this,
              owner.address,
              this.toWhom,
              tokenId,
              { from: owner.address }
            ));
          });
          const [owner, , approved] = await ethers.getSigners();
          transferWasSuccessful({
            owner: owner.address,
            tokenId,
            approved: approved.address,
          });
        });

        context("when called by the approved individual", async function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(
              this,
              owner.address,
              this.toWhom,
              tokenId,
              { from: approved.address }
            ));
          });
          const [owner, , approved] = await ethers.getSigners();

          transferWasSuccessful({
            owner: owner.address,
            tokenId,
            approved: approved.address,
          });
        });

        context("when called by the operator", async function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(
              this,
              owner.address,
              this.toWhom,
              tokenId,
              { from: operator.address }
            ));
          });
          const [owner, , approved] = await ethers.getSigners();

          transferWasSuccessful({
            owner: owner.address,
            tokenId,
            approved: approved.address,
          });
        });

        context(
          "when called by the owner without an approved user",
          async function () {
            beforeEach(async function () {
              await this.token.approve(ZERO_ADDRESS, tokenId, {
                from: owner.address,
              });
              ({ logs } = await transferFunction.call(
                this,
                owner.address,
                this.toWhom,
                tokenId,
                { from: operator.address }
              ));
            });
            const [owner, , approved] = await ethers.getSigners();

            transferWasSuccessful({
              owner: owner.address,
              tokenId,
              approved: null,
            });
          }
        );

        context("when sent to the owner", function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(
              this,
              owner.address,
              owner.address,
              tokenId,
              { from: owner.address }
            ));
          });

          it("keeps ownership of the token", async function () {
            expect(await this.token.ownerOf(tokenId)).to.be.equal(
              owner.address
            );
          });

          it("clears the approval for the token ID", async function () {
            expect(await this.token.getApproved(tokenId)).to.be.equal(
              ZERO_ADDRESS
            );
          });

          it("emits only a transfer event", async function () {
            expectEvent.inLogs(logs, "Transfer", {
              from: owner.address,
              to: owner.address,
              tokenId: tokenId,
            });
          });

          it("keeps the owner balance", async function () {
            expect(await this.token.balanceOf(owner.address)).to.be.equal(
              BigNumber.from(2)
            );
          });

          it("keeps same tokens by index", async function () {
            if (!this.token.tokenOfOwnerByIndex) return;
            const tokensListed = await Promise.all(
              [0, 1].map((i) =>
                this.token.tokenOfOwnerByIndex(owner.address, i)
              )
            );
            expect(tokensListed.map((t) => t.toNumber())).to.have.members([
              firstTokenId.toNumber(),
              secondTokenId.toNumber(),
            ]);
          });
        });

        context(
          "when the address of the previous owner is incorrect",
          function () {
            it("reverts", async function () {
              await expectRevert(
                transferFunction.call(
                  this,
                  other.address,
                  other.address,
                  tokenId,
                  {
                    from: owner.address,
                  }
                ),
                "ERC721: transfer of token that is not own"
              );
            });
          }
        );

        context(
          "when the sender is not authorized for the token id",
          function () {
            it("reverts", async function () {
              await expectRevert(
                transferFunction.call(
                  this,
                  owner.address,
                  other.address,
                  tokenId,
                  {
                    from: other.address,
                  }
                ),
                "ERC721: transfer caller is not owner nor approved"
              );
            });
          }
        );

        context("when the given token ID does not exist", function () {
          it("reverts", async function () {
            await expectRevert(
              transferFunction.call(
                this,
                owner.address,
                other.address,
                nonExistentTokenId,
                {
                  from: owner.address,
                }
              ),
              "ERC721: operator query for nonexistent token"
            );
          });
        });

        context(
          "when the address to transfer the token to is the zero address",
          function () {
            it("reverts", async function () {
              await expectRevert(
                transferFunction.call(
                  this,
                  owner.address,
                  ZERO_ADDRESS,
                  tokenId,
                  {
                    from: owner.address,
                  }
                ),
                "ERC721: transfer to the zero address"
              );
            });
          }
        );
      };

      describe("via transferFrom", function () {
        shouldTransferTokensByUsers(function (from, to, tokenId, opts) {
          return this.token.transferFrom(from, to, tokenId, opts);
        });
      });

      describe("via safeTransferFrom", function () {
        const safeTransferFromWithData = function (from, to, tokenId, opts) {
          return this.token.methods[
            "safeTransferFrom(address,address,uint256,bytes)"
          ](from, to, tokenId, data, opts);
        };

        const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
          return this.token.methods[
            "safeTransferFrom(address,address,uint256)"
          ](from, to, tokenId, opts);
        };

        const shouldTransferSafely = function (transferFun, data) {
          describe("to a user account", function () {
            shouldTransferTokensByUsers(transferFun);
          });

          describe("to a valid receiver contract", function () {
            beforeEach(async function () {
              this.receiver = await ERC721ReceiverMock.new(
                RECEIVER_MAGIC_VALUE,
                Error.None
              );
              this.toWhom = this.receiver.address;
            });

            shouldTransferTokensByUsers(transferFun);

            it("calls onERC721Received", async function () {
              const receipt = await transferFun.call(
                this,
                owner.address,
                this.receiver.address,
                tokenId,
                { from: owner.address }
              );

              await expectEvent.inTransaction(
                receipt.tx,
                ERC721ReceiverMock,
                "Received",
                {
                  operator: owner.address,
                  from: owner.address,
                  tokenId: tokenId,
                  data: data,
                }
              );
            });

            it("calls onERC721Received from approved", async function () {
              const receipt = await transferFun.call(
                this,
                owner.address,
                this.receiver.address,
                tokenId,
                { from: approved.address }
              );

              await expectEvent.inTransaction(
                receipt.tx,
                ERC721ReceiverMock,
                "Received",
                {
                  operator: approved.address,
                  from: owner.address,
                  tokenId: tokenId,
                  data: data,
                }
              );
            });

            describe("with an invalid token id", function () {
              it("reverts", async function () {
                await expectRevert(
                  transferFun.call(
                    this,
                    owner.address,
                    this.receiver.address,
                    nonExistentTokenId,
                    { from: owner.address }
                  ),
                  "ERC721: operator query for nonexistent token"
                );
              });
            });
          });
        };

        describe("with data", function () {
          shouldTransferSafely(safeTransferFromWithData, data);
        });

        describe("without data", function () {
          shouldTransferSafely(safeTransferFromWithoutData, null);
        });

        describe("to a receiver contract returning unexpected value", function () {
          it("reverts", async function () {
            const invalidReceiver = await ERC721ReceiverMock.new(
              "0x42",
              Error.None
            );
            await expectRevert(
              this.token.safeTransferFrom(
                owner.address,
                invalidReceiver.address,
                tokenId,
                { from: owner.address }
              ),
              "ERC721: transfer to non ERC721Receiver implementer"
            );
          });
        });

        describe("to a receiver contract that reverts with message", function () {
          it("reverts", async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(
              RECEIVER_MAGIC_VALUE,
              Error.RevertWithMessage
            );
            await expectRevert(
              this.token.safeTransferFrom(
                owner.address,
                revertingReceiver.address,
                tokenId,
                { from: owner.address }
              ),
              "ERC721ReceiverMock: reverting"
            );
          });
        });

        describe("to a receiver contract that reverts without message", function () {
          it("reverts", async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(
              RECEIVER_MAGIC_VALUE,
              Error.RevertWithoutMessage
            );
            await expectRevert(
              this.token.safeTransferFrom(
                owner.address,
                revertingReceiver.address,
                tokenId,
                { from: owner.address }
              ),
              "ERC721: transfer to non ERC721Receiver implementer"
            );
          });
        });

        describe("to a receiver contract that panics", function () {
          it("reverts", async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(
              RECEIVER_MAGIC_VALUE,
              Error.Panic
            );
            await expectRevert.unspecified(
              this.token.safeTransferFrom(
                owner.address,
                revertingReceiver.address,
                tokenId,
                { from: owner.address }
              )
            );
          });
        });

        describe("to a contract that does not implement the required function", function () {
          it("reverts", async function () {
            const nonReceiver = this.token;
            await expectRevert(
              this.token.safeTransferFrom(owner, nonReceiver.address, tokenId, {
                from: owner.address,
              }),
              "ERC721: transfer to non ERC721Receiver implementer"
            );
          });
        });
      });
    });

    describe("safe mint", function () {
      const tokenId = fourthTokenId;
      const data = "0x42";

      describe("via safeMint", function () {
        // regular minting is tested in ERC721Mintable.test.js and others
        it("calls onERC721Received — with data", async function () {
          this.receiver = await ERC721ReceiverMock.new(
            RECEIVER_MAGIC_VALUE,
            Error.None
          );
          const receipt = await this.token.safeMint(
            this.receiver.address,
            tokenId,
            data
          );

          await expectEvent.inTransaction(
            receipt.tx,
            ERC721ReceiverMock,
            "Received",
            {
              from: ZERO_ADDRESS,
              tokenId: tokenId,
              data: data,
            }
          );
        });

        it("calls onERC721Received — without data", async function () {
          this.receiver = await ERC721ReceiverMock.new(
            RECEIVER_MAGIC_VALUE,
            Error.None
          );
          const receipt = await this.token.safeMint(
            this.receiver.address,
            tokenId
          );

          await expectEvent.inTransaction(
            receipt.tx,
            ERC721ReceiverMock,
            "Received",
            {
              from: ZERO_ADDRESS,
              tokenId: tokenId,
            }
          );
        });

        context(
          "to a receiver contract returning unexpected value",
          function () {
            it("reverts", async function () {
              const invalidReceiver = await ERC721ReceiverMock.new(
                "0x42",
                Error.None
              );
              await expectRevert(
                this.token.safeMint(invalidReceiver.address, tokenId),
                "ERC721: transfer to non ERC721Receiver implementer"
              );
            });
          }
        );

        context(
          "to a receiver contract that reverts with message",
          function () {
            it("reverts", async function () {
              const revertingReceiver = await ERC721ReceiverMock.new(
                RECEIVER_MAGIC_VALUE,
                Error.RevertWithMessage
              );
              await expectRevert(
                this.token.safeMint(revertingReceiver.address, tokenId),
                "ERC721ReceiverMock: reverting"
              );
            });
          }
        );

        context(
          "to a receiver contract that reverts without message",
          function () {
            it("reverts", async function () {
              const revertingReceiver = await ERC721ReceiverMock.new(
                RECEIVER_MAGIC_VALUE,
                Error.RevertWithoutMessage
              );
              await expectRevert(
                this.token.safeMint(revertingReceiver.address, tokenId),
                "ERC721: transfer to non ERC721Receiver implementer"
              );
            });
          }
        );

        context("to a receiver contract that panics", function () {
          it("reverts", async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(
              RECEIVER_MAGIC_VALUE,
              Error.Panic
            );
            await expectRevert.unspecified(
              this.token.safeMint(revertingReceiver.address, tokenId)
            );
          });
        });

        context(
          "to a contract that does not implement the required function",
          function () {
            it("reverts", async function () {
              const nonReceiver = this.token;
              await expectRevert(
                this.token.safeMint(nonReceiver.address, tokenId),
                "ERC721: transfer to non ERC721Receiver implementer"
              );
            });
          }
        );
      });
    });

    describe("approve", function () {
      const tokenId = firstTokenId;

      let logs = null;

      const itClearsApproval = function () {
        it("clears approval for the token", async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(
            ZERO_ADDRESS
          );
        });
      };

      const itApproves = function (address) {
        it("sets the approval for the target address", async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(address);
        });
      };

      const itEmitsApprovalEvent = function (address) {
        it("emits an approval event", async function () {
          expectEvent.inLogs(logs, "Approval", {
            owner: owner.address,
            approved: address,
            tokenId: tokenId,
          });
        });
      };

      context("when clearing approval", function () {
        context("when there was no prior approval", function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, {
              from: owner.address,
            }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });

        context("when there was a prior approval", function () {
          beforeEach(async function () {
            await this.token.approve(approved.address, tokenId, {
              from: owner.address,
            });
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, {
              from: owner.address,
            }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });
      });

      context("when approving a non-zero address", function () {
        context("when there was no prior approval", async function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(approved.address, tokenId, {
              from: owner.address,
            }));
          });
          const [, , approved] = await ethers.getSigners();

          itApproves(approved.address);
          itEmitsApprovalEvent(approved.address);
        });

        context(
          "when there was a prior approval to the same address",
          async function () {
            beforeEach(async function () {
              await this.token.approve(approved.address, tokenId, {
                from: owner.address,
              });
              ({ logs } = await this.token.approve(approved, tokenId, {
                from: owner.address,
              }));
            });
            const [, , approved] = await ethers.getSigners();

            itApproves(approved.address);
            itEmitsApprovalEvent(approved.address);
          }
        );

        context(
          "when there was a prior approval to a different address",
          async function () {
            beforeEach(async function () {
              await this.token.approve(anotherApproved.address, tokenId, {
                from: owner.address,
              });
              ({ logs } = await this.token.approve(
                anotherApproved.address,
                tokenId,
                {
                  from: owner.address,
                }
              ));
            });
            const [, , , anotherApproved] = await ethers.getSigners();
            itApproves(anotherApproved.address);
            itEmitsApprovalEvent(anotherApproved.address);
          }
        );
      });

      context(
        "when the address that receives the approval is the owner",
        function () {
          it("reverts", async function () {
            await expectRevert(
              this.token.approve(owner.address, tokenId, {
                from: owner.address,
              }),
              "ERC721: approval to current owner"
            );
          });
        }
      );

      context("when the sender does not own the given token ID", function () {
        it("reverts", async function () {
          await expectRevert(
            this.token.approve(approved.address, tokenId, {
              from: other.address,
            }),
            "ERC721: approve caller is not owner nor approved"
          );
        });
      });

      context(
        "when the sender is approved for the given token ID",
        function () {
          it("reverts", async function () {
            await this.token.approve(approved.address, tokenId, {
              from: owner.address,
            });
            await expectRevert(
              this.token.approve(anotherApproved.address, tokenId, {
                from: approved.address,
              }),
              "ERC721: approve caller is not owner nor approved for all"
            );
          });
        }
      );

      context("when the sender is an operator", async function () {
        beforeEach(async function () {
          await this.token.setApprovalForAll(operator.address, true, {
            from: owner.address,
          });
          ({ logs } = await this.token.approve(approved.address, tokenId, {
            from: operator.address,
          }));
        });
        const [, , approved] = await ethers.getSigners();
        itApproves(approved.address);
        itEmitsApprovalEvent(approved.address);
      });

      context("when the given token ID does not exist", function () {
        it("reverts", async function () {
          await expectRevert(
            this.token.approve(approved.address, nonExistentTokenId, {
              from: operator.address,
            }),
            "ERC721: owner query for nonexistent token"
          );
        });
      });
    });

    describe("setApprovalForAll", function () {
      context(
        "when the operator willing to approve is not the owner",
        function () {
          context(
            "when there is no operator approval set by the sender",
            function () {
              it("approves the operator", async function () {
                await this.token.setApprovalForAll(operator.address, true, {
                  from: owner.address,
                });

                expect(
                  await this.token.isApprovedForAll(
                    owner.address,
                    operator.address
                  )
                ).to.equal(true);
              });

              it("emits an approval event", async function () {
                const tx = await this.token.setApprovalForAll(
                  operator.address,
                  true,
                  { from: owner.address }
                );
                const { logs } = await tx.wait();
                console.log(logs);
                expectEvent.inLogs(logs, "ApprovalForAll", {
                  owner: owner.address,
                  operator: operator.address,
                  approved: true,
                });
              });
            }
          );

          context("when the operator was set as not approved", function () {
            beforeEach(async function () {
              await this.token.setApprovalForAll(operator.address, false, {
                from: owner.address,
              });
            });

            it("approves the operator", async function () {
              await this.token.setApprovalForAll(operator.address, true, {
                from: owner.address,
              });

              expect(
                await this.token.isApprovedForAll(
                  owner.address,
                  operator.address
                )
              ).to.equal(true);
            });

            it("emits an approval event", async function () {
              const { logs } = await this.token.setApprovalForAll(
                operator.address,
                true,
                { from: owner.address }
              );

              expectEvent.inLogs(logs, "ApprovalForAll", {
                owner: owner.address,
                operator: operator.address,
                approved: true,
              });
            });

            it("can unset the operator approval", async function () {
              await this.token.setApprovalForAll(operator.address, false, {
                from: owner.address,
              });

              expect(
                await this.token.isApprovedForAll(
                  owner.address,
                  operator.address
                )
              ).to.equal(false);
            });
          });

          context("when the operator was already approved", function () {
            beforeEach(async function () {
              await this.token.setApprovalForAll(operator.address, true, {
                from: owner.address,
              });
            });

            it("keeps the approval to the given address", async function () {
              await this.token.setApprovalForAll(operator.address, true, {
                from: owner.address,
              });

              expect(
                await this.token.isApprovedForAll(
                  owner.address,
                  operator.address
                )
              ).to.equal(true);
            });

            it("emits an approval event", async function () {
              const { logs } = await this.token.setApprovalForAll(
                operator.address,
                true,
                { from: owner.address }
              );

              expectEvent.inLogs(logs, "ApprovalForAll", {
                owner: owner.address,
                operator: operator.address,
                approved: true,
              });
            });
          });
        }
      );

      context("when the operator is the owner", function () {
        it("reverts", async function () {
          await expectRevert(
            this.token.setApprovalForAll(owner.address, true, {
              from: owner.address,
            }),
            "ERC721: approve to caller"
          );
        });
      });
    });

    describe("getApproved", async function () {
      context("when token is not minted", async function () {
        it("reverts", async function () {
          await expectRevert(
            this.token.getApproved(nonExistentTokenId),
            "ERC721: approved query for nonexistent token"
          );
        });
      });

      context("when token has been minted ", async function () {
        it("should return the zero address", async function () {
          expect(await this.token.getApproved(firstTokenId)).to.be.equal(
            ZERO_ADDRESS
          );
        });

        context("when account has been approved", async function () {
          beforeEach(async function () {
            await this.token.approve(approved, firstTokenId, {
              from: owner.address,
            });
          });

          it("returns approved account", async function () {
            expect(await this.token.getApproved(firstTokenId)).to.be.equal(
              approved.address
            );
          });
        });
      });
    });
  });

  describe("_mint(address, uint256)", function () {
    it("reverts with a null destination address", async function () {
      await expectRevert(
        this.token.mint(ZERO_ADDRESS, firstTokenId),
        "ERC721: mint to the zero address"
      );
    });

    context("with minted token", async function () {
      beforeEach(async function () {
        ({ logs: this.logs } = await this.token.mint(
          owner.address,
          firstTokenId
        ));
      });

      it("emits a Transfer event", function () {
        expectEvent.inLogs(this.logs, "Transfer", {
          from: ZERO_ADDRESS,
          to: owner.address,
          tokenId: firstTokenId,
        });
      });

      it("creates the token", async function () {
        expect(await this.token.balanceOf(owner.address)).to.be.equal(
          BigNumber.from(1)
        );
        expect(await this.token.ownerOf(firstTokenId)).to.equal(owner.address);
      });

      it("reverts when adding a token id that already exists", async function () {
        await expectRevert(
          this.token.mint(owner.address, firstTokenId),
          "ERC721: token already minted"
        );
      });
    });
  });

  describe("_burn", function () {
    it("reverts when burning a non-existent token id", async function () {
      await expectRevert(
        this.token.burn(nonExistentTokenId),
        "ERC721: owner query for nonexistent token"
      );
    });

    context("with minted tokens", function () {
      beforeEach(async function () {
        await this.token.mint(owner.address, firstTokenId);
        await this.token.mint(owner.address, secondTokenId);
      });

      context("with burnt token", function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.token.burn(firstTokenId));
        });

        it("emits a Transfer event", function () {
          expectEvent.inLogs(this.logs, "Transfer", {
            from: owner.address,
            to: ZERO_ADDRESS,
            tokenId: firstTokenId,
          });
        });

        it("emits an Approval event", function () {
          expectEvent.inLogs(this.logs, "Approval", {
            owner: owner.address,
            approved: ZERO_ADDRESS,
            tokenId: firstTokenId,
          });
        });

        it("deletes the token", async function () {
          expect(await this.token.balanceOf(owner.address)).to.be.equal(
            BigNumber.from(1)
          );
          await expectRevert(
            this.token.ownerOf(firstTokenId),
            "ERC721: owner query for nonexistent token"
          );
        });

        it("reverts when burning a token id that has been deleted", async function () {
          await expectRevert(
            this.token.burn(firstTokenId),
            "ERC721: owner query for nonexistent token"
          );
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Enumerable(
  errorPrefix,
  contractName,
  name,
  symbol
) {
  // shouldSupportInterfaces(["ERC721Enumerable"]);
  beforeEach(async function () {
    contractFactory = await ethers.getContractFactory(contractName);
    token = await contractFactory.deploy(name, symbol);
    [owner, newOwner, approved, anotherApproved, operator, other] =
      await ethers.getSigners();
  });

  context("with minted tokens", function () {
    beforeEach(async function () {
      await this.token.mint(owner.address, firstTokenId);
      await this.token.mint(owner.address, secondTokenId);
      this.toWhom = other.address; // default to other for toWhom in context-dependent tests
    });

    describe("totalSupply", function () {
      it("returns total token supply", async function () {
        expect(await this.token.totalSupply()).to.be.equal(BigNumber.from(2));
      });
    });

    describe("tokenOfOwnerByIndex", function () {
      describe("when the given index is lower than the amount of tokens owned by the given address", function () {
        it("returns the token ID placed at the given index", async function () {
          expect(
            await this.token.tokenOfOwnerByIndex(owner.address, 0)
          ).to.be.equal(BigNumber.from(firstTokenId));
        });
      });

      describe("when the index is greater than or equal to the total tokens owned by the given address", function () {
        it("reverts", async function () {
          await expectRevert(
            this.token.tokenOfOwnerByIndex(owner.address, 2),
            "ERC721Enumerable: owner index out of bounds"
          );
        });
      });

      describe("when the given address does not own any token", function () {
        it("reverts", async function () {
          await expectRevert(
            this.token.tokenOfOwnerByIndex(other.address, 0),
            "ERC721Enumerable: owner index out of bounds"
          );
        });
      });

      describe("after transferring all tokens to another user", function () {
        beforeEach(async function () {
          await this.token.transferFrom(
            owner.address,
            other.address,
            firstTokenId,
            {
              from: owner.address,
            }
          );
          await this.token.transferFrom(
            owner.address,
            other.address,
            secondTokenId,
            {
              from: owner.address,
            }
          );
        });

        it("returns correct token IDs for target", async function () {
          expect(await this.token.balanceOf(other)).to.be.equal(
            BigNumber.from(2)
          );
          const tokensListed = await Promise.all(
            [0, 1].map((i) => this.token.tokenOfOwnerByIndex(other, i))
          );
          expect(tokensListed.map((t) => t.toNumber())).to.have.members([
            firstTokenId.toNumber(),
            secondTokenId.toNumber(),
          ]);
        });

        it("returns empty collection for original owner", async function () {
          expect(await this.token.balanceOf(owner.address)).to.be.equal(
            BigNumber.from(0)
          );
          await expectRevert(
            this.token.tokenOfOwnerByIndex(owner.address, 0),
            "ERC721Enumerable: owner index out of bounds"
          );
        });
      });
    });

    describe("tokenByIndex", function () {
      it("returns all tokens", async function () {
        const tokensListed = await Promise.all(
          [0, 1].map((i) => this.token.tokenByIndex(i))
        );
        expect(tokensListed.map((t) => t.toNumber())).to.have.members([
          firstTokenId.toNumber(),
          secondTokenId.toNumber(),
        ]);
      });

      it("reverts if index is greater than supply", async function () {
        await expectRevert(
          this.token.tokenByIndex(2),
          "ERC721Enumerable: global index out of bounds"
        );
      });

      [firstTokenId, secondTokenId].forEach(function (tokenId) {
        it(`returns all tokens after burning token ${tokenId} and minting new tokens`, async function () {
          const newTokenId = new BN(300);
          const anotherNewTokenId = new BN(400);

          await this.token.burn(tokenId);
          await this.token.mint(newOwner.address, newTokenId);
          await this.token.mint(newOwner.address, anotherNewTokenId);

          expect(await this.token.totalSupply()).to.be.equal(BigNumber.from(3));

          const tokensListed = await Promise.all(
            [0, 1, 2].map((i) => this.token.tokenByIndex(i))
          );
          const expectedTokens = [
            firstTokenId,
            secondTokenId,
            newTokenId,
            anotherNewTokenId,
          ].filter((x) => x !== tokenId);
          expect(tokensListed.map((t) => t.toNumber())).to.have.members(
            expectedTokens.map((t) => t.toNumber())
          );
        });
      });
    });
  });

  describe("_mint(address, uint256)", function () {
    it("reverts with a null destination address", async function () {
      await expectRevert(
        this.token.mint(ZERO_ADDRESS, firstTokenId),
        "ERC721: mint to the zero address"
      );
    });

    context("with minted token", async function () {
      beforeEach(async function () {
        ({ logs: this.logs } = await this.token.mint(
          owner.address,
          firstTokenId
        ));
      });

      it("adjusts owner tokens by index", async function () {
        expect(
          await this.token.tokenOfOwnerByIndex(owner.address, 0)
        ).to.be.equal(BigNumber.from(firstTokenId));
      });

      it("adjusts all tokens list", async function () {
        expect(await this.token.tokenByIndex(0)).to.be.equal(
          BigNumber.from(firstTokenId)
        );
      });
    });
  });

  describe("_burn", function () {
    it("reverts when burning a non-existent token id", async function () {
      await expectRevert(
        this.token.burn(firstTokenId),
        "ERC721: owner query for nonexistent token"
      );
    });

    context("with minted tokens", function () {
      beforeEach(async function () {
        await this.token.mint(owner.address, firstTokenId);
        await this.token.mint(owner.address, secondTokenId);
      });

      context("with burnt token", function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.token.burn(firstTokenId));
        });

        it("removes that token from the token list of the owner", async function () {
          expect(
            await this.token.tokenOfOwnerByIndex(owner.address, 0)
          ).to.be.equal(BigNumber.from(secondTokenId));
        });

        it("adjusts all tokens list", async function () {
          expect(await this.token.tokenByIndex(0)).to.be.equal(
            BigNumber.from(secondTokenId)
          );
        });

        it("burns all tokens", async function () {
          await this.token.burn(secondTokenId, { from: owner.address });
          expect(await this.token.totalSupply()).to.be.equal(BigNumber.from(0));
          await expectRevert(
            this.token.tokenByIndex(0),
            "ERC721Enumerable: global index out of bounds"
          );
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Metadata(
  errorPrefix,
  contractName,
  name,
  symbol
) {
  // shouldSupportInterfaces(["ERC721Metadata"]);
  beforeEach(async function () {
    contractFactory = await ethers.getContractFactory(contractName);
    token = await contractFactory.deploy(name, symbol);
    [owner, newOwner, approved, anotherApproved, operator, other] =
      await ethers.getSigners();
  });

  describe("metadata", function () {
    it("has a name", async function () {
      expect(await this.token.name()).to.be.equal(name);
    });

    it("has a symbol", async function () {
      expect(await this.token.symbol()).to.be.equal(symbol);
    });

    describe("token URI", function () {
      beforeEach(async function () {
        await this.token.mint(owner.address, firstTokenId);
      });

      it("return empty string by default", async function () {
        expect(await this.token.tokenURI(firstTokenId)).to.be.equal("");
      });

      it("reverts when queried for non existent token id", async function () {
        await expectRevert(
          this.token.tokenURI(nonExistentTokenId),
          "ERC721Metadata: URI query for nonexistent token"
        );
      });

      describe("base URI", function () {
        beforeEach(function () {
          if (this.token.setBaseURI === undefined) {
            this.skip();
          }
        });

        it("base URI can be set", async function () {
          await this.token.setBaseURI(baseURI);
          expect(await this.token.baseURI()).to.equal(baseURI);
        });

        it("base URI is added as a prefix to the token URI", async function () {
          await this.token.setBaseURI(baseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(
            baseURI + firstTokenId.toString()
          );
        });

        it("token URI can be changed by changing the base URI", async function () {
          await this.token.setBaseURI(baseURI);
          const newBaseURI = "https://api.example.com/v2/";
          await this.token.setBaseURI(newBaseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(
            newBaseURI + firstTokenId.toString()
          );
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Enumerable,
  shouldBehaveLikeERC721Metadata,
};
