import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import MapView, { Marker, Polygon } from "react-native-maps";
import proj4 from "proj4";

proj4.defs("EPSG:3857","+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs");

function convertPolygonRingTo4326(ring) {
  return ring.map(([x, y]) => {
    const [lon, lat] = proj4("EPSG:3857","EPSG:4326",[x, y]);
    return [lon, lat];
  });
}

function convertGeoJSONFeatureTo4326(feature: { geometry: { type: string; coordinates: any[]; }; }) {
  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates = feature.geometry.coordinates.map((ring) =>
      convertPolygonRingTo4326(ring)
    );
  } else if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates = feature.geometry.coordinates.map((poly) =>
      poly.map((ring) => convertPolygonRingTo4326(ring))
    );
  }
  return feature;
}

export default function AlgaeProbabilityMap() {
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<any[]>([]);
  
  const epsg3857 = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs";
  const epsg4326 = "+proj=longlat +datum=WGS84 +no_defs";

  proj4.defs("EPSG:3857", epsg3857);
  proj4.defs("EPSG:4326", epsg4326);

  useEffect(() => {
    const geojson = require("./polygons_resamp_04.json");
    // 1) Convert from EPSG:3857 to EPSG:4326
    const converted = {
      ...geojson,
      features: geojson.features.map((f) => convertGeoJSONFeatureTo4326(f)),
    };
    setFeatures(converted.features);
    setLoading(false);
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }}>
        {features.map((feature, index) => {
          const { geometry, properties } = feature;
          const { type, coordinates } = geometry || {};

          // If it's a Point => drop a Marker
          if (type === "Point" && Array.isArray(coordinates)) {
            const [lng, lat] = coordinates;
            return (
              <Marker
                key={index}
                coordinate={{ latitude: lat, longitude: lng }}
                title={properties?.type}
                description={properties?.name}
              />
            );
          }

          // If it’s a Polygon/MultiPolygon => use your polygon helper
          if (type === "Polygon" || type === "MultiPolygon") {
            const polygons = convertGeoJSONToPolygonCoords(geometry);

            return polygons.map((coords, ringIndex) => (
              <Polygon
                key={`${index}-${ringIndex}`}
                coordinates={coords}
                fillColor="rgba(255, 0, 0, 0.4)"
                strokeColor="#fff"
                strokeWidth={1}
              />
            ));
          }

          // Otherwise, ignore or handle other geometry types
          return null;
        })}
      </MapView>
    </View>
  );
}

function convertGeoJSONToPolygonCoords(
  geometry: { type: string; coordinates: any }
): { latitude: number; longitude: number }[][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring: number[][]) =>
      ring.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }))
    );
  } else if (geometry.type === "MultiPolygon") {
    const allPolygons: { latitude: number; longitude: number }[][] = [];
    geometry.coordinates.forEach((polygon: number[][][]) => {
      polygon.forEach((ring) => {
        const ringCoords = ring.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));
        allPolygons.push(ringCoords);
      });
    });
    return allPolygons;
  }
  return [];
}