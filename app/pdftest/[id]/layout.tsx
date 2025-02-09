"use client";

import { useState, useEffect } from "react";

export default function Layout({ children }: any) {
  return (
    <div className="max-h-screen w-[100vw] overflow-hidden max-w-[1920px]">
      {children}
    </div>
  );
}
