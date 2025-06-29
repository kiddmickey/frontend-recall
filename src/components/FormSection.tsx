import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  required?: boolean;
  error?: string;
}

const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  children, 
  icon, 
  required = false,
  error
}) => {
  return (
    <div className="space-y-2 animate-fadeIn">
      <div className="flex items-center gap-2">
        {icon}
        <label className="text-gray-700 font-medium">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <div>{children}</div>
      {error && (
        <p className="text-red-500 text-sm mt-1 animate-fadeIn">{error}</p>
      )}
    </div>
  );
};

export default FormSection;