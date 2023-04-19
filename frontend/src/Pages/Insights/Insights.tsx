import React, { useState, useEffect } from "react";
import Spinner from "react-bootstrap/esm/Spinner";
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Link } from "react-router-dom";
import { 
    PieChart, 
    Pie, 
    Cell, 
    Legend, 
    Tooltip, 
    BarChart, 
    YAxis, 
    XAxis, 
    Bar, 
    CartesianGrid,
} from 'recharts';
import { getInsights } from "../../api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Insight {
    date: string;
    categories: Record<string, number>;
}

interface InsightsProps {
    isAuthenticated: boolean;
    accessToken: string|null;
}

interface CategoryBreakdown {
    category: string;
    amount: number;
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


export const Insights = ({
    isAuthenticated,
    accessToken,
}: InsightsProps) => {
    const [categoryBreakdown, setCategoryBreakdown] = useState<Array<CategoryBreakdown>>([]);
    const [monthlyBreakdown, setMonthlyBreakdown] = useState<Array<MonthlyBreakdown>>([]);
    const [loading, setLoading] = useState<boolean>(false);
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
        <Card style={{ width: '400px', margin: '10px' }}>
            <Card.Body>
                <Card.Title>Category Breakdown</Card.Title>
                <PieChart width={360} height={360}>
                    <Pie
                        dataKey="value"
                        isAnimationActive={false}
                        data={categoryBreakdown.map(({category, amount}) => ({name: category, value: amount}))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                    >
                        {categoryBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
                <Button variant="primary">See Details</Button>
            </Card.Body>
        </Card>
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
    </div>);
}