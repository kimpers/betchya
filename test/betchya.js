/* global assert, artifacts, contract */
const Betchya = artifacts.require("./Betchya.sol");

const stages = ["Created", "Accepted", "InProgress", "Completed "];
const toStage = num => stages[num];

const toBetObject = ([proposer, acceptor, judge, amount, stage]) => ({
  proposer,
  acceptor,
  judge,
  amount: amount.toString(),
  stage: toStage(stage)
});

const assertFailed = async promise => {
  try {
    await promise();
  } catch (e) {
    return;
  }

  assert(false, "Did not fail as expected");
};
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

  it("should accept accept a bet if the acceptor calls with valid params", async () => {
    const betchya = await Betchya.deployed();
    const betAcceptedWatcher = betchya.BetAccepted();

    await betchya.createBet(acceptor, judge, {
      from: proposer,
      value: 1
    });

    const betIndex = 0; // First bet will get index 0 in the array

    await betchya.acceptBet(betIndex, { from: acceptor, value: 1 });

    const events = await betAcceptedWatcher.get();
    assert.equal(events.length, 1, "1 BetAccepted event emitted");
    assert.equal(
      events[0].args.betsIndex,
      betIndex,
      "Bet index is unchanged after acceptance"
    );

    const bet = await betchya.bets.call(betIndex).then(toBetObject);
    assert.equal(bet.stage, "Accepted");
  });

  it("it should fail to accept if caller is not acceptor", async () => {
    const betchya = await Betchya.deployed();

    betchya.createBet(acceptor, judge, {
      from: proposer,
      value: 1
    });

    const betIndex = 0; // First bet will get index 0 in the array

    const notAcceptor = accounts[3];
    await assertFailed(
      betchya.acceptBet(betIndex, { from: notAcceptor, value: 1 })
    );
  });

  it("it should fail to accept if acceptor does not send the same amount as proposer ", async () => {
    const betchya = await Betchya.deployed();

    betchya.createBet(acceptor, judge, {
      from: proposer,
      value: 1
    });

    const betIndex = 0; // First bet will get index 0 in the array

    await assertFailed(
      betchya.acceptBet(betIndex, { from: acceptor, value: 2 })
    );
    await assertFailed(
      betchya.acceptBet(betIndex, { from: acceptor, value: 2 })
    );
  });
});
