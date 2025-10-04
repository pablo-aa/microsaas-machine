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
    <div className="flex flex-col items-center space-y-6 px-4">
      {/* Labels */}
      <div className="flex justify-between w-full max-w-sm sm:max-w-lg text-xs sm:text-sm text-muted-foreground">
        <span className="text-red-600 font-medium text-center">Discordo<br />Totalmente</span>
        <span className="text-green-600 font-medium text-center">Concordo<br />Totalmente</span>
      </div>

      {/* Scale */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 w-full max-w-sm sm:max-w-lg">
        {options.map((option) => (
          <div key={option.value} className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
            <button
              onClick={() => onSelect(option.value)}
              className={`
                w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 shadow-lg
                ${option.color}
                ${selectedValue === option.value 
                  ? 'ring-2 sm:ring-4 ring-primary ring-offset-1 sm:ring-offset-2' 
                  : 'hover:scale-105 hover:shadow-xl'
                }
              `}
              aria-label={option.label}
            />
            
            {/* Selected Option Label - Fixed Height Container */}
            <div className="min-h-[48px] flex items-start justify-center mt-2 w-full">
              {selectedValue === option.value && (
                <div className={`
                  px-1.5 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 animate-scale-in text-center
                  ${option.textColor} ${option.bgColor} border border-current/20 leading-tight max-w-full
                `}>
                  {option.label}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LikertScale;