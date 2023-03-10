import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import styles from './Home.module.css'
import { processCapitalOneActivities, processRBCActivities } from '../../helpers';

/* 
    Implements main page, displays 3 sections:
    1. upload file
    2. display data row by row
    3. display chart grouped by category

    TODO:
    2. implement download/export
    3. implement save to account
*/

// todo: move these to constants
const COLUMN_FORMAT_CAP1 = "cap1";

const COLUMN_FORMAT_RBC = "rbc";

const funMapping = {
    [COLUMN_FORMAT_CAP1]: processCapitalOneActivities,
    [COLUMN_FORMAT_RBC]: processRBCActivities,
}

export function Home() {
    // csv format
    const [fileContent, setFileContent] = useState(null);
    const [fileName, setFileName] = useState("");
    const [financeData, setFinanceData] = useState([]);
    const [categoryData, setCategoryData] = useState({});
    const [columnFormat, setColumnFormat] = useState(COLUMN_FORMAT_CAP1);

    // todo: useeffect hook to retrieve categories
    // update category mapping?
    const processUserFile = async (event) => {
        event.preventDefault();
        // processes user file, store in financeData state var
        const texts = await fileContent.text();
        const rows = texts.split('\n');
        console.log(111, columnFormat, texts);
        // TODO: then let user assign input columns to output columns?
        // for now we can just use hard-coded mapping
        // example column names: "Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit"
        const processedData = funMapping[columnFormat](rows.slice(1));
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
        <div className={styles.homeMain}>
            <Tabs 
                defaultActiveKey="activities"
                id="uncontrolled-tab-example"
                className="mb-3"
            >
                <Tab eventKey="activities" title="Activities">
                    {financeData.length === 0 && (
                        <Form>
                            <Form.Group as={Row} controlId="file" className="mb-3">
                                <Form.Label column sm="2">Select File</Form.Label>
                                <Col sm="4">
                                    <Form.Control type="file" value={fileName} onChange={updateUserFile} />
                                </Col>
                                <Form.Label column sm="2">Choose Format</Form.Label>
                                <Col sm="4">
                                    <Form.Select aria-label="select input type" value={columnFormat} onChange={e => setColumnFormat(e.target.value)}>
                                        <option value={COLUMN_FORMAT_CAP1}>CapitalOne</option>
                                        <option value={COLUMN_FORMAT_RBC}>RBC</option>
                                    </Form.Select>
                                </Col>
                            </Form.Group>
                            <Button onClick={processUserFile} type="submit" disabled={fileContent === null}>Process File Locally</Button>
                        </Form>
                    )}
                    {financeData.length > 0 && (
                        <div className={styles.activityTable}>
                            <Button variant="outline-primary" disabled>Download</Button>
                            <Button variant="outline-secondary" disabled>Save to Account</Button>
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
                                            <td>
                                                <Form.Select onChange={() => {}}>
                                                    {category && <option value={category}>{category}</option>}
                                                    <option value="new category">new category</option>
                                                </Form.Select>
                                            </td>
                                            <td>{amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Tab>
                <Tab eventKey="categories" title="Categories" disabled={financeData.length === 0}>
                    {financeData.length > 0 && (
                        <div id="group-by-category">
                            {Object.keys(categoryData).map(key => (
                                <div key={key}>
                                    {key}: {categoryData[key]}
                                </div>
                            ))}
                        </div>
                    )}
                </Tab>
            </Tabs>
        </div>
    )
}