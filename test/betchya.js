/* global assert, artifacts, contract, web3 */
const Betchya = artifacts.require("./Betchya.sol");

import { resultNameToValue, toBetObject } from "../src/lib/contractUtils";

import { assertFailed } from "./util";

contract("Betchya", accounts => {
  // New contract for every test to avoid lingering state
  let betchya;
  beforeEach(async () => {
    betchya = await Betchya.new();
  });

  const [owner, proposer, acceptor, judge, otherAccount] = accounts;
  const betIndex = 0; // First bet will get index 0 in the array

  const createConfirmedBet = async () => {
    await betchya.createBet(acceptor, judge, "Challenged!", {
      from: proposer,
      value: web3.toWei(1, "ether")
    });

    await betchya.acceptBet(betIndex, {
      from: acceptor,
      value: web3.toWei(1, "ether")
    });

    await betchya.confirmJudge(betIndex, { from: judge });
  };

  describe("createBet", () => {
    it("should create a bet with valid params", async () => {
      const betCreatedWatcher = betchya.BetCreated();

      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      const events = await betCreatedWatcher.get();
      assert.equal(events.length, 1, "1 BetCreated event emitted");

      const eventArgs = events[0].args;
      assert.equal(
        eventArgs.betsIndex,
        0,
        "First bet has index 0 in bet array"
      );

      assert.equal(
        eventArgs.proposer,
        proposer,
        "Sender address is bet proposer"
      );

      assert.equal(
        eventArgs.acceptor,
        acceptor,
        "Acceptor address is correctly set"
      );

      assert.equal(eventArgs.judge, judge, "Judge address is correctly set");

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Created");
      assert.equal(bet.result, "NotSettled");
      assert.equal(bet.proposer, proposer, "Proposer address");
      assert.equal(bet.acceptor, acceptor, "Acceptor address");
      assert.equal(bet.judge, judge, "Judge address");
    });

    it("should fail on bets with empty description", async () => {
      await assertFailed(() =>
        betchya.createBet(acceptor, judge, "", {
          from: proposer,
          value: 1
        })
      );
    });

    describe("circuit breaker", () => {
      it("should not allow creating bets when contract is in onlyWithdrawal stage", async () => {
        await betchya.onlyWithdrawal({ from: owner });
        await assertFailed(() =>
          betchya.createBet(acceptor, judge, "Challenged!", {
            from: proposer,
            value: 1
          })
        );
      });

      it("should not allow creating bets when contract is in stopped stage", async () => {
        await betchya.stopContract({ from: owner });
        await assertFailed(() =>
          betchya.createBet(acceptor, judge, "Challenged!", {
            from: proposer,
            value: 1
          })
        );
      });
    });
  });

  describe("acceptBet", () => {
    it("should accept accept a bet if the acceptor calls with valid params", async () => {
      const betAcceptedWatcher = betchya.BetAccepted();

      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, { from: acceptor, value: 1 });

      const events = await betAcceptedWatcher.get();
      assert.equal(events.length, 1, "1 BetAccepted event emitted");
      assert.equal(
        events[0].args.betsIndex,
        betIndex,
        "betIndex is unchanged after acceptance"
      );

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Accepted");
    });

    it("it should fail if caller is not acceptor", async () => {
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await assertFailed(() =>
        betchya.acceptBet(betIndex, { from: otherAccount, value: 1 })
      );

      // Assert no change in bet state
      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Created");
      assert.equal(bet.result, "NotSettled");
    });

    it("it should fail if acceptor does not send the same amount as proposer ", async () => {
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await assertFailed(() =>
        betchya.acceptBet(betIndex, { from: acceptor, value: 2 })
      );

      await assertFailed(() =>
        betchya.acceptBet(betIndex, { from: acceptor, value: 0 })
      );

      // Assert no change in bet state
      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Created");
      assert.equal(bet.result, "NotSettled");
    });

    describe("circuit breaker", () => {
      it("should not allow accepting bets when contract is in onlyWithdrawal stage", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: 1
        });

        await betchya.onlyWithdrawal({ from: owner });

        await assertFailed(() =>
          betchya.acceptBet(betIndex, { from: acceptor, value: 1 })
        );
      });

      it("should not allow accepting bets when contract is in stopped stage", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: 1
        });

        await betchya.stopContract({ from: owner });

        await assertFailed(() =>
          betchya.acceptBet(betIndex, { from: acceptor, value: 1 })
        );
      });
    });
  });

  describe("confirmJudge", () => {
    it("should allow judge address to accept judge position", async () => {
      const judgeConfirmedWatcher = betchya.BetJudgeConfirmed();

      // Create and accept bet before confirming judge
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, {
        from: acceptor,
        value: 1
      });

      await betchya.confirmJudge(betIndex, { from: judge });

      const events = await judgeConfirmedWatcher.get();
      assert.equal(events.length, 1, "1 JudgeConfirmed event");
      assert.equal(events[0].args.betsIndex, betIndex, "betIndex is unchanged");

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "InProgress");
    });

    it("should fail if caller is not judge", async () => {
      // Create and accept bet before confirming judge
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, {
        from: acceptor,
        value: 1
      });

      await assertFailed(() =>
        betchya.confirmJudge(betIndex, { from: otherAccount })
      );

      // Assert no change in bet state
      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Accepted");
      assert.equal(bet.result, "NotSettled");
    });

    describe("circuit breaker", () => {
      it("should not allow confirm judge when contract is in onlyWithdrawal stage", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: 1
        });

        await betchya.acceptBet(betIndex, {
          from: acceptor,
          value: 1
        });

        await betchya.onlyWithdrawal({ from: owner });

        await assertFailed(() =>
          betchya.confirmJudge(betIndex, { from: judge })
        );
      });

      it("should not allow confirm judge when contract is in stopped stage", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: 1
        });

        await betchya.acceptBet(betIndex, {
          from: acceptor,
          value: 1
        });

        await betchya.onlyWithdrawal({ from: owner });

        await assertFailed(() =>
          betchya.confirmJudge(betIndex, { from: judge })
        );
      });
    });
  });

  describe("settleBet", () => {
    it("should settle bet if called by the judge", async () => {
      const betSettledWatcher = betchya.BetSettled();
      // Create, accept bet, accept judge before settling bet
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, {
        from: acceptor,
        value: 1
      });

      await betchya.confirmJudge(betIndex, { from: judge });

      const betResult = "ProposerWon";
      await betchya.settleBet(betIndex, resultNameToValue(betResult), {
        from: judge
      });

      const events = await betSettledWatcher.get();
      assert.equal(events.length, 1, "1 BetSettled event emitted");
      assert.equal(events[0].args.betsIndex, betIndex, "betIndex is unchanged");

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Settled");
      assert.equal(bet.result, betResult);
    });

    it("should not settle bet if called anyone other than the judge", async () => {
      // Create, accept bet, accept judge before settling bet
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, {
        from: acceptor,
        value: 1
      });

      await betchya.confirmJudge(betIndex, { from: judge });

      const betResult = "ProposerWon";
      await assertFailed(() =>
        betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: otherAccount
        })
      );

      // Assert no change in bet state
      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "InProgress");
      assert.equal(bet.result, "NotSettled");
    });

    it("should not settle bet if judge is trying to set result to NotSettled", async () => {
      // Create, accept bet, accept judge before settling bet
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, {
        from: acceptor,
        value: 1
      });

      await betchya.confirmJudge(betIndex, { from: judge });

      const betResult = "NotSettled";
      await assertFailed(() =>
        betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        })
      );

      // Assert no change in bet state
      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "InProgress");
      assert.equal(bet.result, "NotSettled");
    });

    describe("circuit breaker", () => {
      it("should not allow settling bets when contract is in onlyWithdrawal stage", async () => {
        await createConfirmedBet();
        await betchya.onlyWithdrawal({ from: owner });

        const betResult = "ProposerWon";
        await assertFailed(() =>
          betchya.settleBet(betIndex, resultNameToValue(betResult), {
            from: judge
          })
        );
      });

      it("should not allow creating bets when contract is in stopped stage", async () => {
        await createConfirmedBet();
        await betchya.stopContract({ from: owner });

        const betResult = "ProposerWon";
        await assertFailed(() =>
          betchya.settleBet(betIndex, resultNameToValue(betResult), {
            from: judge
          })
        );
      });
    });
  });

  describe("cancelBet", () => {
    it("should cancel a bet if called by proposer in created stage", async () => {
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      const betCancelledWatcher = betchya.BetCancelled();
      await betchya.cancelBet(betIndex, {
        from: proposer
      });

      const events = await betCancelledWatcher.get();

      assert.equal(events.length, 1, "1 BetCancelled event");
      assert.equal(events[0].args.betsIndex, betIndex, "betsIndex is correct");

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Cancelled");
    });

    it("should cancel a bet if called by acceptor in created stage", async () => {
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      const betCancelledWatcher = betchya.BetCancelled();

      await betchya.cancelBet(betIndex, {
        from: acceptor
      });

      const events = await betCancelledWatcher.get();

      assert.equal(events.length, 1, "1 BetCancelled event");
      assert.equal(events[0].args.betsIndex, betIndex, "betsIndex is correct");

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Cancelled");
    });

    it("should cancel a bet if called by proposer in accepted stage", async () => {
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, { from: acceptor, value: 1 });

      const betCancelledWatcher = betchya.BetCancelled();

      await betchya.cancelBet(betIndex, {
        from: proposer
      });

      const events = await betCancelledWatcher.get();

      assert.equal(events.length, 1, "1 BetCancelled event");
      assert.equal(events[0].args.betsIndex, betIndex, "betsIndex is correct");

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Cancelled");
    });

    it("should cancel a bet if called by acceptor in accepted stage", async () => {
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, { from: acceptor, value: 1 });

      const betCancelledWatcher = betchya.BetCancelled();

      await betchya.cancelBet(betIndex, {
        from: acceptor
      });

      const events = await betCancelledWatcher.get();

      assert.equal(events.length, 1, "1 BetCancelled event");
      assert.equal(events[0].args.betsIndex, betIndex, "betsIndex is correct");

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Cancelled");
    });

    it("should fail to cancel a bet if called by anyone else", async () => {
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, { from: acceptor, value: 1 });

      await assertFailed(() =>
        betchya.cancelBet(betIndex, {
          from: otherAccount
        })
      );

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "Accepted");
    });
    it("should fail to cancel a bet if in progress stage", async () => {
      await betchya.createBet(acceptor, judge, "Challenged!", {
        from: proposer,
        value: 1
      });

      await betchya.acceptBet(betIndex, { from: acceptor, value: 1 });

      await betchya.confirmJudge(betIndex, { from: judge });

      await assertFailed(() =>
        betchya.cancelBet(betIndex, {
          from: proposer
        })
      );

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "InProgress");
    });

    describe("circuit breaker", () => {
      it("should not allow cancelling bets when contract is in onlyWithdrawal stage", async () => {
        await createConfirmedBet();
        await betchya.onlyWithdrawal({ from: owner });

        await assertFailed(() =>
          betchya.cancelBet(betIndex, {
            from: proposer
          })
        );
      });

      it("should not allow cancelling bets when contract is in stopped stage", async () => {
        await createConfirmedBet();
        await betchya.stopContract({ from: owner });

        await assertFailed(() =>
          betchya.cancelBet(betIndex, {
            from: proposer
          })
        );
      });
    });
  });

  describe("withdraw", () => {
    describe("proposer won", () => {
      it("should allow proposer to withdraw the the entire amount", async () => {
        await createConfirmedBet();

        const betResult = "ProposerWon";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        const watcher = betchya.BetWithdrawn();

        const balance = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: proposer });
        const newBalance = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();

        const events = await watcher.get();

        assert.equal(events.length, 1, "1 BetWithdrawn event");
        const args = events[0].args;
        assert.equal(args.betsIndex, 0, "BetsIndex correct in event");
        assert.equal(args.withdrawer, proposer, "Correct withdrawer");

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balance) + 2,
          Math.round(newBalance),
          "Winner receives funds after withdrawing"
        );
      });

      it("should not allow proposer to withdraw multiple times", async () => {
        await createConfirmedBet();

        const betResult = "ProposerWon";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        await betchya.withdraw(betIndex, { from: proposer });
        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: proposer })
        );
      });

      it("should not allow acceptor to withdraw", async () => {
        await createConfirmedBet();

        const betResult = "ProposerWon";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: acceptor })
        );
      });
    });

    describe("acceptor won", () => {
      it("should allow acceptor to withdraw the the entire amount", async () => {
        await createConfirmedBet();

        const betResult = "AcceptorWon";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        const watcher = betchya.BetWithdrawn();
        const balance = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: acceptor });
        const newBalance = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();

        const events = await watcher.get();

        assert.equal(events.length, 1, "1 BetWithdrawn event");
        const args = events[0].args;
        assert.equal(args.betsIndex, 0, "BetsIndex correct in event");
        assert.equal(args.withdrawer, acceptor, "Correct withdrawer");

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balance) + 2,
          Math.round(newBalance),
          "Winner receives funds after withdrawing"
        );
      });

      it("should not allow proposer to withdraw multiple times", async () => {
        await createConfirmedBet();

        const betResult = "AcceptorWon";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        await betchya.withdraw(betIndex, { from: acceptor });
        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: acceptor })
        );
      });

      it("should not allow proposer to withdraw", async () => {
        await createConfirmedBet();

        const betResult = "AcceptorWon";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: proposer })
        );
      });
    });

    describe("draw", () => {
      it("should allow both proposer and acceptor to withdraw their initial deposit", async () => {
        await createConfirmedBet();

        const betResult = "Draw";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        const balanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: proposer });
        const newBalanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceProposer) + 1,
          Math.round(newBalanceProposer),
          "Proposer receives initial deposit funds after withdrawing on draw"
        );

        const balanceAcceptor = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: acceptor });
        const newBalanceAcceptor = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceAcceptor) + 1,
          Math.round(newBalanceAcceptor),
          "Acceptor receives initial deposit funds after withdrawing on draw"
        );
      });

      it("should not allow acceptor or proposer to withdraw twice", async () => {
        await createConfirmedBet();

        const betResult = "Draw";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        const balanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: proposer });
        const newBalanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: proposer })
        );

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceProposer) + 1,
          Math.round(newBalanceProposer),
          "Proposer receives initial deposit funds after withdrawing on draw"
        );

        const balanceAcceptor = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: acceptor });
        const newBalanceAcceptor = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: acceptor })
        );

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceAcceptor) + 1,
          Math.round(newBalanceAcceptor),
          "Acceptor receives initial deposit funds after withdrawing on draw"
        );
      });

      it("should not let other accounts withdraw", async () => {
        await createConfirmedBet();

        const betResult = "Draw";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: otherAccount })
        );
      });
    });

    describe("bet cancelled", () => {
      it("should allow proposer and acceptor to withdraw their initial deposit", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: web3.toWei(1, "ether")
        });

        await betchya.acceptBet(betIndex, {
          from: acceptor,
          value: web3.toWei(1, "ether")
        });

        await betchya.cancelBet(betIndex, { from: acceptor });

        const balanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: proposer });
        const newBalanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceProposer) + 1,
          Math.round(newBalanceProposer),
          "Proposer receives initial deposit funds after withdrawing on cancelled"
        );

        const balanceAcceptor = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: acceptor });
        const newBalanceAcceptor = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceAcceptor) + 1,
          Math.round(newBalanceAcceptor),
          "Acceptor receives initial deposit funds after withdrawing on cancelled"
        );
      });

      it("should not allow acceptor or proposer to withdraw twice", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: web3.toWei(1, "ether")
        });

        await betchya.acceptBet(betIndex, {
          from: acceptor,
          value: web3.toWei(1, "ether")
        });

        await betchya.cancelBet(betIndex, { from: acceptor });

        const balanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: proposer });
        const newBalanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: proposer })
        );

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceProposer) + 1,
          Math.round(newBalanceProposer),
          "Proposer receives initial deposit funds after withdrawing on cancelled"
        );

        const balanceAcceptor = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: acceptor });
        const newBalanceAcceptor = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: acceptor })
        );

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceAcceptor) + 1,
          Math.round(newBalanceAcceptor),
          "Acceptor receives initial deposit funds after withdrawing on cancelled"
        );
      });

      it("should not let other accounts withdraw", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: web3.toWei(1, "ether")
        });

        await betchya.acceptBet(betIndex, {
          from: acceptor,
          value: web3.toWei(1, "ether")
        });

        await betchya.cancelBet(betIndex, { from: acceptor });

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: otherAccount })
        );
      });

      it("should not allow acceptor to withdraw if hasn't deposited", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: web3.toWei(1, "ether")
        });

        // Add some extra funds in contract
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: otherAccount,
          value: web3.toWei(2, "ether")
        });

        await betchya.cancelBet(betIndex, { from: proposer });

        const balanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: proposer });
        const newBalanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceProposer) + 1,
          Math.round(newBalanceProposer),
          "Proposer receives initial deposit funds after withdrawing on cancelled"
        );

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: acceptor })
        );
      });
    });

    describe("circuit breaker", () => {
      it("should not allow withdrawals when contract is in stopped stage", async () => {
        await createConfirmedBet();
        const betResult = "ProposerWon";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });
        await betchya.stopContract({ from: owner });

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: proposer })
        );
      });

      it("should allow withdrawals when contract is in only withdrawal stage", async () => {
        await createConfirmedBet();
        const betResult = "AcceptorWon";
        await betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        });

        await betchya.onlyWithdrawal({ from: owner });

        const balance = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: acceptor });
        const newBalance = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balance) + 1,
          Math.round(newBalance),
          "Winner receives funds after withdrawing"
        );
      });

      it("should allow withdraw even if in progress if in only withdrawal stage", async () => {
        await createConfirmedBet();

        await betchya.onlyWithdrawal({ from: owner });

        const balance = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: acceptor });
        const newBalance = web3
          .fromWei(web3.eth.getBalance(acceptor), "ether")
          .toNumber();

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balance) + 1,
          Math.round(newBalance),
          "Winner receives funds after withdrawing"
        );
      });

      it("should not allow acceptor to withdraw if hasn't deposited", async () => {
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: proposer,
          value: web3.toWei(1, "ether")
        });

        // Add some extra funds in contract
        await betchya.createBet(acceptor, judge, "Challenged!", {
          from: otherAccount,
          value: web3.toWei(2, "ether")
        });

        await betchya.onlyWithdrawal({ from: owner });

        const balanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();
        await betchya.withdraw(betIndex, { from: proposer });
        const newBalanceProposer = web3
          .fromWei(web3.eth.getBalance(proposer), "ether")
          .toNumber();

        // Round to results to full ether to ignore transaction costs
        assert.equal(
          Math.round(balanceProposer) + 1,
          Math.round(newBalanceProposer),
          "Proposer receives initial deposit funds after withdrawing on cancelled"
        );

        await assertFailed(() =>
          betchya.withdraw(betIndex, { from: acceptor })
        );
      });
    });
  });
});
