import React from "react";
import { data, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Builder from "./pages/Builder";
import Billing from "./pages/Billing";
import { Toaster } from "react-hot-toast";

export const ServerUrl = "http://localhost:5000";

function APP() {
  const [user, setuser] = useState(null);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const fetchme = async () => {
      try {
        const response = await axios.get(ServerUrl + "/api/user/current-user", {
          withCredentials: true,
        });
        setuser(response.data);
        setloading(false);
      } catch (error) {
        console.log(error);
        setloading(false);
      }
    };
    fetchme();
  }, []);

  return (
    <>
     <Toaster position="top-right"/>
      <Routes>
        <Route path="/login" element={<Login setuser={setuser} />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Navbar setuser={setuser} user={user}/>
              <Routes>
                <Route path="/" element={<Home user={user} />} />
                <Route path="/builder" element={<Builder user={user}  setuser={setuser}/>} />
                <Route path="/billing" element={<Billing user={user} />} />
                <Route path = "*" element={<Navigate to="/" replace/>}/>
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default APP;
