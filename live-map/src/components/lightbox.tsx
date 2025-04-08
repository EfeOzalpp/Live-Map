import React from 'react';
import '../index.css';

type LightboxProps = {
  image: string;
  caption?: string;
  onClose: () => void;
};

const Lightbox: React.FC<LightboxProps> = ({ image, caption, onClose }) => {
  return (
    <div className="lightbox-overlay">
      <button className="lightbox-close" onClick={onClose}>
        &times;
      </button>
      <img src={image} alt="Pin" className="lightbox-image" />
      {caption && <p className="lightbox-caption">{caption}</p>}
    </div>
  );
};

export default Lightbox;
