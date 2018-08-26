/* global assert, artifacts, contract, web3 */
const EthPriceJudge = artifacts.require("./EthPriceJudge.sol");
const Betchya = artifacts.require("./Betchya.sol");

import { toResult } from "../src/lib/contractUtils";
import { promisifyLogEvent } from "./util";

contract("EthPriceJudge", accounts => {
  // New contract for every test to avoid lingering state
  let betchya;
  let ethPriceJudge;
  beforeEach(async () => {
    betchya = await Betchya.new();
    ethPriceJudge = await EthPriceJudge.new(betchya.address);
  });

  const [_, proposer, acceptor, judge] = accounts;
  const betIndex = 0;

  const createConfirmedBet = async price => {
    await betchya.createBet(acceptor, ethPriceJudge.address, price.toString(), {
      from: proposer,
      value: web3.toWei(1, "ether")
    });

    await betchya.acceptBet(betIndex, {
      from: acceptor,
      value: web3.toWei(1, "ether")
    });
  };

  const updateAndGetPrice = async () => {
    const priceWatcher = promisifyLogEvent(
      ethPriceJudge.LogPriceUpdate({ fromBlock: "latest" })
    );

    await ethPriceJudge.updatePrice({ from: proposer });

    return priceWatcher.then(e => e.args.currentPrice.toNumber());
  };

  describe("updatePrice", async () => {
    it("should update price & updatedAt", async () => {
      const priceWatcher = promisifyLogEvent(
        ethPriceJudge.LogPriceUpdate({ fromBlock: "latest" })
      );
      await ethPriceJudge.updatePrice({ from: proposer });
      const eventPrice = await priceWatcher.then(e =>
        e.args.currentPrice.toNumber()
      );

      const currentPrice = await ethPriceJudge.currentPrice
        .call()
        .then(e => e.toNumber());
      const updatedAt = await ethPriceJudge.updatedAt
        .call()
        .then(u => u.toNumber());
      assert.isTrue(currentPrice > 0, "price is more than 0");
      assert.isTrue(updatedAt > 0, "updatedAt is more than 0");
      assert.equal(
        eventPrice,
        currentPrice,
        "Same price in event as in contract"
      );
    });
  });

  describe("confirmJudge", () => {
    it("it should confirm judge when starting bet", async () => {
      await createConfirmedBet(10);
      const judgeConfirmedWatcher = betchya.BetJudgeConfirmed();
      await ethPriceJudge.confirmJudge(betIndex);
      const events = judgeConfirmedWatcher.get();
      assert.equal(events.length, 1, "1 Judge confirmed event");
      const args = events[0].args;
      assert.equal(args.betsIndex.toNumber(), 0, "Correct betsIndex");
    });
  });

  describe("judge", () => {
    it("should judge proposer as winner if current price is higher than judge price", async () => {
      // Setup bet for judging
      await createConfirmedBet(10);
      await ethPriceJudge.confirmJudge(betIndex);
      await updateAndGetPrice();

      const betSettledWatcher = betchya.BetSettled();
      await ethPriceJudge.judge(betIndex);

      const events = betSettledWatcher.get();
      assert.equal(events.length, 1, "1 BetSettled event");
      const args = events[0].args;
      assert.equal(args.betsIndex.toNumber(), 0, "Correct betsIndex");
      assert.equal(
        toResult(args.result),
        "ProposerWon",
        "Proposer won bet result"
      );
    });

    it("should judge acceptor as winner if current price is lower than judge price", async () => {
      // Setup bet for judging
      await createConfirmedBet(1000);
      await ethPriceJudge.confirmJudge(betIndex);
      await updateAndGetPrice();

      const betSettledWatcher = betchya.BetSettled();
      await ethPriceJudge.judge(betIndex);

      const events = betSettledWatcher.get();
      assert.equal(events.length, 1, "1 BetSettled event");
      const args = events[0].args;
      assert.equal(args.betsIndex.toNumber(), 0, "Correct betsIndex");
      assert.equal(
        toResult(args.result),
        "AcceptorWon",
        "Acceptor won bet result"
      );
    });
  });
});
