import { useState } from "react";

interface LikertScaleProps {
  onSelect: (value: number) => void;
  selectedValue?: number;
}

const LikertScale = ({ onSelect, selectedValue }: LikertScaleProps) => {
  const options = [
    { value: 1, color: "bg-red-500", label: "Discordo Totalmente" },
    { value: 2, color: "bg-orange-500", label: "Discordo" },
    { value: 3, color: "bg-yellow-500", label: "Neutro" },
    { value: 4, color: "bg-blue-500", label: "Concordo" },
    { value: 5, color: "bg-green-500", label: "Concordo Totalmente" }
  ];

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Labels */}
      <div className="flex justify-between w-full max-w-md text-sm text-muted-foreground">
        <span className="text-red-600 font-medium">Discordo<br />Totalmente</span>
        <span className="text-green-600 font-medium">Concordo<br />Totalmente</span>
      </div>

      {/* Scale */}
      <div className="flex items-center space-x-6">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`
              w-16 h-16 rounded-full transition-all duration-200 hover:scale-110 shadow-lg
              ${option.color}
              ${selectedValue === option.value 
                ? 'ring-4 ring-primary ring-offset-2 scale-110' 
                : 'hover:shadow-xl'
              }
            `}
            aria-label={option.label}
          />
        ))}
      </div>
    </div>
  );
};

export default LikertScale;