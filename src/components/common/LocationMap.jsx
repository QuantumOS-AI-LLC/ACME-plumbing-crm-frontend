import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const LocationMap = ({ latitude, longitude, isLoaded }) => {
  const center = {
    lat: latitude,
    lng: longitude
  };

  if (!isLoaded) {
    return <div>Loading Map...</div>; // Or a loading spinner
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={18} // Further increased zoom level
    >
      {/* Child components, such as markers, info windows, etc. */}
      <Marker
        position={center}
        options={{
          visible: true, // Ensure marker is visible
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png', // URL for a standard red dot icon
            scaledSize: new window.google.maps.Size(32, 32), // Optional: scale the icon size
          },
        }}
      />
    </GoogleMap>
  );
};

export default LocationMap;
