import React, { useState, useEffect, useContext } from "react";
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
import { getInsights, Insight } from "../../api";
import { Modal } from "react-bootstrap";
import { CategoryCard } from "../../Components/CategoryCard";
import { AuthContext } from "../../AuthContext";

interface MonthlyBreakdown {
    month: string;
    amount: number;
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

export const Insights = () => {
    const {
        accessToken,
        isAuthenticated
    } = useContext(AuthContext)
    const [insights, setInsights] = useState<Array<Insight>>([]);
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
            setInsights(result);
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

    return (insights.length === 0 || loading)? (
        <Spinner animation="border" role="status" />
    ) : (
    <div style={{
        display: 'flex',
        padding: '20px',
    }}>
        <CategoryCard 
            cardWidth={400}
            insights={insights}
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