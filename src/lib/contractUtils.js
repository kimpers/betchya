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

export const BREAKER_STATE_STARTED = 0;
export const BREAKER_STATE_ONLY_WITHDRAWAL = 1;
export const BREAKER_STATE_STOPPED = 2;

export const toResult = num => results[num];
export const resultNameToValue = name => results.indexOf(name);
export const participationTypes = ["Proposer", "Acceptor", "Judge"];

export const EVENT_BET_ACCEPTED = "LogBetAccepted";
export const EVENT_BET_JUDGE_CONFIRMED = "LogBetJudgeConfirmed";
export const EVENT_BET_SETTLED = "LogBetSettled";
export const EVENT_BET_WITHDRAWN = "LogBetWithdrawn";

export const toBetObject = ([
  proposer,
  acceptor,
  judge,
  amount,
  data,
  stage,
  result,
  proposerWithdrawn,
  acceptorWithdrawn,
  createdAt
]) => ({
  proposer,
  acceptor,
  judge,
  amount: amount.toString(),
  data,
  stage: toStage(stage),
  result: toResult(result),
  proposerWithdrawn,
  acceptorWithdrawn,
  createdAt
});
