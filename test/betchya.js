/* global assert, artifacts, contract */
const Betchya = artifacts.require("./Betchya.sol");

import { resultNameToValue, toBetObject } from "../src/lib/contractUtils";

const assertFailed = async promiseFn => {
  try {
    await promiseFn();
  } catch (e) {
    return;
  }

  assert(false, "Did not fail as expected");
};

contract("Betchya", accounts => {
  // New contract for every test to avoid lingering state
  let betchya;
  beforeEach(async () => {
    betchya = await Betchya.new();
  });

  const [proposer, acceptor, judge, otherAccount] = accounts;
  const betIndex = 0; // First bet will get index 0 in the array

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
      assertFailed(() =>
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
      assertFailed(() =>
        betchya.settleBet(betIndex, resultNameToValue(betResult), {
          from: judge
        })
      );

      // Assert no change in bet state
      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "InProgress");
      assert.equal(bet.result, "NotSettled");
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

      assertFailed(() =>
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

      const betCancelledWatcher = betchya.BetCancelled();

      assertFailed(() =>
        betchya.cancelBet(betIndex, {
          from: proposer
        })
      );

      const bet = await betchya.bets.call(betIndex).then(toBetObject);
      assert.equal(bet.stage, "InProgress");
    });
  });
});
