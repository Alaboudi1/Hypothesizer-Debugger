import React from "react";

const Header = (props: Props): JSX.Element => {
  return (
    <header className="App-header">
      <h2>{props.text}</h2>
    </header>
  );
};

type Props = {
  text: string;
};
export default Header;
