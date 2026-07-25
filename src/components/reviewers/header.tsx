"use client";
import Link from "next/link";

interface HeaderProps {
  userData: {
    name: string;
    role?: string;
  };
}

const Header = ({ userData }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={"/"} className="flex-shrink-0">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-[#6d035c] rounded-full flex items-center justify-center text-white font-bold text-xl">D</div>
            <span className="ml-2 font-semibold text-xl text-[#6d035c]">DRID</span>
          </div>
        </Link>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-[#6b5566]">Welcome,</span>
          <span className="font-medium text-[#6d035c]">{userData.name}</span>
          {userData.role && (
            <span className="text-xs px-2 py-1 bg-[#f3e7d0] text-[#4a0340] rounded-full">
              {userData.role}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;