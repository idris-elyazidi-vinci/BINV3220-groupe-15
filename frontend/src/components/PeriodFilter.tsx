import type { ChangeEvent } from "react";
import { PERIOD_CODES, type PeriodCode } from "../models/offer.ts";
import { PERIOD_LABELS } from "../utils/labels.ts";

/** « ALL » représente l'absence de filtre (toutes les périodes). */
export type PeriodChoice = "ALL" | PeriodCode;

interface PeriodFilterProps {
  label: string;
  value: PeriodChoice;
  onChange: (value: PeriodChoice) => void;
}

const PeriodFilter = ({ label, value, onChange }: PeriodFilterProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as PeriodChoice);
  };

  return (
    <label className="filter-field">
      <span>{label}</span>
      <select value={value} onChange={handleChange}>
        <option value="ALL">Toutes</option>
        {PERIOD_CODES.map((code) => (
          <option key={code} value={code}>
            {PERIOD_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
};

export default PeriodFilter;
