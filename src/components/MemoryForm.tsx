import React, { useState, useRef } from 'react';
import { Camera, MapPin, Calendar, Mic, Upload, X, Check, Users, Heart, ArrowLeft } from 'lucide-react';
import FormSection from './FormSection';
import { useFormContext } from '../context/FormContext';
import { StorageService } from '../services/storageService';

interface MemoryFormProps {
  patientId?: string;
  onComplete?: () => void;
  onBack?: () => void;
}

const MemoryForm: React.FC<MemoryFormProps> = ({ patientId, onComplete, onBack }) => {
  const { 
    formData, 
    setFormData, 
    formErrors, 
    validateForm, 
    resetForm,
    isSubmitting, 
    setIsSubmitting 
  } = useFormContext();
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [peopleInvolved, setPeopleInvolved] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [emotionalContext, setEmotionalContext] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setFormData({
          ...formData,
          photo_url: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = () => {
    setPhotoPreview(null);
    setFormData({
      ...formData,
      photo_url: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addPerson = () => {
    if (newPerson.trim() && !peopleInvolved.includes(newPerson.trim())) {
      setPeopleInvolved([...peopleInvolved, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removePerson = (person: string) => {
    setPeopleInvolved(peopleInvolved.filter(p => p !== person));
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    setTimeout(() => {
      clearInterval(interval);
      stopRecording();
    }, 60000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingComplete(true);
    
    const simulatedAudio = new File(["audio data"], "recording.mp3", { type: "audio/mp3" });
    
    setFormData({
      ...formData,
      audio_url: simulatedAudio
    });
  };

  const removeRecording = () => {
    setRecordingComplete(false);
    setRecordingTime(0);
    setFormData({
      ...formData,
      audio_url: null
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = validateForm();
    
    if (isValid) {
      setIsSubmitting(true);
      
      try {
        const memoryData = {
          patient_id: patientId,
          photo_url: formData.photo_url,
          audio_url: formData.audio_url,
          date_taken: formData.date_taken,
          location: formData.location,
          caption: formData.caption,
          people_involved: peopleInvolved,
          emotional_context: emotionalContext,
          created_at: new Date().toISOString()
        };
        
        await StorageService.saveMemoryCard(memoryData);
        setSubmitSuccess(true);
        
        setTimeout(() => {
          resetForm();
          setPhotoPreview(null);
          setRecordingComplete(false);
          setPeopleInvolved([]);
          setEmotionalContext('');
          setSubmitSuccess(false);
          onComplete?.();
        }, 3000);
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to save memory. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8 transition-all duration-300 animate-fadeIn">
      {/* Back Button */}
      {onBack && (
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Share a Memory</h2>
      
      {submitSuccess ? (
        <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="text-green-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Memory Submitted!</h3>
          <p className="text-gray-600 text-center">
            Thank you for sharing your memory. It has been successfully saved.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <FormSection
            title="Photo"
            icon={<Camera className="w-5 h-5 text-blue-600" />}
            required
            error={formErrors.photo_url}
          >
            {!photoPreview ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handlePhotoChange} 
                  className="hidden" 
                  name="photo_url"
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to upload a photo</p>
                <p className="text-gray-400 text-sm">JPG, PNG or GIF (max. 5MB)</p>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full rounded-lg object-cover max-h-80" 
                />
                <button 
                  type="button"
                  onClick={handlePhotoRemove}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </FormSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSection
              title="Date Taken"
              icon={<Calendar className="w-5 h-5 text-blue-600" />}
              required
              error={formErrors.date_taken}
            >
              <input 
                type="date" 
                name="date_taken"
                value={formData.date_taken || ''}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </FormSection>
            
            <FormSection
              title="Location"
              icon={<MapPin className="w-5 h-5 text-blue-600" />}
              error={formErrors.location}
            >
              <input 
                type="text" 
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                placeholder="Where was this photo taken?"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </FormSection>
          </div>

          <FormSection
            title="People Involved"
            icon={<Users className="w-5 h-5 text-blue-600" />}
          >
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Add person's name"
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addPerson}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {peopleInvolved.map((person, index) => (
                  <div key={index} className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-sm">{person}</span>
                    <button
                      type="button"
                      onClick={() => removePerson(person)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Emotional Context"
            icon={<Heart className="w-5 h-5 text-blue-600" />}
          >
            <select
              value={emotionalContext}
              onChange={(e) => setEmotionalContext(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select the mood of this memory</option>
              <option value="joyful">Joyful & Happy</option>
              <option value="peaceful">Peaceful & Calm</option>
              <option value="celebratory">Celebratory & Festive</option>
              <option value="nostalgic">Nostalgic & Reflective</option>
              <option value="loving">Loving & Tender</option>
              <option value="proud">Proud & Accomplished</option>
              <option value="adventurous">Adventurous & Exciting</option>
              <option value="cozy">Cozy & Intimate</option>
            </select>
          </FormSection>
          
          <FormSection
            title="Voice Recording (Optional)"
            icon={<Mic className="w-5 h-5 text-blue-600" />}
            error={formErrors.audio_url}
          >
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              {recordingComplete ? (
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mic className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Recording</p>
                      <p className="text-xs text-gray-500">{formatTime(recordingTime)}</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={removeRecording}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={toggleRecording}
                  className={`flex-1 flex items-center gap-2 justify-center p-2 rounded-md text-white transition-colors ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  {isRecording ? (
                    <span>Recording... {formatTime(recordingTime)}</span>
                  ) : (
                    <span>Start Recording</span>
                  )}
                </button>
              )}
            </div>
          </FormSection>
          
          <FormSection
            title="Caption"
            error={formErrors.caption}
          >
            <textarea 
              name="caption"
              value={formData.caption || ''}
              onChange={handleInputChange}
              placeholder="Share the story behind this memory..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </FormSection>
          
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => onComplete?.()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Memory'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MemoryForm;