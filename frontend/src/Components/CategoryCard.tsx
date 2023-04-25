import React, { useContext } from "react";
import Card from 'react-bootstrap/Card';
import { 
    PieChart, 
    Pie, 
    Cell,
    Tooltip, 
} from 'recharts';
import Button from 'react-bootstrap/Button';
import { getActivitiesByCategory } from "../api";
import { AuthContext } from "../AuthContext";


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Activity {
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
}

interface CategoryCardProps {
    cardWidth: number;
    categoryBreakdown: Array<CategoryBreakdown>;
}

export interface CategoryBreakdown {
    category: string;
    amount: number;
}

export const CategoryCard = ({
    cardWidth, 
    categoryBreakdown,
}: CategoryCardProps) => {
    const {
        accessToken
    } = useContext(AuthContext);
    const handleClick = () => {
        getActivitiesByCategory(
            accessToken, 
            categoryBreakdown[0].category
        ).then((activities) => {
            console.log(activities);
        });
    }

    return <Card style={{ width: `${cardWidth}px`, margin: '10px'}}>
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
                    onClick={handleClick}
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
} 