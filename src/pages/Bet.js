import React from "react";
import { withRouter } from "react-router-dom";

const Bet = ({
  match: {
    params: { id }
  }
}) => <h1>{id}</h1>;

export default withRouter(Bet);
