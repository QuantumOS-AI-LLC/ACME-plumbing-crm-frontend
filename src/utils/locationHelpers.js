// Helper function to convert decimal degrees to degrees, minutes, and seconds (DMS)
const toDms = (decimalDegrees, isLatitude) => {
  const degrees = Math.floor(decimalDegrees);
  const minutesDecimal = (decimalDegrees - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;

  // Determine cardinal direction
  let direction = "";
  if (isLatitude) {
    direction = decimalDegrees >= 0 ? "N" : "S";
  } else {
    direction = decimalDegrees >= 0 ? "E" : "W";
  }

  // Format seconds to a couple of decimal places
  const formattedSeconds = seconds.toFixed(2);

  return `${Math.abs(degrees)}° ${minutes}' ${formattedSeconds}" ${direction}`;
};

// Function to format latitude and longitude into DMS strings
export const formatLocationToDms = (latitude, longitude) => {
  if (latitude === null || longitude === null) {
    return {
      latitudeDms: "N/A",
      longitudeDms: "N/A",
    };
  }

  const latitudeDms = toDms(latitude, true);
  const longitudeDms = toDms(longitude, false);

  return { latitudeDms, longitudeDms };
};
