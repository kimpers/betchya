/* global assert, artifacts, contract, web3 */
const EthPriceJudge = artifacts.require("./EthPriceJudge.sol");

import {
  RESULT_PROPOSER_WON,
  RESULT_ACCEPTOR_WON,
  resultNameToValue
} from "../src/lib/contractUtils";
import { promisifyLogEvent } from "./util";

const sleep = time => new Promise(resolve => setTimeout(resolve, time));
contract("EthPriceJudge", accounts => {
  // New contract for every test to avoid lingering state
  let ethPriceJudge;
  beforeEach(async () => {
    ethPriceJudge = await EthPriceJudge.new();
  });

  const [_, proposer] = accounts;

  describe("updatePrice", async () => {
    it("should update price & updatedAt", async () => {
      const priceWatcher = promisifyLogEvent(
        ethPriceJudge.PriceUpdate({ fromBlock: "latest" })
      );
      await ethPriceJudge.updatePrice({ from: proposer });
      const eventPrice = await priceWatcher.then(e =>
        e.args.currentPrice.toNumber()
      );

      assert.isTrue(eventPrice > 0, "Emits event with price");

      const currentPrice = await ethPriceJudge.currentPrice
        .call()
        .then(e => e.toNumber());
      const updatedAt = await ethPriceJudge.updatedAt
        .call()
        .then(u => u.toNumber());
      assert.isTrue(currentPrice > 0, "price is more than 0");
      assert.isTrue(updatedAt > 0, "updatedAt is more than 0");
      assert.equal(
        currentPrice,
        eventPrice,
        "Emitted price is same as in contract"
      );
    });

    it("should judge true if current price is higher than initial price", async () => {
      const priceWatcher = promisifyLogEvent(
        ethPriceJudge.PriceUpdate({ fromBlock: "latest" })
      );
      await ethPriceJudge.updatePrice({ from: proposer });
      await priceWatcher; // Wait for oraclize to return new price

      const currentPrice = await ethPriceJudge.currentPrice
        .call()
        .then(e => e.toNumber());

      const judgeWatcher = promisifyLogEvent(
        ethPriceJudge.JudgeResult({ fromBlock: "latest" })
      );

      await ethPriceJudge.judge(0, (currentPrice + 10).toString(), {
        from: proposer
      });

      const judgeResult = await judgeWatcher.then(e => e.args);

      assert.isFalse(judgeResult.result, "judge true on higher price");
      assert.equal(judgeResult.betsIndex.toNumber(), 0, "correct betsIndex");
    });

    it("should judge false if current price is lower than initial price", async () => {
      const priceWatcher = promisifyLogEvent(
        ethPriceJudge.PriceUpdate({ fromBlock: "latest" })
      );

      await ethPriceJudge.updatePrice({ from: proposer });
      await priceWatcher; // Wait for oraclize to return new price

      const currentPrice = await ethPriceJudge.currentPrice
        .call()
        .then(e => e.toNumber());

      const judgeWatcher = promisifyLogEvent(
        ethPriceJudge.JudgeResult({ fromBlock: "latest" })
      );

      await ethPriceJudge.judge(0, (currentPrice - 10).toString(), {
        from: proposer
      });
      const judgeResult = await judgeWatcher.then(e => e.args);

      assert.isTrue(judgeResult.result, "judge false on lower price");
      assert.equal(judgeResult.betsIndex.toNumber(), 0, "correct betsIndex");
    });
  });
});
