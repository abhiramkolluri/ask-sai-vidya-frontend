import React from "react";
import logo from "../../logo.png";

export default function Logo() {
  return (
    <div className="mb-4">
      <img src={logo} alt="logo" width={200} height={42} />
    </div>
  );
}
