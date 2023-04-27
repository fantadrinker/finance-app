import React, { useState, useEffect, useContext } from "react";
import Spinner from "react-bootstrap/esm/Spinner";
import Button from 'react-bootstrap/Button';
import { Link } from "react-router-dom";
import { getInsights, Insight } from "../../api";
import { Modal } from "react-bootstrap";
import { CategoryCard } from "../../Components/CategoryCard";
import { AuthContext } from "../../AuthContext";
import { MonthlyCard } from "../../Components/MonthlyCard";

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
        flexFlow: 'row wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '20px',
        gap: '10px'
    }}>
        <CategoryCard 
            insights={insights}
        />
        <MonthlyCard insights={insights}/>
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