import React, { useContext, useEffect, useState } from "react";
import Card from 'react-bootstrap/Card';
import { 
    PieChart, 
    Pie, 
    Cell,
    Tooltip, 
} from 'recharts';
import Button from 'react-bootstrap/Button';
import { Insight, getActivitiesByCategory } from "../api";
import { AuthContext } from "../AuthContext";
import { Table } from "react-bootstrap";


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Activity {
    id: string;
    date: string;
    account: string;
    amount: number;
    category: string;
    desc: string;
}

interface CategoryCardProps {
    cardWidth: number;
    insights: Array<Insight>;
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

interface CategoryBreakdown {
    category: string;
    amount: number;
}

export const CategoryCard = ({
    cardWidth, 
    insights
}: CategoryCardProps) => {
    const {
        accessToken
    } = useContext(AuthContext);

    const [categoryBreakdown, setCategoryBreakdown ] = useState<Array<CategoryBreakdown>>([]);
    const [activities, setActivities] = useState<Array<Activity>>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        setCategoryBreakdown(
            calculateCategoryBreakdown(insights, 5)
        );
    }, [insights]);

    const handleClick = () => {
        setLoading(true);
        getActivitiesByCategory(
            accessToken, 
            categoryBreakdown[0].category
        ).then((activities) => {
            setActivities(activities.data);
        }).finally(() => setLoading(false));
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
            <div>
                {activities.length > 0? <h5>Activities</h5> : null}
                <Table>
                    <thead>
                        <tr>
                            <td>date</td>
                            <td>account</td>
                            <td>description</td>
                            <td>category</td>
                            <td>amount</td>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((activity) => (
                            <tr key={activity.id}>
                                <td>{activity.date}</td>
                                <td>{activity.account}</td>
                                <td>{activity.desc}</td>
                                <td>{activity.category}</td>
                                <td>{activity.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </Card.Body>
    </Card>
} 