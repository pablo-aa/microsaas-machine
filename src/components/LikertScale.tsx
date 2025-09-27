import { useState } from "react";

interface LikertScaleProps {
  onSelect: (value: number) => void;
  selectedValue?: number;
}

const LikertScale = ({ onSelect, selectedValue }: LikertScaleProps) => {
  const options = [
    { value: 1, color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50", label: "Discordo Totalmente" },
    { value: 2, color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50", label: "Discordo" },
    { value: 3, color: "bg-yellow-500", textColor: "text-yellow-600", bgColor: "bg-yellow-50", label: "Neutro" },
    { value: 4, color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50", label: "Concordo" },
    { value: 5, color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50", label: "Concordo Totalmente" }
  ];

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Labels */}
      <div className="flex justify-between w-full max-w-lg text-sm text-muted-foreground">
        <span className="text-red-600 font-medium">Discordo<br />Totalmente</span>
        <span className="text-green-600 font-medium">Concordo<br />Totalmente</span>
      </div>

      {/* Scale */}
      <div className="flex items-start justify-center space-x-8">
        {options.map((option) => (
          <div key={option.value} className="flex flex-col items-center space-y-3">
            <button
              onClick={() => onSelect(option.value)}
              className={`
                w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 shadow-lg
                ${option.color}
                ${selectedValue === option.value 
                  ? 'ring-4 ring-primary ring-offset-2 scale-110' 
                  : 'hover:shadow-xl'
                }
              `}
              aria-label={option.label}
            />
            
            {/* Selected Option Label */}
            {selectedValue === option.value && (
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 animate-scale-in
                ${option.textColor} ${option.bgColor} border border-current/20
              `}>
                {option.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LikertScale;