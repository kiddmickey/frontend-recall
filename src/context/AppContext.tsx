import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';

interface AppContextType {
  currentPatient: any | null;
  setCurrentPatient: (patient: any | null) => void;
  memoryCards: any[];
  setMemoryCards: React.Dispatch<React.SetStateAction<any[]>>;
  patientProfiles: any[];
  setPatientProfiles: React.Dispatch<React.SetStateAction<any[]>>;
  sessions: any[];
  setSessions: React.Dispatch<React.SetStateAction<any[]>>;
  transcripts: any[];
  setTranscripts: React.Dispatch<React.SetStateAction<any[]>>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPatient, setCurrentPatient] = useState<any | null>(null);
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [patientProfiles, setPatientProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all patient profiles
      const profiles = await StorageService.getPatientProfiles();
      setPatientProfiles(profiles);

      // If there's a current patient, load their specific data
      if (currentPatient) {
        const [memories, patientSessions, patientTranscripts] = await Promise.all([
          StorageService.getMemoryCardsByPatient(currentPatient.id),
          StorageService.getSessionsByPatient(currentPatient.id),
          StorageService.getTranscriptsByPatient(currentPatient.id)
        ]);
        
        setMemoryCards(memories);
        setSessions(patientSessions);
        setTranscripts(patientTranscripts);
      } else {
        setMemoryCards([]);
        setSessions([]);
        setTranscripts([]);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh patient-specific data when current patient changes
  useEffect(() => {
    if (currentPatient) {
      const loadPatientData = async () => {
        try {
          setIsLoading(true);
          const [memories, patientSessions, patientTranscripts] = await Promise.all([
            StorageService.getMemoryCardsByPatient(currentPatient.id),
            StorageService.getSessionsByPatient(currentPatient.id),
            StorageService.getTranscriptsByPatient(currentPatient.id)
          ]);
          
          setMemoryCards(memories);
          setSessions(patientSessions);
          setTranscripts(patientTranscripts);
        } catch (err) {
          console.error('Error loading patient data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load patient data');
        } finally {
          setIsLoading(false);
        }
      };

      loadPatientData();
    }
  }, [currentPatient]);

  return (
    <AppContext.Provider value={{
      currentPatient,
      setCurrentPatient,
      memoryCards,
      setMemoryCards,
      patientProfiles,
      setPatientProfiles,
      sessions,
      setSessions,
      transcripts,
      setTranscripts,
      refreshData,
      isLoading,
      error
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};