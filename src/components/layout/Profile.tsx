"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useClerk, UserAvatar } from "@clerk/nextjs";
import { useUser } from "@/context/UserContext";
import { Icon } from "@/components/ui/Icon";

export default function Profile() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { currentUser, memberships, isAdmin } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const displayName =
    [currentUser.profile.firstName, currentUser.profile.lastName]
      .filter(Boolean)
      .join(" ") ||
    currentUser.profile.email ||
    "User";

  const handleSignOut = async () => {
    setOpen(false);
    await signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full overflow-hidden hover:opacity-90 transition-opacity"
      >
        <UserAvatar
          rounded
          appearance={{
            elements: {
              avatarBox: "w-full h-full",
            },
          }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser.profile.email}
            </p>
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon icon="user" className="w-4 h-4 text-gray-400" />
            My Profile
          </Link>

          {isAdmin && (
            <Link
              href="/organisation-settings"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="sliders" className="w-4 h-4 text-gray-400" />
              Organisation Settings
            </Link>
          )}

          {memberships && memberships.length > 1 && (
            <Link
              href="/select-organisation"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="building" className="w-4 h-4 text-gray-400" />
              Switch Organisation
            </Link>
          )}

          <div className="border-t border-gray-100 mx-3 my-1" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon icon="signOut" className="w-4 h-4 text-gray-400" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
