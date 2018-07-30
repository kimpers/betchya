import React, { Fragment } from "react";
import { Dropdown } from "semantic-ui-react";

const BetSelector = ({ participations }) => {
  if (!participations || !participations.length) {
    return null;
  }

  const options = participations.map(participation => ({
    text: `[ ${participation.role}] ${participation.betsIndex} - ${
      participation.result
    }`,
    value: participation.betIndex
  }));

  return (
    <div
      style={{
        alignSelf: "flex-end",
        marginRight: "20px"
      }}
    >
      <Dropdown button item placeholder="Current bets" options={options} />
    </div>
  );
};

export default BetSelector;
