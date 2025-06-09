import { BikeCounter } from "@prisma/client";
import { StyleSpecification } from "maplibre-gl";
import MapLibreDetails from "@/components/Maps/MapLibreDetails";

interface CounterDetailsMapProps {
  counter: BikeCounter;
  mapStyle: StyleSpecification;
  isActive: boolean;
}

export default function CounterDetailsMap({
  counter,
  mapStyle,
  isActive,
}: CounterDetailsMapProps) {
  return (
    <div className="relative w-full h-full">
      <MapLibreDetails
        counter={counter}
        mapStyle={mapStyle}
        isActive={isActive}
      />
    </div>
  );
}
