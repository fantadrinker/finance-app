import React, { useState, useEffect } from "react";
import Spinner from "react-bootstrap/esm/Spinner";
import { Link } from "react-router-dom";
import { getInsights, Insight } from "../../api";
import { CategoryCard } from "../../Components/CategoryCard";
import { MonthlyCard } from "../../Components/MonthlyCard";
import { useAuth0 } from "@auth0/auth0-react";

/**
 * TODO: 1. add a stacked bar chart to show the breakdown of each category https://recharts.org/en-US/examples/StackedBarChart
 * @param param0
 * @returns
 */

export const Insights = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [insights, setInsights] = useState<Array<Insight>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    setLoading(true);
    // fetch data from /insights endpoint
    getAccessTokenSilently().then((accessToken) =>
      getInsights(accessToken)
        .then((result) => {
          setInsights(result);
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setLoading(false);
        })
    );
  }, [getAccessTokenSilently, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div>
        Not authenticated, please <Link to="/login">Log in </Link>
      </div>
    );
  }

  return insights.length === 0 || loading ? (
    <Spinner animation="border" role="status" />
  ) : (
    <div
      style={{
        display: "flex",
        flexFlow: "row wrap",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "20px",
        gap: "10px",
      }}
    >
      <CategoryCard insights={insights} />
      <MonthlyCard insights={insights} />
    </div>
  );
};
