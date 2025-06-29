import React from 'react';
import { Calendar, MapPin, Users, Play, Trash2, Edit } from 'lucide-react';

interface MemoryCardDisplayProps {
  memory: any;
  onSelect?: (memory: any) => void;
  onEdit?: (memory: any) => void;
  onDelete?: (memory: any) => void;
  isSelected?: boolean;
}

const MemoryCardDisplay: React.FC<MemoryCardDisplayProps> = ({
  memory,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={() => onSelect?.(memory)}
    >
      {memory.photo_url && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={memory.photo_url} 
            alt="Memory" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(memory.date_taken)}</span>
        </div>
        
        {memory.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4" />
            <span>{memory.location}</span>
          </div>
        )}
        
        {memory.people_involved?.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Users className="w-4 h-4" />
            <span>{memory.people_involved.join(', ')}</span>
          </div>
        )}
        
        {memory.caption && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-3">
            {memory.caption}
          </p>
        )}
        
        {memory.emotional_context && (
          <div className="mb-3">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {memory.emotional_context}
            </span>
          </div>
        )}
        
        {memory.audio_url && (
          <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
            <Play className="w-4 h-4" />
            <span>Voice recording available</span>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Added {new Date(memory.created_at).toLocaleDateString()}
          </div>
          
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(memory);
                }}
                className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(memory);
                }}
                className="p-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryCardDisplay;