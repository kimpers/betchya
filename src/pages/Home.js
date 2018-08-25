import React from "react";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import styled from "styled-components";
import { Header, Message } from "semantic-ui-react";

import Bet from "../components/Bet";
import BetForm from "../components/BetForm";
import BetSelector from "../components/BetSelector";

const AppWrapper = styled.div`
  height: 100%;
  width: 100%;
  background: #a1d2ce;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

const AppHeader = styled(Header)`
  display: inline-block;
  color: rgba(0, 0, 0, 0.6) !important;
`;

const MenuRow = styled.div`
  width: 100%;
  max-width: 620px;
  margin-bottom: 1em;
`;

const FullWidthMessage = styled(Message)`
  width: 100%;
  position: absolute !important;
`;

const Home = ({ message, participations, betchyaContract, onDismiss }) => (
  <Router>
    <AppWrapper>
      {message && (
        <FullWidthMessage positive header="Success" onDismiss={onDismiss}>
          {message}
        </FullWidthMessage>
      )}

      <ContentWrapper>
        <AppHeader size="huge">Betchya.eth - challenge your friends!</AppHeader>
        <MenuRow>
          <BetSelector participations={participations} />
        </MenuRow>
        <Switch>
          <div
            style={{
              width: "100%",
              maxWidth: "620px"
            }}
          >
            <Route
              path="/:id"
              component={() => <Bet betchyaContract={betchyaContract} />}
            />
            <Route
              exact
              path="/"
              component={() => <BetForm betchyaContract={betchyaContract} />}
            />
            <Route
              path="/ipfs/:ipfsHash/:id"
              component={() => <Bet betchyaContract={betchyaContract} />}
            />
            <Route
              exact
              path="/ipfs/:ipfsHash/"
              component={() => <BetForm betchyaContract={betchyaContract} />}
            />
          </div>
        </Switch>
      </ContentWrapper>
    </AppWrapper>
  </Router>
);

export default Home;
