import React, { useEffect } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, YAxis, XAxis, Bar, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Insights = ({
    data
}) => {
    // data is array of monthly summaries
    // each monthly summary has a month and a array of 
    // spendings with category

    // first calculate total spending for each category
    // display in one graph
    const monthlySpendings = data.map(({
        month,
        categories
    }) => {
        return {
            name: month,
            value: categories.reduce((acc, cur) => {
                const amount = parseFloat(cur.amount);
                return acc + (amount > 0 ? amount : 0);
            }, 0)
        };
    });

    const categorySpendingsMappings = data.reduce((acc, monthly) => {
        monthly.categories.forEach((cur) => {
            if (acc[cur.category]) {
                acc[cur.category] += parseFloat(cur.amount);
            } else {
                acc[cur.category] = parseFloat(cur.amount);
            }
        });
        return acc;
    }, {});

    const serializedData = Object.keys(categorySpendingsMappings).map((key) => {
        return {
            name: key,
            value: categorySpendingsMappings[key]
        }
    }).sort((a, b) => a.value < b.value)
    .filter((cur) => cur.value > 0);

    const groupedData = serializedData.slice(0, 5).concat([{
        name: "Others",
        value: serializedData.slice(5).reduce((acc, cur) => {
            return acc + cur.value;
        }, 0)
    }]);

    // then display spending over each month in another graph
    return data.length > 0 && (
        <div style={{width: '800px', height: '800px'}}>
            <ResponsiveContainer width="50%" height="50%">
                <PieChart width={400} height={400}>
                    <Pie
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
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="50%" height="50%">
                <BarChart width={400} height={400} data={monthlySpendings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default Insights;