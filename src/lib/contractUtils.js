export const stages = ["Created", "Accepted", "InProgress", "Settled"];
export const toStage = num => stages[num];
export const results = ["NotSettled", "ProposerWon", "AcceptorWon", "Draw"];
export const toResult = num => results[num];
export const resultNameToValue = name => results.indexOf(name);

export const toBetObject = ([
  proposer,
  acceptor,
  judge,
  amount,
  stage,
  result
]) => ({
  proposer,
  acceptor,
  judge,
  amount: amount.toString(),
  stage: toStage(stage),
  result: toResult(result)
});
