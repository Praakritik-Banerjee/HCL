"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { apiService } from "@/services/api";

interface LearnerContextType {
  user: User | null;
  learnerId: string;
  setLearnerId: (id: string) => void;
  examModeActive: boolean;
  setExamModeActive: (active: boolean) => void;
  refreshExamStatus: () => Promise<void>;
  loginUser: (user: User) => void;
  logoutUser: () => void;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export function LearnerProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [learnerId, setLearnerIdState] = useState<string>("");
  const [examModeActive, setExamModeActive] = useState<boolean>(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("padhaimate_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setLearnerIdState(parsed.learner_id || parsed.id);
      } catch (e) {
        localStorage.removeItem("padhaimate_user");
      }
    }
  }, []);

  const loginUser = (userData: User) => {
    setUser(userData);
    setLearnerIdState(userData.learner_id || userData.id);
    localStorage.setItem("padhaimate_user", JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    setLearnerIdState("");
    localStorage.removeItem("padhaimate_user");
  };

  const setLearnerId = (id: string) => {
    setLearnerIdState(id);
    if (user) {
      const updated = { ...user, learner_id: id };
      setUser(updated);
      localStorage.setItem("padhaimate_user", JSON.stringify(updated));
    }
  };

  const refreshExamStatus = async () => {
    if (!learnerId) return;
    try {
      const data = await apiService.getExamRoadmap(learnerId);
      setExamModeActive(data.is_active ?? true);
    } catch {
      // default handling
    }
  };

  useEffect(() => {
    if (learnerId) {
      refreshExamStatus();
    }
  }, [learnerId]);

  return (
    <LearnerContext.Provider
      value={{
        user,
        learnerId,
        setLearnerId,
        examModeActive,
        setExamModeActive,
        refreshExamStatus,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </LearnerContext.Provider>
  );
}

export function useLearner() {
  const context = useContext(LearnerContext);
  if (!context) {
    throw new Error("useLearner must be used within a LearnerProvider");
  }
  return context;
}
