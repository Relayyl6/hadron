"use client"

import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../shared/utils/axiosInstance";

export interface User {
    id: string;
    name: string;
    email: string;
    role: "CUSTOMER" | "SELLER" | "ADMIN";
    following: string[];
    createdAt: string;
    updatedAt: string;
    avatar?: { id: string; url: string } | null;
    [key: string]: any;
}

export interface UserContextValue {
    user: User | null;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
    clearUser: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

const fetchUserData = async (): Promise<User> => {
    const response = await axiosInstance.get(
        "/api/users/auth/get_logged_in_user"
    );
    return response.data.user;
};

export function UserProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();

    const {
        data: user,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["user"],
        queryFn: fetchUserData,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });

    // call this on logout instead of clearing localStorage
    const clearUser = () => {
        queryClient.setQueryData(["user"], null);
        queryClient.removeQueries({ queryKey: ["user"] });
    };

    return (
        <UserContext.Provider
            value={{ user: user ?? null, isLoading, isError, refetch, clearUser }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser(): UserContextValue {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within a UserProvider");
    return ctx;
}