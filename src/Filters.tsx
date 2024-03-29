import { useEffect, useState } from "preact/hooks";
import { ITUData } from "./utils";

namespace preactJSX {
  interface IntrinsicElements {
    "weave-select": any;
  }
}

export const Divide = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
};

export function determineAge(
  age: ITUData["ageRange"],
  from: number,
  to: number
) {
  if (age === "N/A") return false;
  if (age === "65+" || (age as any) === "65") return from <= 65 && 65 <= to;
  const [ageFrom, ageTo] = age.split("-").map((n) => parseInt(n));
  return from <= ageFrom && ageTo <= to;
}

const genders: ITUData["gender"][] = ["M", "F", "N", "none"];

const visitorTypes: ITUData["visitorType"][] = [
  "Commuter",
  "in-transit",
  "One day visitor",
  "Overnight visitor",
  "Potential event visitor",
  "Resident",
  "Short term visitor",
];

export type Filter = {
  ageFrom?: number;
  ageTo?: number;
  gender?: ITUData["gender"];
  visitorType?: ITUData["visitorType"];
};

export function Filters({
  filter,
  setFilter,
}: {
  filter: Filter;
  setFilter: (filter: Filter) => void;
}) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <section style={Divide}>
        <p>Age</p>
        from:{" "}
        <input
          style={{ width: "50px" }}
          type="number"
          value={filter.ageFrom}
          onChange={(e) =>
            setFilter({ ...filter, ageFrom: parseInt(e.currentTarget.value) })
          }
        />
        to:{" "}
        <input
          style={{ width: "50px" }}
          type="number"
          value={filter.ageTo}
          onChange={(e) =>
            setFilter({ ...filter, ageTo: parseInt(e.currentTarget.value) })
          }
        />
      </section>
      <section style={Divide}>
        <p>Gender</p>
        <weave-select
          value={filter.gender || null}
          style={{ width: "150px" }}
          onChange={(e) => {
            setFilter({ ...filter, gender: e.detail.value });
          }}
        >
          <weave-select-option value={undefined}>Off</weave-select-option>
          {genders.map((gender) => (
            <weave-select-option value={gender}>{gender}</weave-select-option>
          ))}
        </weave-select>
      </section>
      <section style={Divide}>
        <p>Type</p>
        <weave-select
          value={filter.visitorType || null}
          style={{ width: "150px" }}
          onChange={(e) => {
            setFilter({ ...filter, visitorType: e.detail.value });
          }}
        >
          <weave-select-option value={undefined}>Off</weave-select-option>
          {visitorTypes.map((type) => (
            <weave-select-option value={type}>{type}</weave-select-option>
          ))}
        </weave-select>
      </section>
    </div>
  );
}
