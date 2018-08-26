pragma solidity 0.4.24;

import "oraclize-api/contracts/usingOraclize.sol";

import "zeppelin/math/SafeMath.sol";

/**
* @dev Abstract contract containing the Betchya function definitions that EthPriceJudge needs
*/
contract TrustedBetchya {
  enum BetStages { Created, Accepted, InProgress, Settled, Cancelled }
  enum BetResults { NotSettled, ProposerWon, AcceptorWon, Draw }

  function getBetDescription(uint betsIndex) public returns (string);
  function confirmJudge(uint betsIndex) public;
  function settleBet(uint betsIndex, BetResults result) public;
}

/** @title EthPriceJudge */
contract EthPriceJudge is usingOraclize{
  using SafeMath for uint256;

  uint256 public currentPrice;
  uint256 public updatedAt;
  TrustedBetchya betchya;

  constructor(address _betchya)
    public
  {
      // Temp development address
      OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
      betchya = TrustedBetchya(_betchya);
  }

  /**
  * @dev Event with new Ether - USD price
  * @param currentPrice price of ether in USD
  */
  event LogPriceUpdate(
    uint256 currentPrice
  );

  /**
  * @dev initiates oraclize call for updating currentPrice with data from GDAX ETH - USD pricing
  */
  function updatePrice()
    public
  {
    oraclize_query("URL", "json(https://api.gdax.com/products/ETH-USD/ticker).price");
  }

  /**
  * @dev internal callback that Oraclize calls to asynchronously return results with pricing data
  */
  function __callback(bytes32, string result)
    public
  {
    require(msg.sender == oraclize_cbAddress());

     currentPrice = parseInt(result);
     updatedAt = now;

     emit LogPriceUpdate(currentPrice);
 }

  /**
  * @dev Proxies confirm judge to Betchya in order to start the bet after proposer and acceptor
  * have confirmed their participation.
  */
  function confirmJudge(uint256 betsIndex)
    public
  {
    betchya.confirmJudge(betsIndex);
  }

  /**
  * @dev Judges price now compared to price in bet description. Higher price now then proposer wins,
  * lower price then acceptor wins. This function can be called by anyone, but for this to be usable
  * then Betchya contract needs to be augmented with a contract deadline to avoid juding contract
  * too early
  */
  function judge(uint256 betsIndex)
    public
  {
    // Only allow 10 minutes old results
    require(now.sub(updatedAt) < 600);
    string memory description = betchya.getBetDescription(betsIndex);


    uint256 judgePrice = parseInt(description);

    TrustedBetchya.BetResults result = currentPrice > judgePrice ?
      TrustedBetchya.BetResults.ProposerWon :
      TrustedBetchya.BetResults.AcceptorWon;

    betchya.settleBet(betsIndex, result);
  }
}
