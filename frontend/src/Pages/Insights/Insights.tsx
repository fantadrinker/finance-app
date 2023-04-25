import React, { useState, useEffect } from "react";
import Spinner from "react-bootstrap/esm/Spinner";
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Link } from "react-router-dom";
import { 
    Legend, 
    Tooltip, 
    BarChart, 
    YAxis, 
    XAxis, 
    Bar, 
    CartesianGrid,
} from 'recharts';
import { getInsights, getActivitiesByCategory } from "../../api";
import { Modal } from "react-bootstrap";
import { CategoryBreakdown, CategoryCard } from "../../Components/CategoryCard";

interface Insight {
    date: string;
    categories: Record<string, number>;
}

interface InsightsProps {
    isAuthenticated: boolean;
    accessToken: string|null;
}

interface MonthlyBreakdown {
    month: string;
    amount: number;
}

function calculateCategoryBreakdown(insights: Array<Insight>, displayTop: number | null): Array<CategoryBreakdown> {
    const allCategories = insights.reduce((
        acc: Array<CategoryBreakdown>, 
        cur: Insight
    ) => {
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
        }
        );
        return acc;
    }, []).map((cur) => {
        return {
            ...cur,
            amount: Math.round(cur.amount * 100) / 100,
        }
    }).filter((cur) => cur.amount > 0);
    allCategories.sort((a, b) => b.amount - a.amount);
    if (!displayTop) {
        return allCategories;
    }
    const others: CategoryBreakdown = {
        category: "Others",
        amount: allCategories.slice(displayTop).reduce((acc, cur) => acc + cur.amount, 0)
    }
    return [...allCategories.slice(0, displayTop), others];
}

function calculateMonthlyBreakdown(insights: Array<Insight>, numMonths: number | null): Array<MonthlyBreakdown> {
    const allMonths = insights.map(({
        date,
        categories
    }) => {
        return {
            month: date,
            amount: Object.keys(categories).reduce((acc, cur) => {
                const amount = categories[cur];
                return acc + (amount > 0 ? amount : 0);
            }, 0)
        };
    }).sort((a, b) => {
        return new Date(a.month).getTime() - new Date(b.month).getTime();
    });
    if (!numMonths) {
        return allMonths;
    }
    return allMonths.slice(0, numMonths);
}

/**
 * TODO: 1. add a stacked bar chart to show the breakdown of each category https://recharts.org/en-US/examples/StackedBarChart
 * 2. onClick event handler for each category to open a pop up and show the top 5 transactions for that category
 * 3. custom shape when hovering on the chart https://recharts.org/en-US/examples/CustomActiveShapePieChart
 * @param param0 
 * @returns 
 */

export const Insights = ({
    isAuthenticated,
    accessToken,
}: InsightsProps) => {
    const [categoryBreakdown, setCategoryBreakdown] = useState<Array<CategoryBreakdown>>([]);
    const [monthlyBreakdown, setMonthlyBreakdown] = useState<Array<MonthlyBreakdown>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);

    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            return;
        }
        setLoading(true);
        // fetch data from /insights endpoint
        getInsights(accessToken).then(result => {
            setCategoryBreakdown(
                calculateCategoryBreakdown(result, 5)
            );
            setMonthlyBreakdown(
                calculateMonthlyBreakdown(result, 6)
            );
        }).catch(err => {
            console.log(err);
        }).finally(() => {
            setLoading(false);
        });
    }, [accessToken, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div>Not authenticated, please <Link to="/login">Log in </Link></div>
        )
    }

    return (categoryBreakdown.length === 0 || loading)? (
        <Spinner animation="border" role="status" />
    ) : (
    <div style={{
        display: 'flex',
        padding: '20px',
    }}>
        <CategoryCard 
            cardWidth={400}
            categoryBreakdown={categoryBreakdown}
        />
        <Card style={{ width: '400px', margin: '10px' }}>
            <Card.Body>
                <Card.Title>Monthly Trends</Card.Title>
                <BarChart width={360} height={360} data={monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
                <Button variant="primary">See Details</Button>
            </Card.Body>
        </Card>
        <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Modal heading</Modal.Title>
            </Modal.Header>
            <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                    Close
                </Button>
                <Button variant="primary">
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    </div>);
}