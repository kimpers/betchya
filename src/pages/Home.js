import React from "react";
import styled from "styled-components";
import { Header, Message } from "semantic-ui-react";

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

const Home = ({ message, participations, betchyaContract, onDismiss }) => (
  <AppWrapper>
    {message && (
      <Message positive header="Success" onDismiss={onDismiss}>
        {message}
      </Message>
    )}

    <ContentWrapper>
      <AppHeader size="huge">Betchya.eth - challenge your friends!</AppHeader>
      <MenuRow>
        <BetSelector participations={participations} />
      </MenuRow>
      <BetForm betchyaContract={betchyaContract} />
    </ContentWrapper>
  </AppWrapper>
);

export default Home;
