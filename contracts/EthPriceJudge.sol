pragma solidity ^0.4.24;

import "oraclize-api/contracts/usingOraclize.sol";

interface Judge {
    function judge(uint256 betsIndex, string data) public returns (bool);
}

/** @title EthPriceJudge */
contract EthPriceJudge is usingOraclize, Judge {
  uint256 public currentPrice;
  uint256 public updatedAt;

  constructor() {
      // Temp development address
      OAR = OraclizeAddrResolverI(0xe1008A1a6F2dD5aEe09A06B51282Ed417a74890d);



  }

  /**
  * @dev Event with new Ether - USD price
  * @param currentPrice price of ether in USD
  */
  event PriceUpdate(
    uint256 currentPrice
  );

  /**
  * @dev Event with the result from the judge
  * @param betsIndex index of bet in bets array
  * @param result boolean true if current price is higher than the comparison price
  */
  event JudgeResult(
    uint256 indexed betsIndex,
    bool result
  );

  /**
  * @dev initiates oraclize call for updating currentPrice with data from GDAX ETH - USD pricing
  */
  function updatePrice() {
    oraclize_query("URL", "json(https://api.gdax.com/products/ETH-USD/ticker).price");
  }

  /**
  * @dev internal callback that Oraclize calls to asynchronously return results with pricing data
  */
  function __callback(bytes32 myid, string result) {
     if (msg.sender != oraclize_cbAddress()) revert();

     currentPrice = parseInt(result);
     updatedAt = now;
     emit PriceUpdate(currentPrice);
 }

  /**
  * @dev returns true if currentPrice is higher than comparison price
  */
  function judge(uint256 betsIndex, string data)
    public
    returns (bool)
  {
    // Only allow 10 minutes old results
    require(now - 600 <= updatedAt);

    uint256 judgePrice = parseInt(data);
    bool result = currentPrice > judgePrice;

    emit JudgeResult(betsIndex, result);

    return result;
  }

}
