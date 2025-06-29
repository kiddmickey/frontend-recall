import React, { useState } from 'react';
import { User, Heart, Plus, X, Save } from 'lucide-react';
import FormSection from './FormSection';
import { StorageService } from '../services/storageService';
import { useAppContext } from '../context/AppContext';

interface PatientProfileFormProps {
  onComplete: (profile: any) => void;
  existingProfile?: any;
}

const PatientProfileForm: React.FC<PatientProfileFormProps> = ({ 
  onComplete, 
  existingProfile 
}) => {
  const { refreshData } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState({
    preferred_name: existingProfile?.preferred_name || '',
    family_relationships: existingProfile?.family_relationships || {},
    life_events: existingProfile?.life_events || [],
    personality_traits: existingProfile?.personality_traits || [],
    medical_notes: existingProfile?.medical_notes || '',
    medication_schedule: existingProfile?.medication_schedule || {}
  });

  const [newRelationship, setNewRelationship] = useState({ relation: '', name: '' });
  const [newTrait, setNewTrait] = useState('');
  const [newLifeEvent, setNewLifeEvent] = useState({
    title: '',
    description: '',
    date: '',
    significance: 'medium' as 'high' | 'medium' | 'low',
    people_involved: []
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    time: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addRelationship = () => {
    if (newRelationship.relation && newRelationship.name) {
      setProfile(prev => ({
        ...prev,
        family_relationships: {
          ...prev.family_relationships,
          [newRelationship.relation]: newRelationship.name
        }
      }));
      setNewRelationship({ relation: '', name: '' });
    }
  };

  const removeRelationship = (relation: string) => {
    setProfile(prev => {
      const updated = { ...prev.family_relationships };
      delete updated[relation];
      return { ...prev, family_relationships: updated };
    });
  };

  const addTrait = () => {
    if (newTrait.trim()) {
      setProfile(prev => ({
        ...prev,
        personality_traits: [...prev.personality_traits, newTrait.trim()]
      }));
      setNewTrait('');
    }
  };

  const removeTrait = (index: number) => {
    setProfile(prev => ({
      ...prev,
      personality_traits: prev.personality_traits.filter((_, i) => i !== index)
    }));
  };

  const addLifeEvent = () => {
    if (newLifeEvent.title && newLifeEvent.date) {
      setProfile(prev => ({
        ...prev,
        life_events: [...prev.life_events, { 
          ...newLifeEvent, 
          id: `event_${Date.now()}` 
        }]
      }));
      setNewLifeEvent({
        title: '',
        description: '',
        date: '',
        significance: 'medium',
        people_involved: []
      });
    }
  };

  const removeLifeEvent = (index: number) => {
    setProfile(prev => ({
      ...prev,
      life_events: prev.life_events.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      const medicationKey = newMedication.name.toLowerCase().replace(/\s+/g, '_');
      setProfile(prev => ({
        ...prev,
        medication_schedule: {
          ...prev.medication_schedule,
          [medicationKey]: {
            name: newMedication.name,
            dosage: newMedication.dosage,
            frequency: newMedication.frequency,
            time: newMedication.time
          }
        }
      }));
      setNewMedication({ name: '', dosage: '', frequency: '', time: '' });
    }
  };

  const removeMedication = (medicationKey: string) => {
    setProfile(prev => {
      const updated = { ...prev.medication_schedule };
      delete updated[medicationKey];
      return { ...prev, medication_schedule: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile.preferred_name.trim()) {
      alert('Please enter a preferred name');
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = {
        ...profile,
        id: existingProfile?.id || undefined,
        created_at: existingProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const savedProfile = await StorageService.savePatientProfile(profileData);
      await refreshData();
      onComplete(savedProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          {existingProfile ? 'Edit Patient Profile' : 'Create Patient Profile'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection
          title="Preferred Name"
          icon={<Heart className="w-5 h-5 text-blue-600" />}
          required
        >
          <input
            type="text"
            value={profile.preferred_name}
            onChange={(e) => handleInputChange('preferred_name', e.target.value)}
            placeholder="What would they like to be called?"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormSection>

        <FormSection
          title="Family Relationships"
          icon={<Heart className="w-5 h-5 text-blue-600" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Relationship (e.g., daughter)"
                value={newRelationship.relation}
                onChange={(e) => setNewRelationship(prev => ({ ...prev, relation: e.target.value }))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Name"
                value={newRelationship.name}
                onChange={(e) => setNewRelationship(prev => ({ ...prev, name: e.target.value }))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addRelationship}
                className="flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.family_relationships).map(([relation, name]) => (
                <div key={relation} className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-sm">{name} ({relation})</span>
                  <button
                    type="button"
                    onClick={() => removeRelationship(relation)}
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
          title="Personality Traits"
          icon={<Heart className="w-5 h-5 text-blue-600" />}
        >
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g., kind, funny, loves gardening"
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addTrait}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {profile.personality_traits.map((trait, index) => (
                <div key={index} className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  <span className="text-sm">{trait}</span>
                  <button
                    type="button"
                    onClick={() => removeTrait(index)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Important Life Events"
          icon={<Heart className="w-5 h-5 text-blue-600" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Event title"
                value={newLifeEvent.title}
                onChange={(e) => setNewLifeEvent(prev => ({ ...prev, title: e.target.value }))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={newLifeEvent.date}
                onChange={(e) => setNewLifeEvent(prev => ({ ...prev, date: e.target.value }))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={newLifeEvent.description}
                onChange={(e) => setNewLifeEvent(prev => ({ ...prev, description: e.target.value }))}
                className="md:col-span-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <select
                value={newLifeEvent.significance}
                onChange={(e) => setNewLifeEvent(prev => ({ ...prev, significance: e.target.value as any }))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Significance</option>
                <option value="medium">Medium Significance</option>
                <option value="high">High Significance</option>
              </select>
              <button
                type="button"
                onClick={addLifeEvent}
                className="flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>
            
            <div className="space-y-2">
              {profile.life_events.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.date} - {event.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLifeEvent(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Medication Schedule"
          icon={<Heart className="w-5 h-5 text-blue-600" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Medication name"
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Dosage (e.g., 10mg)"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Frequency (e.g., daily)"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="time"
                  value={newMedication.time}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, time: e.target.value }))}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {Object.entries(profile.medication_schedule).map(([key, medication]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <h4 className="font-medium">{medication.name}</h4>
                    <p className="text-sm text-gray-600">
                      {medication.dosage} - {medication.frequency}
                      {medication.time && ` at ${medication.time}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedication(key)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Medical Notes (Optional)"
          icon={<Heart className="w-5 h-5 text-blue-600" />}
        >
          <textarea
            value={profile.medical_notes}
            onChange={(e) => handleInputChange('medical_notes', e.target.value)}
            placeholder="Any relevant medical information or care notes..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormSection>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfileForm;