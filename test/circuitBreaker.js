/* global assert, artifacts, contract, web3 */
const CircuitBreaker = artifacts.require("./CircuitBreaker.sol");

import {
  BREAKER_STATE_STARTED,
  BREAKER_STATE_ONLY_WITHDRAWAL,
  BREAKER_STATE_STOPPED
} from "../src/lib/contractUtils";

import { assertFailed } from "./util";

contract("CircuitBreaker", accounts => {
  // New contract for every test to avoid lingering state
  let circuitBreaker;
  beforeEach(async () => {
    circuitBreaker = await CircuitBreaker.new();
  });

  const [owner, nonOwner] = accounts;

  it("is initialized in started state", async () => {
    const state = await circuitBreaker.state.call().then(s => s.toNumber());
    assert.equal(state, BREAKER_STATE_STARTED, "Started state initially");
  });

  it("it allows the owner to limit to withdrawals", async () => {
    await circuitBreaker.onlyWithdrawal({ from: owner });
    const state = await circuitBreaker.state.call().then(s => s.toNumber());
    assert.equal(
      state,
      BREAKER_STATE_ONLY_WITHDRAWAL,
      "Only withdrawal state after calling onlyWithdrawal"
    );
  });

  it("it allows the owner to stop the contract", async () => {
    await circuitBreaker.stopContract({ from: owner });

    const state = await circuitBreaker.state.call().then(s => s.toNumber());
    assert.equal(
      state,
      BREAKER_STATE_STOPPED,
      "Stopped state after calling stopContract"
    );
  });

  it("it allows the owner to start the contract", async () => {
    await circuitBreaker.stopContract({ from: owner });
    let state = await circuitBreaker.state.call().then(s => s.toNumber());
    assert.equal(
      state,
      BREAKER_STATE_STOPPED,
      "Stopped after calling stopContract"
    );

    await circuitBreaker.startContract({ from: owner });

    state = await circuitBreaker.state.call().then(s => s.toNumber());
    assert.equal(
      state,
      BREAKER_STATE_STARTED,
      "Started after calling startContract on a stopped contract"
    );
  });

  it("it does not allow other account to allow only withdrawals in contract", async () => {
    await assertFailed(() => circuitBreaker.onlyWithdrawal({ from: nonOwner }));
  });

  it("does not allow other account to stop contract", async () => {
    await assertFailed(() => circuitBreaker.stopContract({ from: nonOwner }));
  });

  it("does not allow other account to start contract", async () => {
    await assertFailed(() => circuitBreaker.startContract({ from: nonOwner }));
  });
});
