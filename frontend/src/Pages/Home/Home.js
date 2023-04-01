import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useAuth0, withAuth0 } from "@auth0/auth0-react";

import styles from './Home.module.css'
import { downloadFinanceData } from '../../helpers';
import Login from '../Login/Login';
import { getCall, postCall } from '../../api';
import { getConfig } from '../../config';

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

const useAuth0AccessToken = (isAuthenticated, getToken) => {
    const [accessToken, setToken] = useState(null);
    useEffect(() => {
        const fetchAuth0Token = async () => {
            const config = getConfig();
            try {
                const token = await getToken({
                  authorizationParams: {
                    audience: config.audience,
                  },
                });
                setToken(token);
            } catch (e) {
                // Handle errors such as `login_required` and `consent_required` by re-prompting for a login
                console.error(e);
            }
        }
        if (isAuthenticated){
            fetchAuth0Token();
        }
    }, [getToken, isAuthenticated]);
    
    return accessToken;
}

const useFetchActivities = (accessToken, fetchFlag) => {
    const [financeData, setFinanceData] = useState([]);
    const [analyticsData, setAnalyticsData] = useState([]);
    const [nextKey, setNextKey] = useState(null);
    useEffect(() => {
        const fetchActivities = async () => {
            const apiResponse = await getCall(`/activities?size=20`, accessToken);
            const {data, LastEvaluatedKey} = await apiResponse.json();
            // great :) now popluate the states with this data
            setFinanceData(data.map(({
                date,
                category,
                account,
                amount,
                description
            }) => {
                return {
                    date,
                    category,
                    account,
                    amount: isNaN(parseFloat(amount))? 0: parseFloat(amount),
                    desc: description 
                }
            }));
            setAnalyticsData(data.reduce((acc, {
                category,
                amount
            }) => {
                const oldVal = acc[category] ?? 0;
                if (isNaN(parseFloat(amount))) {
                    return acc;
                }
                return {
                    ...acc,
                    [category]: oldVal + parseFloat(amount)
                }
            }, {}))
            setNextKey(LastEvaluatedKey.date);
        }
        if(accessToken !== null) {
            fetchActivities()
        }
    }, [accessToken, fetchFlag])
    return {
        financeData,
        analyticsData,
        nextKey
    }
}

function Home(props) {
    // csv format
    const [fileContent, setFileContent] = useState(null);
    const [fileName, setFileName] = useState("");
    const [columnFormat, setColumnFormat] = useState(COLUMN_FORMAT_CAP1);
    const [fetchFlag, setFetchFlag] = useState(false);
    const {
        user,
        isAuthenticated,
        getAccessTokenSilently
    } = useAuth0();

    // custom hooks to fetch and store user activities
    const accessToken = useAuth0AccessToken(isAuthenticated, getAccessTokenSilently)
    const {
        financeData,
        analyticsData
    } = useFetchActivities(accessToken, fetchFlag);

    if (!isAuthenticated) {
        return <Login />;
    }

    // todo: useeffect hook to retrieve categories
    // update category mapping?
    const processUserFile = async (event) => {
        event.preventDefault();
        // processes user file, store in financeData state var
        const texts = await fileContent.text();
        const apiResponse = await postCall(`/activities?format=${columnFormat}`, texts, "text/html", accessToken);
        console.log(222, apiResponse.text(), user);
        setFetchFlag(!fetchFlag);
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
                        <Button onClick={processUserFile} type="submit" disabled={fileContent === null}>Process File</Button>
                    </Form>
                    {financeData.length > 0 && (
                        <div className={styles.activityTable}>
                            <Button variant="outline-primary" onClick={() => downloadFinanceData(financeData)}>Download</Button>
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
                                        <tr key={index}>
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
                            {Object.keys(analyticsData).map(key => (
                                <div key={key}>
                                    {key}: {analyticsData[key]}
                                </div>
                            ))}
                        </div>
                    )}
                </Tab>
            </Tabs>
        </div>
    )
}

export default withAuth0(Home);