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

export const Insights = ({
    isAuthenticated,
    accessToken,
}: InsightsProps) => {
    const [insights, setInsights] = useState<Array<Insight>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            return;
        }
        setLoading(true);
        // fetch data from /insights endpoint
        getInsights(accessToken).then(result => {
            setInsights(result);
            console.log(111, result);
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

    const monthlySpendings = insights.map(({
        date,
        categories
    }) => {
        return {
            name: date,
            value: Object.keys(categories).reduce((acc, cur) => {
                const amount = categories[cur];
                return acc + (amount > 0 ? amount : 0);
            }, 0)
        };
    });

    const categorySpendingsMappings = insights.reduce((
        acc: {
            [key: string]: number;
        }, 
        monthly: Insight
    ) => {
        Object.keys(monthly.categories).forEach((cur) => {
            const category = cur;
            const amount = monthly.categories[cur];
            if (acc[category]) {
                acc[category] += amount;
            } else {
                acc[category] = amount;
            }
        });
        return acc;
    }, {});
    const serializedData = Object.keys(categorySpendingsMappings).map((key) => {
        return {
            name: key,
            value: categorySpendingsMappings[key]
        }
    }).sort((a, b) => b.value - a.value)
    .filter((cur) => cur.value > 0);
    
    const groupedData = serializedData.slice(0, 5).concat([{
        name: "Others",
        value: serializedData.slice(5).reduce((acc, cur) => {
            return acc + cur.value;
        }, 0)
    }]);

    return (insights.length === 0 || loading)? (
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
                        data={groupedData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                    >
                        {groupedData.map((entry, index) => (
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
                <BarChart width={360} height={360} data={monthlySpendings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
                <Button variant="primary">See Details</Button>
            </Card.Body>
        </Card>
    </div>);
}