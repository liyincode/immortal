"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ImmortalChainDisplay } from "~~/components/ImmortalBlockChainDisplay";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

/**
 * Site header
 */
export const Header = () => {
  return (
    <div className="sticky lg:static top-0 flex items-center bg-gradient-to-r from-purple-900/80 via-pink-900/80 to-cyan-900/80 backdrop-blur-md min-h-16 shrink-0 z-20 shadow-lg shadow-purple-500/20 px-2 sm:px-4 border-b border-cyan-400/30">
      {/* 左侧：标题 - 固定宽度 */}
      <div className="w-48 flex-shrink-0">
        <Link href="/" passHref className="flex items-center gap-2">
          <div className="flex relative w-8 h-8 sm:w-10 sm:h-10">
            <Image alt="Immortal logo" className="cursor-pointer" fill src="/logo.svg" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight text-white text-lg">Immortal</span>
            <span className="text-xs text-cyan-300 hidden sm:block">知识答题擂台</span>
          </div>
        </Link>
      </div>

      {/* 中间：不朽链  */}
      <div className="flex-1 mx-4 overflow-hidden">
        <ImmortalChainDisplay />
      </div>

      {/* 右侧：钱包连接 - 固定宽度 */}
      <div className="w-64 flex-shrink-0 flex justify-end">
        <div className="flex items-center gap-2">
          <RainbowKitCustomConnectButton />
        </div>
      </div>
    </div>
  );
};
