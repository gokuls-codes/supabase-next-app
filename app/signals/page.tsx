import Header from "@/components/signals-page/header";
import UserInput from "@/components/signals-page/user-input";
import React from "react";

const SignalsPage = () => {
  return (
    <div className=" w-80 mx-auto flex items-center justify-center gap-4 flex-col h-screen">
      <Header />
      <UserInput />
    </div>
  );
};

export default SignalsPage;
