import React, { useEffect, useState } from 'react';
import {
  GoogleMap,
  LoadScript,
  Marker,
} from '@react-google-maps/api';
import sanityClient from './sanityClient';
import Lightbox from './lightbox.tsx';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

type Pin = {
  id: string;
  image: string;
  lat: number;
  lng: number;
  timestamp: number;
  caption?: string;
  emoji?: string;
};

type MapComponentProps = {
  currentPosition: GeolocationCoordinates | null;
};

const createCircularIcon = async (
  url: string,
  imageSize = 75,
  emoji?: string
): Promise<string> => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = url;

  return new Promise((resolve) => {
    img.onload = () => {
      const emojiHeight = 34;
      const emojiGap = 8;
      const canvasWidth = imageSize + emojiGap + emojiHeight;
      const canvasHeight = imageSize + emojiGap + emojiHeight;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw circle mask
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, imageSize / 2, imageSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Draw image inside the clipped circle
      ctx.drawImage(img, 0, 0, imageSize + emojiGap + emojiHeight, imageSize + emojiGap + emojiHeight);
      ctx.restore();

      // Draw emoji below the image, perfectly centered
      if (emoji) {
        ctx.font = '28px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(emoji, canvasWidth / 2, imageSize + emojiGap);
      }

      resolve(canvas.toDataURL());
    };
  });
};

const MapComponent: React.FC<MapComponentProps> = ({ currentPosition }) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [icons, setIcons] = useState<{ [id: string]: string }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [lightboxPin, setLightboxPin] = useState<Pin | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (currentPosition && !mapCenter) {
      setMapCenter({
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
      });
      setIsLoaded(true);
    }
  }, [currentPosition, mapCenter]);  

  useEffect(() => {
    const fetchPins = async () => {
      const data = await sanityClient.fetch(`*[_type == "pin"]{
        _id,
        image {
          asset -> {
            url
          }
        },
        lat,
        lng,
        timestamp,
        caption,
        emoji
      }`);

      const validPins = data
        .map((pin: any) => ({
          id: pin._id,
          image: pin.image?.asset?.url || '',
          lat: pin.lat,
          lng: pin.lng,
          timestamp: new Date(pin.timestamp).getTime(),
          caption: pin.caption,
          emoji: pin.emoji,
        }))
        .filter((pin) => Date.now() - pin.timestamp < 6 * 60 * 60 * 1000);

      setPins(validPins);

      const iconPromises = validPins.map(async (pin) => {
        const iconUrl = await createCircularIcon(pin.image, 60, pin.emoji); // Pass emoji here
        return { id: pin.id, iconUrl };
      });      

      const iconResults = await Promise.all(iconPromises);
      const iconMap: { [id: string]: string } = {};
      iconResults.forEach((item) => {
        iconMap[item.id] = item.iconUrl;
      });
      setIcons(iconMap);
    };

    fetchPins();

    const listener = () => fetchPins();
    window.addEventListener('refresh-pins', listener);
    return () => window.removeEventListener('refresh-pins', listener);
  }, []);

  return (
    <>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY!}>
        {isLoaded && currentPosition && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter!}
            zoom={16}
            options={{
              maxZoom: 22,
              minZoom: 2,
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            {pins.map((pin) => (
              icons[pin.id] && (
                <Marker
                  key={pin.id}
                  position={{ lat: pin.lat, lng: pin.lng }}
                  onClick={() => setLightboxPin(pin)}
                  icon={{
                    url: icons[pin.id],
                    scaledSize: new window.google.maps.Size(60, 60),
                    origin: new window.google.maps.Point(0, 0),
                    anchor: new window.google.maps.Point(30, 30),
                  }}
                />
              )
            ))}
          </GoogleMap>
        )}
      </LoadScript>

      {/* Lightbox OUTSIDE of the map to prevent overlap issues */}
      {lightboxPin && (
        <Lightbox
          image={lightboxPin.image}
          caption={lightboxPin.caption}
          onClose={() => setLightboxPin(null)}
        />
      )}
    </>
  );
};

export default MapComponent;
