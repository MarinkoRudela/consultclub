import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";

interface TreatmentAreaSelectorProps {
  areas: string[];
  selectedAreas: string[];
  onAreaToggle: (area: string) => void;
  businessType?: string;
}

const getRelevantAreas = (businessType: string = 'med_spa', allAreas: string[]) => {
  switch (businessType) {
    case 'brow_specialist':
      return ['Eyebrows', 'Eye Area', 'Upper Face'];
    case 'aesthetician':
      return allAreas.filter(area => !['Neck'].includes(area));
    default:
      return allAreas;
  }
};

export const TreatmentAreaSelector = ({
  areas,
  selectedAreas,
  onAreaToggle,
  businessType = 'med_spa'
}: TreatmentAreaSelectorProps) => {
  const relevantAreas = getRelevantAreas(businessType, areas);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Treatment Areas</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {relevantAreas.map((area) => (
          <div key={area} className="flex items-center space-x-2">
            <Checkbox
              id={`area-${area}`}
              checked={selectedAreas.includes(area)}
              onCheckedChange={() => onAreaToggle(area)}
            />
            <label
              htmlFor={`area-${area}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {area}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};