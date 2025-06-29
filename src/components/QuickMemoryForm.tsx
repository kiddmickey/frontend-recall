import React, { useState, useRef } from 'react';
import { Camera, Calendar, MapPin, Users, Heart, ArrowRight, SkipBack as Skip, Mic, MicOff, Play, Pause, Upload, X, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface QuickMemoryFormProps {
  patientId: string;
  onComplete: (memory?: any) => void;
  onSkip: () => void;
  onBack?: () => void;
}

interface PhotoItem {
  id: string;
  url: string;
  file: File;
}

const QuickMemoryForm: React.FC<QuickMemoryFormProps> = ({
  patientId,
  onComplete,
  onSkip,
  onBack
}) => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [peopleInvolved, setPeopleInvolved] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [emotionalContext, setEmotionalContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newPhoto: PhotoItem = {
            id: `photo_${Date.now()}_${Math.random()}`,
            url: reader.result as string,
            file: file
          };
          setPhotos(prev => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const addPerson = () => {
    if (newPerson.trim() && !peopleInvolved.includes(newPerson.trim())) {
      setPeopleInvolved(prev => [...prev, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removePerson = (person: string) => {
    setPeopleInvolved(prev => prev.filter(p => p !== person));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (photos.length === 0 || !description.trim()) {
      alert('Please add at least one photo and description');
      return;
    }

    setIsSubmitting(true);

    try {
      const newMemory = {
        patient_id: patientId,
        photos: photos.map(photo => photo.url),
        photo_url: photos[0].url,
        audio_url: audioUrl,
        caption: description,
        date_taken: date,
        location: location || null,
        people_involved: peopleInvolved,
        emotional_context: emotionalContext || null,
        is_quick_memory: true,
        created_at: new Date().toISOString()
      };

      const savedMemory = await StorageService.saveMemoryCard(newMemory);
      onComplete(savedMemory);
    } catch (error) {
      console.error('Error saving memory:', error);
      alert('Failed to save memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8 max-w-4xl mx-auto">
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

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Add a Fresh Memory</h2>
        <p className="text-gray-600 text-lg">
          Capture recent moments to make today's conversation more meaningful
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Multiple Photos Upload */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            Photos <span className="text-red-500">*</span>
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt="Memory"
                  className="w-full h-32 object-cover rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* Add Photo Button */}
            <div 
              className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Add Photos</span>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          <p className="text-sm text-gray-500">
            You can add multiple photos. Click and drag to reorder them.
          </p>
        </div>

        {/* Voice Recording Section */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            What's happening in this photo?
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          {/* Voice Recording Controls */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-700">Voice Recording</h4>
              <span className="text-sm text-gray-500">Express the moment with your voice</span>
            </div>
            
            {!audioUrl ? (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isRecording ? `Recording... ${formatTime(recordingTime)}` : 'Start Recording'}
                </button>
                
                <div className="text-center">
                  <span className="text-gray-500">or</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Audio
                </button>
                
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={playAudio}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div>
                    <p className="text-sm font-medium">Voice Recording</p>
                    <p className="text-xs text-gray-500">
                      {recordingTime > 0 ? formatTime(recordingTime) : 'Audio file uploaded'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeAudio}
                  className="p-1 text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Text Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this special moment in words..."
            rows={4}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-lg"
          />
          
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>

        {/* Date and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was this taken?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
        </div>

        {/* People Involved with Add Button */}
        <div>
          <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            People Involved
          </label>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())}
                placeholder="Add person's name"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
              <button
                type="button"
                onClick={addPerson}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            
            {peopleInvolved.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {peopleInvolved.map((person, index) => (
                  <div key={index} className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                    <span className="text-blue-800 font-medium">{person}</span>
                    <button
                      type="button"
                      onClick={() => removePerson(person)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emotional Context */}
        <div>
          <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
            <Heart className="w-5 h-5 text-blue-600" />
            Mood of this Memory
          </label>
          <select
            value={emotionalContext}
            onChange={(e) => setEmotionalContext(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          >
            <option value="">Select mood (optional)</option>
            <option value="joyful">Joyful & Happy</option>
            <option value="peaceful">Peaceful & Calm</option>
            <option value="celebratory">Celebratory & Festive</option>
            <option value="nostalgic">Nostalgic & Reflective</option>
            <option value="loving">Loving & Tender</option>
            <option value="proud">Proud & Accomplished</option>
            <option value="adventurous">Adventurous & Exciting</option>
            <option value="cozy">Cozy & Intimate</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
          >
            <Skip className="w-5 h-5" />
            Skip for Now
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || photos.length === 0 || !description.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Adding Memory...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Add & Continue to Chat
              </>
            )}
          </button>
        </div>
      </form>

      {/* Helpful Tip */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Heart className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">💡 Memory Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Fresh memories create the most engaging conversations</li>
              <li>• Voice recordings help capture emotions and details</li>
              <li>• Multiple photos tell a richer story</li>
              <li>• Even simple daily moments can spark meaningful dialogue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickMemoryForm;