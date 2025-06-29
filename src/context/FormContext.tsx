import React, { createContext, useContext, useState } from 'react';

interface FormData {
  photo_url: File | null;
  audio_url: File | null;
  date_taken: string | null;
  location: string | null;
  caption: string | null;
}

interface FormErrors {
  photo_url?: string;
  audio_url?: string;
  date_taken?: string;
  location?: string;
  caption?: string;
}

interface FormContextType {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  formErrors: FormErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  validateForm: () => boolean;
  resetForm: () => void;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

const initialFormData: FormData = {
  photo_url: null,
  audio_url: null,
  date_taken: null,
  location: null,
  caption: null
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errors: FormErrors = {};
    let isValid = true;

    // Required field validation
    if (!formData.photo_url) {
      errors.photo_url = 'A photo is required';
      isValid = false;
    }

    if (!formData.date_taken) {
      errors.date_taken = 'Date is required';
      isValid = false;
    }

    // Set any validation errors
    setFormErrors(errors);

    return isValid;
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
  };

  return (
    <FormContext.Provider value={{
      formData,
      setFormData,
      formErrors,
      setFormErrors,
      validateForm,
      resetForm,
      isSubmitting,
      setIsSubmitting
    }}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};