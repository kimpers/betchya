import React, { Component } from "react";
import { Input } from "semantic-ui-react";
import styled from "styled-components";

const FormInput = styled(Input)`
  margin-bottom: 1em;
`;

const BetForm = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      maxWidth: "600px"
    }}
  >
    <FormInput label="ETH address of the challenged" placeholder="0x123456" />
    <FormInput label="ETH address of the judge" placeholder="0x123456" />

    <FormInput
      action={{
        color: "teal",
        labelPosition: "left",
        icon: "ethereum",
        content: "Make bet"
      }}
      label="Amount to bet (in ether)"
      placeholder="0.1"
    />
  </div>
);

export default BetForm;
