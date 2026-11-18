import React, { useEffect, useRef, useState } from 'react';
import { Order, OrderStatus } from '../types';
import LoadingSpinner from './LoadingSpinner';
import * as apiService from '../services/apiService';

// Declare google property on window for TypeScript
declare global {
  interface Window {
    google: any; // You can use more specific types if available e.g. typeof google
  }
}
interface OrderTrackingMapProps {
  order: Order;
}

const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({ order }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null); 
  const deliveryMarkerRef = useRef<any | null>(null); 
  const destinationMarkerRef = useRef<any | null>(null);

  const [currentOrderLocation, setCurrentOrderLocation] = useState(order.currentLocation);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.google || !window.google.maps) {
      setError("Google Maps API script not loaded yet or failed to load. Check your internet connection and the API key in index.html.");
      console.error("Google Maps API not available on window object.");
      return;
    }
    
    setError(null);

    if (mapRef.current && !mapInstanceRef.current && order.destinationCoordinates) {
      const initialCenter = currentOrderLocation || order.destinationCoordinates;
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
      });

      if (order.destinationCoordinates && mapInstanceRef.current) {
        destinationMarkerRef.current = new window.google.maps.Marker({
          position: order.destinationCoordinates,
          map: mapInstanceRef.current,
          title: "Delivery Destination",
          icon: {
              url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });
      }
    }

    if (mapInstanceRef.current && currentOrderLocation) {
        if (!deliveryMarkerRef.current) {
            deliveryMarkerRef.current = new window.google.maps.Marker({
            position: currentOrderLocation,
            map: mapInstanceRef.current,
            title: "Your Order",
            icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: "#FF6B35",
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: "#FFFFFF",
                rotation: 0
            }
            });
        } else {
            deliveryMarkerRef.current.setPosition(currentOrderLocation);
        }
    }
    

  }, [order.destinationCoordinates, currentOrderLocation]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (order.status === OrderStatus.OUT_FOR_DELIVERY && order.destinationCoordinates && currentOrderLocation) {
      intervalId = setInterval(async () => {
        const dest = order.destinationCoordinates!;
        const curr = currentOrderLocation!;

        if (Math.abs(curr.lat - dest.lat) < 0.0001 && Math.abs(curr.lng - dest.lng) < 0.0001) {
          if (intervalId) clearInterval(intervalId);
          setCurrentOrderLocation(dest);
          await apiService.updateOrderLocation(order.id, dest);
          return;
        }

        const step = 0.0005;
        const newLat = curr.lat + Math.sign(dest.lat - curr.lat) * Math.min(step, Math.abs(dest.lat - curr.lat));
        const newLng = curr.lng + Math.sign(dest.lng - curr.lng) * Math.min(step, Math.abs(dest.lng - curr.lng));
        
        const newSimulatedLocation = { lat: newLat, lng: newLng };
        setCurrentOrderLocation(newSimulatedLocation);

        await apiService.updateOrderLocation(order.id, newSimulatedLocation);

      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [order.status, order.id, order.destinationCoordinates, currentOrderLocation]);


  if (error) {
    return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md text-center">{error}</div>;
  }
  
  if (!window.google) {
      return <div className="flex justify-center items-center h-64"><LoadingSpinner text="Initializing map..."/></div>;
  }

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} className="rounded-lg shadow-md" />;
};

export default OrderTrackingMap;
