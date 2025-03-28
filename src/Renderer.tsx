import { useMemo } from "react";
import * as d3 from "d3";
import { InteractionData } from "./Heatmap";
import { MARGIN } from "./constants";
import styles from "./renderer.module.css";
import { Dataset } from "./data";

type RendererProps = {
  width: number;
  height: number;
  data: Dataset;
  setHoveredCell: (hoveredCell: InteractionData | null) => void;
  colorScale: d3.ScaleLinear<string, string, never>;
};

export const Renderer = ({
  width,
  height,
  data,
  setHoveredCell,
  colorScale,
}: RendererProps) => {
  // bounds = area inside the axis
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const allYGroups = useMemo(() => [...new Set(data.map((d) => d.y))], [data]);
  const allXGroups = useMemo(
    () => [...new Set(data.map((d) => String(d.x)))],
    [data]
  );

  const xScale = useMemo(() => {
    return d3
      .scaleBand()
      .range([0, boundsWidth])
      .domain(allXGroups)
      .padding(0.1);
  }, [data, width]);

  const yScale = useMemo(() => {
    return d3
      .scaleBand<string>()
      .range([0, boundsHeight])
      .domain(allYGroups)
      .padding(0.1);
  }, [data, height]);

  const allRects = data.map((d, i) => {
    const xPos = xScale(String(d.x));
    const yPos = yScale(d.y);

    if (d.value === null || !xPos || !yPos) {
      return;
    }

    return (
      <rect
        key={i}
        x={xPos}
        y={yPos}
        className={styles.rectangle}
        width={xScale.bandwidth()}
        height={yScale.bandwidth()}
        fill={d.value ? colorScale(d.value) : "#F8F8F8"}
        onMouseEnter={(e) => {
          setHoveredCell({
            xLabel: String(d.x),
            yLabel: d.y,
            xPos: xPos + xScale.bandwidth() + MARGIN.left,
            yPos: yPos + xScale.bandwidth() / 2 + MARGIN.top,
            value: d.value ? Math.round(d.value * 100) / 100 : null,
          });
        }}
      />
    );
  });

  const formatDate = d3.timeFormat("%b %d"); // Ex: May 17

  const monthlyTicks = useMemo(() => {
    const labels: string[] = [];

    allXGroups.forEach((d, i, arr) => {
      const current = new Date(d);
      const prev = i > 0 ? new Date(arr[i - 1]) : null;

      if (
        !prev ||
        current.getMonth() !== prev.getMonth() ||
        current.getFullYear() !== prev.getFullYear()
      ) {
        labels.push(d);
      }
    });

    return labels;
  }, [allXGroups]);

  const xLabels = (
    <g
      transform={`translate(${MARGIN.left}, ${boundsHeight + MARGIN.top + 5})`}
    >
      {monthlyTicks.map((dateStr, i) => {
        const xPos = xScale(dateStr);
        if (xPos !== undefined) {
          return (
            <text
              key={i}
              x={xPos + xScale.bandwidth() / 2}
              y={10}
              textAnchor="middle"
              dominantBaseline="hanging"
              fontSize={10}
              fill="black"
            >
              {d3.timeFormat("%b %Y")(new Date(dateStr))}
            </text>
          );
        }
        return null;
      })}
    </g>
  );
  const yLabels = allYGroups.map((name, i) => {
    const yPos = yScale(name);
    if (yPos !== undefined) {
      return (
        <text
          key={i}
          x={-5}
          y={yPos + yScale.bandwidth() / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={10}
        >
          {name}
        </text>
      );
    }
  });

  return (
    <svg
      width={width}
      height={height}
      onMouseLeave={() => setHoveredCell(null)}
    >
      <g
        width={boundsWidth}
        height={boundsHeight}
        transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
      >
        {allRects}
        {xLabels}
        {yLabels}
      </g>
    </svg>
  );
};
