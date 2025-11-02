import PingDisplay from "@/components/ping-display";
import React, { Suspense } from "react";

const BuzzerPage = () => {
  return (
    <div className="">
      <Suspense fallback={<div>Loading...</div>}>
        <PingDisplay />
      </Suspense>
    </div>
  );
};

export default BuzzerPage;
