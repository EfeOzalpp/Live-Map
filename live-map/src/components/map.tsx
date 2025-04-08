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
};

type MapComponentProps = {
  currentPosition: GeolocationCoordinates | null;
};

const createCircularIcon = async (url: string, size = 60): Promise<string> => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = url;

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL());
    };
  });
};

const MapComponent: React.FC<MapComponentProps> = ({ currentPosition }) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [icons, setIcons] = useState<{ [id: string]: string }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [lightboxPin, setLightboxPin] = useState<Pin | null>(null);

  useEffect(() => {
    if (currentPosition) {
      setIsLoaded(true);
    }
  }, [currentPosition]);

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
        caption
      }`);

      const validPins = data
        .map((pin: any) => ({
          id: pin._id,
          image: pin.image?.asset?.url || '',
          lat: pin.lat,
          lng: pin.lng,
          timestamp: new Date(pin.timestamp).getTime(),
          caption: pin.caption,
        }))
        .filter((pin) => Date.now() - pin.timestamp < 6 * 60 * 60 * 1000);

      setPins(validPins);

      const iconPromises = validPins.map(async (pin) => {
        const iconUrl = await createCircularIcon(pin.image);
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
            center={{
              lat: currentPosition.latitude,
              lng: currentPosition.longitude,
            }}
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

      {/* ✅ Lightbox OUTSIDE of the map to prevent overlap issues */}
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
