import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/asv-logo.png";

export default function Logo() {
  return (
    <div className="mb-4">
      <Link to="/welcome">
        <img
          src={logo}
          alt="logo"
          className="w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] h-auto"
          // width={200}
          // height={42}
        />
      </Link>
    </div>
  );
}
