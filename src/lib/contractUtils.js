export const STAGE_CREATED = "Created";
export const STAGE_ACCEPTED = "Accepted";
export const STAGE_IN_PROGRESS = "InProgress";
export const STAGE_SETTLED = "Settled";
export const STAGE_CANCELLED = "Cancelled";
export const stages = [
  STAGE_CREATED,
  STAGE_ACCEPTED,
  STAGE_IN_PROGRESS,
  STAGE_SETTLED,
  STAGE_CANCELLED
];
export const RESULT_NOT_SETTLED = "NotSettled";
export const RESULT_PROPOSER_WON = "ProposerWon";
export const RESULT_ACCEPTOR_WON = "AcceptorWon";
export const RESULT_DRAW = "Draw";
export const toStage = num => stages[num];
export const results = [
  RESULT_NOT_SETTLED,
  RESULT_PROPOSER_WON,
  RESULT_ACCEPTOR_WON,
  RESULT_DRAW
];
export const toResult = num => results[num];
export const resultNameToValue = name => results.indexOf(name);
export const participationTypes = ["Proposer", "Acceptor", "Judge"];

export const toBetObject = ([
  proposer,
  acceptor,
  judge,
  amount,
  stage,
  result,
  proposerWithdrawn,
  acceptorWithdrawn
]) => ({
  proposer,
  acceptor,
  judge,
  amount: amount.toString(),
  stage: toStage(stage),
  result: toResult(result),
  proposerWithdrawn,
  acceptorWithdrawn
});
