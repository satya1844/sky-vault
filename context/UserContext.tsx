"use client";
import { createContext, useContext } from "react";

type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
  username?: string | null;
  emailAddress?: string;
};

export const UserContext = createContext<User | null>(null);
export const useUserContext = () => useContext(UserContext);
