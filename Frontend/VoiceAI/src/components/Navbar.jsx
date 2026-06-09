import React from "react";
import { useState } from "react";
import axios from "axios";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ServerUrl } from "../App";


function Navbar({ user, setuser }) {
  const navigate = useNavigate();
  const currentUser = user?.user ?? user;
  const [menuopen, setmenuopen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(
        ServerUrl + "/api/auth/logout",
        {},
        { withCredentials: true }
      );
      toast.success("Logged out successfully");
    } catch (error) {
        toast.error("Logout failed");
      console.log(error);
    } finally {
      setuser(null);
      navigate("/login");
    }
  };

    return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/20 bg-slate-950/80 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400 to-transparent opacity-70" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group flex items-center gap-3 rounded-full border border-cyan-400/20 bg-white/5 px-3 py-2 text-left transition hover:border-cyan-300/40 hover:bg-white/10"
        >
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-[linear-gradient(145deg,rgba(8,15,29,0.96),rgba(15,23,42,0.88))] shadow-[0_0_24px_rgba(34,211,238,0.28)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.32),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(232,121,249,0.22),transparent_40%)]" />
            <svg
              viewBox="0 0 40 40"
              className="relative h-7 w-7 text-cyan-200 drop-shadow-[0_0_10px_rgba(103,232,249,0.45)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M10.5 29.5V10.5L20.5 20.5L30.5 10.5V29.5"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 12H27"
                stroke="rgba(232,121,249,0.8)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">Voice AI</span>
              {/* <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Neon
              </span> */}
            </div>
            <p className="text-xs text-slate-400">AI voice workspace</p>
          </div>
        </button>

        {currentUser ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/builder")}
              className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/15 hover:text-cyan-100"
            >
              Builder
            </button>

            <button
              type="button"
              onClick={() => navigate("/billing")}
              className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-4 py-2 text-sm font-semibold text-fuchsia-200 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-400/15 hover:text-fuchsia-100"
            >
              Billing
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-400/15 hover:text-rose-100"
            >
              <FiLogOut className="text-base" />
              Logout
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 shadow-[0_0_24px_rgba(34,211,238,0.08)] md:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
              <div className="leading-tight">
                <p className="font-semibold text-white">{currentUser?.name || "User"}</p>
                <p className="text-xs text-slate-400">{currentUser?.email || "No email available"}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* {user && (
         <button className="md:hidden text-gray-600 " onClick={() => setmenuopen(!menuopen)}>
           <FiMenu className="text-xl" />
         </button>
      )} */}
    </header>
  );
}

export default Navbar;
