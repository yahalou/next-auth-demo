"use client";
import { logout } from "@/actions/logout";
import { useRouter } from "next/navigation";

export const LogoutButton = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  function onClick() {
    logout();
  }
  return (
    <span onClick={onClick} className="w-full cursor-pointer flex items-center">
      {children}
    </span>
  );
};
