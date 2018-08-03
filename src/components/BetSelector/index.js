import React from "react";
import { Dropdown } from "semantic-ui-react";

const BetSelector = ({ participations }) => {
  if (!participations || !participations.length) {
    return null;
  }

  const options = participations.map((participation, i) => ({
    text: `${participation.description} (${participation.role}) `,
    value: participation.betIndex,
    key: `participation-${i}`
  }));

  return (
    <div
      style={{
        alignSelf: "flex-start"
      }}
    >
      <Dropdown button item placeholder="Current bets" options={options} />
    </div>
  );
};

export default BetSelector;
