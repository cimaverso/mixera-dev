import React from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const ChartCircular = ({ porcentaje, label }) => {
  const data = [
    {
      name: label || "Progreso",
      value: porcentaje,
      fill: "#e73180"
    }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="90%"
        barSize={12}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar
          minAngle={15}
          background={{ fill: '#f3f4f6' }}
          clockWise
          dataKey="value"
          cornerRadius={6}
          fill="#e73180"
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

export default ChartCircular;