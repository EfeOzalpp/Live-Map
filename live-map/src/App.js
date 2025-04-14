import './App.css';
import React, { useEffect, useState } from 'react';
import MapComponent from './components/map.tsx';
import AddEventButton from './components/AddEventButton.tsx';

function App() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported. Using fallback.');
      setLocation({ latitude: 40.7128, longitude: -74.006 }); // NYC fallback
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation(pos.coords);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocation({ latitude: 40.7128, longitude: -74.006 }); // fallback
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="App">
      <AddEventButton currentPosition={location} />
      <MapComponent currentPosition={location} />
    </div>
  );
}

export default App;
