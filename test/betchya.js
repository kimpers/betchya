/* global assert, artifacts, contract */
const Betchya = artifacts.require("./Betchya.sol");

contract("Betchya", accounts => {
  const [proposer, acceptor, judge] = accounts;
  it("should create a bet with valid params", async () => {
    const betchya = await Betchya.deployed();
    const betCreatedWatcher = betchya.BetCreated();

    await betchya.createBet(acceptor, judge, {
      from: proposer,
      value: 1
    });

    const events = await betCreatedWatcher.get();
    assert.equal(events.length, 1, "1 BetCreated event emitted");

    const eventArgs = events[0].args;
    assert.equal(eventArgs.betsIndex, 0, "First bet has index 0 in bet array");

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

    assert.equal(eventArgs.judge, judge, "Judge addres is correctly set");
  });
});
