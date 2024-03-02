import { useEffect, useState } from "preact/hooks";
import { ITUData } from "./utils";

namespace preactJSX {
  interface IntrinsicElements {
    "weave-select": any;
  }
}

export type Filter = {
  options: {};
  func: (d: ITUData) => boolean;
};

const Section = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
};

function determineAge(age: ITUData["ageRange"], from: number, to: number) {
  if (age === "N/A") return false;
  if (age === "65+" || (age as any) === "65") return from <= 65 && to <= 65;
  const [ageFrom, ageTo] = age.split("-").map((n) => parseInt(n));
  return ageFrom >= from && ageTo <= to;
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

export function Filters({
  setFilterFunction,
}: {
  setFilterFunction: (f: (d: ITUData) => boolean) => void;
}) {
  const [filter, setFilter] = useState<{
    ageFrom?: number;
    ageTo?: number;
    gender?: ITUData["gender"];
    visitorType?: ITUData["visitorType"];
  }>({
    ageFrom: 0,
    ageTo: 110,
    gender: null,
    visitorType: null,
  });

  useEffect(() => {
    console.log(filter);
    const fn = (d: ITUData) => {
      const genderFilter = !filter.gender || filter.gender === d.gender;
      const visitorTypeFilter =
        !filter.visitorType || filter.visitorType === d.visitorType;
      return genderFilter && visitorTypeFilter;
    };
    setFilterFunction(() => fn);
  }, [filter, setFilterFunction]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <h3>Filter</h3>
      <section style={Section}>
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
      <section style={Section}>
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
      <section style={Section}>
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
