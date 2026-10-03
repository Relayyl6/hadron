"use client"

import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../shared/utils/axiosInstance";

const UserContext = createContext<UserContextValue | null>(null);

const fetchUserData = async (): Promise<User | null> => {
    try {
        const response = await axiosInstance.get(
            "/api/users/auth/get_logged_in_user"
        );
        return response.data.user;
    } catch (error: any) {
        // Suppress all errors (including 500s or network failures when backend is down)
        // so the UI always elegantly falls back to the "Log in" button.
        return null;
    }
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