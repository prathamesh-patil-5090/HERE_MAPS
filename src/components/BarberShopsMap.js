import React, { useState, useEffect } from "react";

// Include the HERE Maps JavaScript API in your project
const BarberShopsMap = () => {
  const [currentLocation, setCurrentLocation] = useState(null); // Current user location
  const [barberShops, setBarberShops] = useState([]); // List of barber shops
  const [map, setMap] = useState(null); // HERE Map instance
  const [ui, setUi] = useState(null); // HERE UI instance
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(5000); // 5km radius

  const hereApiKey = "YOUR_HERE_MAP_API"; // Replace with your HERE Maps API key

  // Fetch user's current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Geolocation is not supported or permission is denied.");
      }
    );
  }, []);

  // Initialize HERE Map
  useEffect(() => {
    if (currentLocation && !map) {
      const platform = new window.H.service.Platform({
        apikey: hereApiKey,
      });

      const defaultLayers = platform.createDefaultLayers();

      // Initialize map
      const mapInstance = new window.H.Map(
        document.getElementById("map"),
        defaultLayers.vector.normal.map,
        {
          center: currentLocation,
          zoom: 14,
          pixelRatio: window.devicePixelRatio || 1,
        }
      );

      // Add behavior and UI controls
      const behavior = new window.H.mapevents.Behavior(
        new window.H.mapevents.MapEvents(mapInstance)
      );
      
      // Create UI instance first
      const uiInstance = window.H.ui.UI.createDefault(mapInstance, defaultLayers);
      setUi(uiInstance);
      setMap(mapInstance);

      // Fetch nearby barber shops only after UI is initialized
      fetchBarberShops(currentLocation.lat, currentLocation.lng, platform, mapInstance, uiInstance);
    }

    return () => {
      if (map) {
        map.dispose();
      }
    };
  }, [currentLocation, map]);

  // Add this helper function for star rating display
  const getRatingStars = (rating) => {
    if (!rating) return '⭐ N/A';
    return '⭐'.repeat(Math.round(rating));
  };

  // Fetch nearby barber shops using HERE Places API
  const fetchBarberShops = async (lat, lng, platform, mapInstance, uiInstance) => {
    setIsLoading(true);
    const searchService = platform.getSearchService();

    searchService.discover({
      at: `${lat},${lng}`,
      q: 'barber shop',  // Search term
      limit: 20,
      distance: radius,
      lang: 'en'
    }, async (result) => {
      setIsLoading(false);
      if (result.items && result.items.length > 0) {
        const shops = result.items.filter(item => 
          item.title.toLowerCase().includes('barber') ||
          item.title.toLowerCase().includes('salon') ||
          item.title.toLowerCase().includes('hair') ||
          item.title.toLowerCase().includes('unisex') ||
          item.title.toLowerCase().includes('beauty') ||
          item.title.toLowerCase().includes('spa')
        );
        
        // Fetch additional details for each shop
        const shopsWithDetails = await Promise.all(
          shops.map(async (shop) => {
            try {
              const additionalDetails = await fetch('/api/shopDetails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: shop.title,
                  address: shop.address.label,
                  city: 'YourCity' // Add city detection logic here
                }),
              }).then(res => res.json());

              return { ...shop, additionalDetails };
            } catch (error) {
              console.error('Error fetching additional details:', error);
              return shop;
            }
          })
        );
        
        setBarberShops(shopsWithDetails);

        // Clear existing markers
        mapInstance.removeObjects(mapInstance.getObjects());
        
        // Add user location marker
        const userMarker = new window.H.map.Marker(currentLocation);
        mapInstance.addObject(userMarker);

        // Add shop markers with UI instance check
        shopsWithDetails.forEach((shop) => {
          const marker = new window.H.map.Marker({
            lat: shop.position.lat,
            lng: shop.position.lng,
          });

          const rating = shop.averageRating || 'N/A';
          const distance = shop.distance || 0;
          const phone = shop.contacts?.phone?.[0]?.value || "N/A";
          const hours = shop.additionalDetails?.hours || 'N/A';
          const website = shop.additionalDetails?.website || 'N/A';
          
          marker.setData(
            `<div>
              <strong>${shop.title}</strong><br />
              ${shop.address?.label || 'No address available'}<br />
              Rating: ${getRatingStars(shop.averageRating)}<br />
              Distance: ${(distance/1000).toFixed(1)}km<br />
              Contact: ${phone}<br />
              Hours: ${hours}<br />
              Website: <a href="${website}" target="_blank">${website}</a><br />
              <hr/>
              <strong>JustDial Info:</strong><br />
              ${shop.additionalDetails?.justdial?.[0] ? `
                Rating: ${shop.additionalDetails.justdial[0].rating}<br />
                Reviews: ${shop.additionalDetails.justdial[0].reviews}<br />
                Timing: ${shop.additionalDetails.justdial[0].timing}
              ` : 'No JustDial information available'}
            </div>`
          );

          marker.addEventListener("tap", (event) => {
            if (uiInstance) {
              // Remove existing bubbles first
              uiInstance.getBubbles().forEach(bubble => uiInstance.removeBubble(bubble));
              
              const bubble = new window.H.ui.InfoBubble(event.target.getGeometry(), {
                content: event.target.getData(),
              });
              uiInstance.addBubble(bubble);
            }
          });

          mapInstance.addObject(marker);
        });

        if (shops.length === 0) {
          setError("No barber shops found in this area. Try increasing the radius.");
        }
      } else {
        setError("No results found. Try a different location or increase the radius.");
      }
    }, (error) => {
      setIsLoading(false);
      setError("Error fetching barber shops: " + error.message);
      console.error(error);
    });
  };

  return (
    <div className="barber-shops-container">
      <h2>Barber Shops Near Me</h2>
      <div className="controls">
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
          <option value={2000}>2 km</option>
          <option value={5000}>5 km</option>
          <option value={10000}>10 km</option>
        </select>
      </div>
      
      {isLoading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      
      <div className="map-container">
        <div
          id="map"
          style={{
            width: "100%",
            height: "500px",
          }}
        />
        <div className="shop-list">
          {barberShops.map((shop) => (
            <div key={shop.id} className="shop-item">
              <h3>{shop.title}</h3>
              <p className="rating">{getRatingStars(shop.averageRating)}</p>
              <p>{shop.address.label}</p>
              <p>Distance: {(shop.distance/1000).toFixed(1)}km</p>
              <p>Contact: {shop.contacts?.phone?.[0]?.value || "N/A"}</p>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .barber-shops-container {
          padding: 20px;
        }
        .controls {
          margin-bottom: 20px;
        }
        .map-container {
          display: flex;
          gap: 20px;
        }
        .shop-list {
          flex: 0 0 300px;
          overflow-y: auto;
          max-height: 500px;
        }
        .rating {
          color: #ffd700;
          font-size: 1.2em;
          margin: 5px 0;
        }
        .shop-item {
          padding: 15px;
          border-bottom: 1px solid #eee;
          transition: background-color 0.2s;
        }
        .shop-item:hover {
          background-color: #f5f5f5;
        }
        .error {
          color: red;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
};

export default BarberShopsMap;
