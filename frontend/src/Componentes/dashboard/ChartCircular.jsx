import React from "react";
import { RadialBarChart, RadialBar, Legend } from "recharts";

const ChartCircular = ({ porcentaje, label }) => {
  const data = [
    {
      name: label,
      value: porcentaje,
      fill: "#e73180"
    }
  ];

  return (
    <RadialBarChart
      width={200}
      height={200}
      cx="50%"
      cy="50%"
      innerRadius="80%"
      outerRadius="100%"
      barSize={15}
      data={data}
    >
      <RadialBar
        minAngle={15}
        background
        clockWise
        dataKey="value"
      />
      <Legend
        iconSize={10}
        layout="vertical"
        verticalAlign="middle"
        wrapperStyle={{ top: "50%", transform: "translateY(-50%)" }}
      />
    </RadialBarChart>
  );
};

export default ChartCircular;
