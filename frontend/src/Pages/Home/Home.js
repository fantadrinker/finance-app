import { useEffect, useState } from 'react';
import md5 from 'md5';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';

import styles from './Home.module.css'
import { getCall, postCall, deleteCall } from '../../api';
import UpdateMappingModal from '../../Components/UpdateMappingModal';
import { Link } from 'react-router-dom';

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

const fetchActivities = async (
    nextKey,
    accessToken,
) => {
    const apiResponse = await getCall(`/activities?size=20${nextKey? `&nextDate=${nextKey}`: ""}`, accessToken);
    const {data, LastEvaluatedKey} = await apiResponse.json();
    // great :) now popluate the states with this data
    const financeDataRows = data.map(({
        sk,
        date,
        category,
        account,
        amount,
        description
    }) => {
        return {
            id: sk,
            date,
            category,
            account,
            amount: isNaN(parseFloat(amount))? 0: parseFloat(amount),
            desc: description 
        }
    });
    return {
        financeDataRows,
        lastKey: LastEvaluatedKey.sk,
    }
}

const fetchMappings = async (accessToken) => {
    const apiResponse = await getCall(`/mappings`, accessToken);
    const {data} = await apiResponse.json();
    return data;
}

const useFetchPrevCheckSums = (accessToken) => {
    const [chksums, setChksums] = useState([]);
    useEffect(() => {
        const fetchChkSum = async () => {
            const apiResponse = await getCall(`/chksums`, accessToken);
            const {data} = await apiResponse.json();
            setChksums(data);
        }
        if (accessToken) {
            fetchChkSum();
        }
    }, [accessToken])
    return chksums
}

export function Home({
    isAuthenticated,
    accessToken
}) {
    // csv format
    const [fileContent, setFileContent] = useState(null);
    const [fileName, setFileName] = useState("");
    const [columnFormat, setColumnFormat] = useState(COLUMN_FORMAT_CAP1);
    const [warningMessage, setWarningMessage] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [description, setDescription] = useState(null);
    const [category, setCategory] = useState(null);

    // custom hooks to fetch and store user activities
    const chksums = useFetchPrevCheckSums(accessToken);


    const [financeData, setFinanceData] = useState([]);
    const [categoryMappings, setCategoryMappings] = useState([]);
    const [nextKey, setNextKey] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if(accessToken !== null) {
            setLoading(true);
            fetchActivities(
                null,
                accessToken
            ).then(({
                financeDataRows,
                lastKey,
            }) => {
                if (financeDataRows.length > 0) {
                    setFinanceData(financeDataRows);
                    setNextKey(lastKey);
                    setLoading(false);
                }
            });
            fetchMappings(accessToken).then((data) => {
                setCategoryMappings(data);
            });
        }
    }, [accessToken]);

    // set up scroll listener
    useEffect(() => {
        window.onscroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                if (accessToken && nextKey !== null && nextKey !== undefined) {
                    fetchMoreActivities();
                }
            }
        };
        return () => {
            window.onscroll = null;
        }
    });

    if (!isAuthenticated) {
        return (
            <div>Not authenticated, please <Link to="/login">Log in </Link></div>
        )
    }
    const fetchMoreActivities = () => {
        setLoading(true);
        fetchActivities(nextKey, accessToken).then(({financeDataRows, lastKey}) => {
            setFinanceData([...financeData, ...financeDataRows]);
            setNextKey(lastKey);
            console.log("next key: ", lastKey);
            setLoading(false);
        });
    }

    const deleteActivity = async (id) => {
        const apiResponse = await deleteCall(`/activities?sk=${id}`, accessToken);
        if(apiResponse.ok) {
            fetchActivities(
                null,
                accessToken
            ).then(({
                financeDataRows,
                lastKey,
            }) => {
                if (financeDataRows.length > 0) {
                    setFinanceData(financeDataRows);
                    setNextKey(lastKey);
                    setLoading(false);
                }
            });
        }
    }

    const processUserFile = async (event) => {
        event.preventDefault();
        // processes user file, store in financeData state var
        const apiResponse = await postCall(`/activities?format=${columnFormat}`, fileContent, "text/html", accessToken);
        if (apiResponse.ok) {
            setFinanceData([]);
            setLoading(true);
            fetchActivities(
                null,
                accessToken
            ).then(({
                financeDataRows,
                lastKey,
            }) => {
                if (financeDataRows.length > 0) {
                    setFinanceData(financeDataRows);
                    setNextKey(lastKey);
                    setLoading(false);
                }
            })
        } else {
            console.log("api post call failed");
        }
    }

    const updateUserFile = event => {
        const fileName = event.target.value;
        const fileContent = event.target.files[0];
        setFileName(fileName);
        setFileContent(fileContent);
        
        fileContent.text().then(text => {
            const fileChksum = md5(text).toString();
            if(chksums.map(({
                chksum
            }) => chksum).includes(fileChksum)) {
                setWarningMessage("our server indicates this file has already been processed")
            }
        })
    }

    const openModalWithParams = (desc, cat) => {
        setDescription(desc);
        setCategory(cat);
        setShowModal(true);
    }

    const updateNewCategory = async (desc, newCategory) => {
        // calls post /mappings endpoint to update category mapping
        const apiResponse = await postCall(`/mappings`, {
            description: desc,
            category: newCategory
        }, "application/json", accessToken);
        if (apiResponse.ok) {
            // return the updated activities, then we can update state locally?
            // Should show a pop up indicate the result
            console.log("mapping updated, updated informations should come later");
            setShowModal(false);
        }
    }

    return (
        <div className={styles.homeMain}>
            <Form>
                <Form.Group as={Row} controlId="file" className="mb-3">
                    {warningMessage !== null && (<Form.Text className={styles.warningMessage}>{warningMessage}</Form.Text>)}
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
            {(financeData.length === 0 && !loading) && <div className={styles.noData}>No data to display</div>}
            {(financeData.length === 0 && loading) && <Spinner animation="border" />}
            {financeData.length > 0 && (
                <div className={styles.activityTable}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <td>date</td>
                                <td>account</td>
                                <td>description</td>
                                <td>category</td>
                                <td>amount</td>
                                <td>actions</td>
                            </tr>
                        </thead>
                        <tbody>
                            {financeData.map(({
                                id,
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
                                    <td style={{display: 'flex'}}>
                                        <Form.Select onChange={() => {}}>
                                            {category && <option value={category}>{category}</option>}
                                            <option value="new category">new category</option>
                                        </Form.Select>
                                        <Button onClick={() => openModalWithParams(desc, category)}>Update</Button>
                                    </td>
                                    <td>{amount}</td>
                                    <td>
                                        <Button variant="danger" onClick={() => deleteActivity(id)}>Delete</Button>
                                        
                                    </td>
                                </tr>
                            ))}
                            {nextKey !== null && nextKey !== undefined && (
                                <tr>
                                    <td colSpan="5">
                                        {loading? <Spinner animation="border" />: null}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            )}
            <UpdateMappingModal 
                show={showModal}
                closeModal={() => setShowModal(false)}
                currentCategory={category}
                currentDescription={description}
                allCategories={categoryMappings.map(({category}) => category)}
                submit={updateNewCategory}
            />
        </div>
    )
}