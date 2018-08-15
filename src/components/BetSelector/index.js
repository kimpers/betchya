import React from "react";
import R from "ramda";
import { withRouter } from "react-router-dom";
import { Dropdown } from "semantic-ui-react";

const BetSelector = ({ participations, history }) => {
  if (!participations || !participations.length) {
    return null;
  }

  const options = [
    // Add an option for navigating back to home.
    {
      text: "Home",
      value: "",
      key: "participation-home"
    },
    // Need to filter ut duplicates if user has multiple roles in a single bet
    ...R.uniqBy(p => p.betsIndex, participations).map((participation, i) => ({
      text: `${participation.description} (${participation.role}) `,
      value: participation.betsIndex.toString(),
      key: `participation-${i}`
    }))
  ];

  return (
    <div
      style={{
        alignSelf: "flex-start"
      }}
    >
      <Dropdown
        button
        item
        placeholder="Current bets"
        options={options}
        onChange={(_, { value }) => history.push(`/${value}`)}
      />
    </div>
  );
};

export default withRouter(BetSelector);
