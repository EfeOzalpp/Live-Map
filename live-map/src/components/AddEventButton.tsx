import React, { useRef, useState } from 'react';
import '../index.css';
import sanityClient from './sanityClient';

type AddEventButtonProps = {
  currentPosition: GeolocationCoordinates | null;
};

const AddEventButton: React.FC<AddEventButtonProps> = ({ currentPosition }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [caption, setCaption] = useState('');
  const [emoji, setEmoji] = useState('');

  const handleInitialClick = () => {
    setShowCaptionInput(true);
  };

  const handleCancel = () => {
    setShowCaptionInput(false);
    setCaption('');
    setEmoji('');
  };

  const handleConfirm = () => {
    fileInputRef.current?.click(); // triggers image upload after caption
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPosition) {
      console.warn('No file or current location.');
      return;
    }

    try {
      const asset = await sanityClient.assets.upload('image', file, {
        filename: file.name,
      });

      const doc = {
        _type: 'pin',
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        },
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
        timestamp: new Date().toISOString(),
        caption,
        emoji,
      };

      await sanityClient.create(doc);
      window.dispatchEvent(new CustomEvent('refresh-pins'));

      // Reset state
      setCaption('');
      setEmoji('');
      setShowCaptionInput(false);
    } catch (err) {
      console.error('Error uploading to Sanity:', err);
    }
  };

  return (
    <div className="add-event-button-container">
      {!showCaptionInput ? (
        <button
          className="add-event-button"
          onClick={handleInitialClick}
          disabled={!currentPosition}
        >
          {currentPosition ? 'Add Event' : 'Locating...'}
        </button>
      ) : (
        <div className="caption-overlay">
          <div className="caption-input-wrapper">
            <label className="caption-label">Put a caption for your event</label>
            <input
              type="text"
              className="caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe the event..."
            />

            <label className="caption-label-2">Put a defining emoji</label>
            <input
              type="text"
              className="caption-input"
              value={emoji}
              onChange={(e) => {
                const value = e.target.value;
                if ([...value].length <= 3) setEmoji(value);
              }}
              placeholder="🎉🔥💬"
            />

            <div className="caption-buttons">
              <button className="caption-cancel" onClick={handleCancel}>✖</button>
              <button className="caption-confirm" onClick={handleConfirm}>✔</button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AddEventButton;
