"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "@/services/api";

interface LearnerContextType {
  learnerId: string;
  setLearnerId: (id: string) => void;
  examModeActive: boolean;
  setExamModeActive: (active: boolean) => void;
  refreshExamStatus: () => Promise<void>;
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined);

export function LearnerProvider({ children }: { children: React.ReactNode }) {
  const [learnerId, setLearnerIdState] = useState<string>("student_1");
  const [examModeActive, setExamModeActive] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("pathgen_learner_id");
    if (saved) {
      setLearnerIdState(saved);
    }
  }, []);

  const setLearnerId = (id: string) => {
    setLearnerIdState(id);
    localStorage.setItem("pathgen_learner_id", id);
  };

  const refreshExamStatus = async () => {
    try {
      const data = await apiService.getExamRoadmap(learnerId);
      setExamModeActive(data.is_active ?? true);
    } catch {
      // not configured or offline
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
        learnerId,
        setLearnerId,
        examModeActive,
        setExamModeActive,
        refreshExamStatus,
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
