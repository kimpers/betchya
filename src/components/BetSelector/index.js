import React, { Fragment } from "react";
import { Dropdown } from "semantic-ui-react";

const BetSelector = ({ participations }) => {
  if (!participations || !participations.length) {
    return null;
  }

  const options = participations.map(participation => ({
    text: `[${participation.participationType}] ${participation.betIndex} - ${
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
      <Dropdown fluid placeholder="Current bets" options={options} />
    </div>
  );
};

export default BetSelector;
