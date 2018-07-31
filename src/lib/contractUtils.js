export const stages = ["Created", "Accepted", "InProgress", "Settled"];
export const toStage = num => stages[num];
export const results = ["NotSettled", "ProposerWon", "AcceptorWon", "Draw"];
export const toResult = num => results[num];
export const resultNameToValue = name => results.indexOf(name);
export const participationTypes = ["Proposer", "Acceptor", "Judge"];
export const toParticipationType = num => participationTypes[num];
export const toBetParticipation = ([betIndex, participationType]) => ({
  betIndex: parseInt(betIndex, 10),
  participationType: toParticipationType(participationType)
});

export const toBetObject = ([
  proposer,
  acceptor,
  judge,
  amount,
  description,
  stage,
  result
]) => ({
  proposer,
  acceptor,
  judge,
  amount: amount.toString(),
  description,
  stage: toStage(stage),
  result: toResult(result)
});
