import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';

/* 
    Implements main page, displays 3 sections:
    1. upload file
    2. display data row by row
    3. display chart grouped by category

    TODO:
    1. improve visual
    2. implement download/export
    3. implement save to account
*/

export function Home() {
    // csv format
    const [fileContent, setFileContent] = useState(null);
    const [fileName, setFileName] = useState("");
    const [financeData, setFinanceData] = useState([]);
    const [categoryData, setCategoryData] = useState({});

    const processUserFile = async (event) => {
        event.preventDefault();
        // processes user file, store in financeData state var
        const texts = await fileContent.text();
        const rows = texts.split('\n');
        console.log(111, texts);
        // TODO: then let user assign input columns to output columns?
        // for now we can just use hard-coded mapping
        // example column names: "Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit"
        const processedData = rows.slice(1).reduce((acc, rowStr) => {
            const dataArr = rowStr.split(',');
            if (dataArr.length < 7) {
                return acc;
            }
            // output columns: account, date, desc, category, amount
            return [...acc, {
                date: dataArr[0],
                account: dataArr[2],
                desc: dataArr[3],
                category: dataArr[4],
                amount: dataArr[5] || `-${dataArr[6]}`
            }];
        }, [])
        setFinanceData(processedData);

        const groupByCategorySpending = processedData.reduce((acc, {
            category,
            amount
        }) => {
            const value = parseFloat(amount);
            if(acc[category]) {
                return {
                    ...acc,
                    [category]: acc[category] + value
                };
            }
            return {
                ...acc,
                [category] : value
            }
        }, {});

        setCategoryData(groupByCategorySpending);
    }

    const updateUserFile = event => {
        setFileName(event.target.value);
        setFileContent(event.target.files[0]);
    }

    return (
        <>
            <Form>
                <Form.Group controlId="file" className="mb-3">
                    <Form.Label>File</Form.Label>
                    <Form.Control type="file" value={fileName} onChange={updateUserFile} />
                </Form.Group>
                <Button onClick={processUserFile} type="submit">Process File Locally</Button>
            </Form>

            {financeData.length > 0 && (
                <div className="activity-table">
                    <h2>Processed Activities</h2>
                    <Button>Download</Button>
                    <Button>Save to Account</Button>
                    <Table striped bordered hover>
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
                            {financeData.map(({
                                date, 
                                account,
                                desc,
                                category,
                                amount
                            }, index) => (
                                <tr id={index}>
                                    <td>{date}</td>
                                    <td>{account}</td>
                                    <td>{desc}</td>
                                    <td>{category}</td>
                                    <td>{amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {financeData && (
                <div className="activity-summary">
                    <div id="group-by-category">
                        {Object.keys(categoryData).map(key => (
                            <div key={key}>
                                {key}: {categoryData[key]}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}