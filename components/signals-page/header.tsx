"use client";

import React from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { userName } from "./username-signal";

const Header = () => {
  useSignals();
  return <div>Hello, {userName.value}</div>;
};

export default Header;
