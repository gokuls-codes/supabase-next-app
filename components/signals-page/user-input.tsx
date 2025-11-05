"use client";

import React from "react";
import { Input } from "../ui/input";
import { useSignals } from "@preact/signals-react/runtime";
import { changeName, userName } from "./username-signal";

const UserInput = () => {
  useSignals();

  return (
    <div>
      <Input
        placeholder="Name"
        value={userName.value}
        onChange={(e) => changeName(e.target.value)}
      />
    </div>
  );
};

export default UserInput;
