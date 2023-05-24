import React, { useCallback, useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import { PieChart, Pie, Cell, Sector, Tooltip, Legend } from "recharts";
import { Insight, getActivitiesByCategory } from "../api";
import { Spinner, Table } from "react-bootstrap";
import { useAuth0 } from "@auth0/auth0-react";

/**
 * TODO: animations
 */

const COLORS_GPT = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
];

interface Activity {
  id: string;
  date: string;
  account: string;
  amount: number;
  category: string;
  desc: string;
}

interface CategoryCardProps {
  insights: Array<Insight>;
}

function calculateCategoryBreakdown(
  insights: Array<Insight>,
  displayTop: number | null
): Array<CategoryBreakdown> {
  const allCategories = insights
    .reduce((acc: Array<CategoryBreakdown>, cur: Insight) => {
      Object.keys(cur.categories).forEach((category) => {
        const amount = cur.categories[category];
        if (amount > 0) {
          const existing = acc.find((cur) => cur.category === category);
          if (existing) {
            existing.amount += amount;
          } else {
            acc.push({
              category,
              amount,
            });
          }
        }
      });
      return acc;
    }, [])
    .map((cur) => {
      return {
        ...cur,
        amount: Math.round(cur.amount * 100) / 100,
      };
    })
    .filter((cur) => cur.amount > 0);
  allCategories.sort((a, b) => b.amount - a.amount);
  if (!displayTop) {
    return allCategories;
  }
  const others: CategoryBreakdown = {
    category: "Others",
    amount: allCategories
      .slice(displayTop)
      .reduce((acc, cur) => acc + cur.amount, 0),
  };
  return [...allCategories.slice(0, displayTop), others];
}

interface SectorProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: any;
  percent: number;
  value: number;
}

const activeSlice = (props: SectorProps) => {
  // expand radius by 20%, keep fill color
  return <Sector {...props} outerRadius={props.outerRadius * 1.2} />;
};

interface CategoryBreakdown {
  category: string;
  amount: number;
}

export const CategoryCard = ({ insights }: CategoryCardProps) => {
  const { getAccessTokenSilently } = useAuth0();

  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Array<CategoryBreakdown>
  >([]);
  const [activities, setActivities] = useState<Array<Activity>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const handleMouseEnter = useCallback((_: any, index: number) => {
    setHoveredIndex(index);
  }, []);

  useEffect(() => {
    setCategoryBreakdown(calculateCategoryBreakdown(insights, 5));
  }, [insights]);

  const handleClick = (event: any) => {
    // todo: type event
    setSelectedCategory(event.name);
    setLoading(true);
    getAccessTokenSilently()
      .then((accessToken) => getActivitiesByCategory(accessToken, event.name))
      .then((activities) => {
        setActivities(activities.data);
      })
      .finally(() => setLoading(false));
  };

  const isExpanded = selectedCategory.length > 0;

  const selectedIndex = categoryBreakdown.findIndex(
    (cur) => cur.category === selectedCategory
  );

  const cardStyles = isExpanded
    ? {
        flexGrow: 2,
        maxWidth: "800px",
        transition: "all 0.2s linear 0s",
      }
    : {
        flexGrow: 1,
        maxWidth: "400px",
        transition: "all 0.2s linear 0s",
      };

  return (
    <Card style={cardStyles}>
      <Card.Body>
        <Card.Title>Category Breakdown</Card.Title>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
            cursor: isExpanded ? "pointer" : "default",
          }}
        >
          <PieChart width={360} height={360}>
            <Pie
              dataKey="value"
              isAnimationActive={false}
              data={categoryBreakdown.map(({ category, amount }) => ({
                name: category,
                value: amount,
              }))}
              activeShape={activeSlice}
              activeIndex={selectedIndex === -1 ? hoveredIndex : selectedIndex}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
              onClick={handleClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={() => setHoveredIndex(-1)}
              style={{ cursor: "pointer" }}
            >
              {categoryBreakdown.map(({ category }, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    isExpanded &&
                    category !== selectedCategory &&
                    index !== hoveredIndex
                      ? "grey"
                      : COLORS_GPT[index % COLORS_GPT.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
          {isExpanded && (
            <div
              style={{ maxWidth: "360px", maxHeight: "360px" }}
              onClick={() => setSelectedCategory("")}
            >
              <h5>Top Activities for {selectedCategory}</h5>
              {loading ? (
                <Spinner animation="border" />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <td>date</td>
                      <td>account</td>
                      <td>description</td>
                      <td>amount</td>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={activity.id}>
                        <td>{activity.date}</td>
                        <td>{activity.account}</td>
                        <td>{activity.desc}</td>
                        <td>{activity.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
