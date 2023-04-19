import React, { ChangeEvent, useEffect, useState } from 'react';
import md5 from 'md5';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';

import styles from './Home.module.css'
import { getActivities, getMappings, getChecksums, postActivities, postMappings, deleteActivity } from '../../api';
import UpdateMappingModal from '../../Components/UpdateMappingModal';
import { Link } from 'react-router-dom';

enum ColumnFormat {
    cap1 = "cap1",
    rbc = "rbc",
}

const COLUMN_FORMATS = [ColumnFormat.cap1, ColumnFormat.rbc];
const COLUMN_FORMAT_NAMES = Object.freeze({
    [ColumnFormat.cap1]: "Capital One",
    [ColumnFormat.rbc]: "RBC",
})

interface FinanceDataRow {
    id: string;
    date: string;
    category: string;
    account: string;
    amount: number;
    desc: string;
}

function useFetchPrevCheckSums(accessToken: string | null): Array<any> {
    const [chksums, setChksums] = useState<Array<string>>([]);
    useEffect(() => {
        if (!accessToken) {
            return;
        }
        if (accessToken) {
            getChecksums(accessToken).then((data) => {
                setChksums(data);
            }).catch((err) => {
                console.log(err);
            });
        }
    }, [accessToken])
    return chksums;
}

interface HomeProps {
    isAuthenticated: boolean;
    accessToken: string|null;
}

export function Home({
    isAuthenticated,
    accessToken
}: HomeProps) {
    // csv format
    const [fileContent, setFileContent] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [columnFormat, setColumnFormat] = useState<ColumnFormat>(ColumnFormat.cap1);
    const [warningMessage, setWarningMessage] = useState<string|null>(null);
    const [errorMessage, setErrorMessage] = useState<string|null>(null);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [description, setDescription] = useState<string>("");
    const [category, setCategory] = useState<string>("");

    // custom hooks to fetch and store user activities
    const chksums = useFetchPrevCheckSums(accessToken);


    const [financeData, setFinanceData] = useState<Array<FinanceDataRow>>([]);
    const [categoryMappings, setCategoryMappings] = useState<Array<any>>([]);
    const [nextKey, setNextKey] = useState<string|null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(() => {
        if(accessToken) {
            setLoading(true);
            getActivities(
                accessToken,
                null
            ).then(({
                data,
                nextKey,
            }) => {
                setFinanceData(data);
                setNextKey(nextKey);
            }).catch((err) => {
                console.log(err);
                setErrorMessage(`Error fetching activities${err.message}`);
            }).finally(() => {
                setLoading(false);
            });
            getMappings(accessToken).then((data) => {
                setCategoryMappings(data);
            }).catch((err) => {
                console.log(err);
                setErrorMessage(`Error fetching activities${err.message}`);
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

    if (!isAuthenticated || accessToken === null) {
        return (
            <div>Not authenticated, please <Link to="/login">Log in </Link></div>
        )
    }
    const fetchMoreActivities = () => {
        setLoading(true);
        if (accessToken === null) {
            return;
        }
        getActivities(accessToken, nextKey).then(({data, nextKey}) => {
            setFinanceData([...financeData, ...data]);
            setNextKey(nextKey);
        }).catch((err) => {
            console.log(err);
            setErrorMessage(`Error fetching activities${err.message}`);
        }).finally(() => {
            setLoading(false);
        });
    }

    const deleteAndFetch = (id: string) => {
        if (accessToken === null) {
            return;
        }
        deleteActivity(accessToken, id).then((response) => {
            if(response.ok){
                getActivities(
                    accessToken,
                    null
                ).then(({
                    data,
                    nextKey,
                }) => {
                    setFinanceData(data);
                    setNextKey(nextKey);
                }).catch((err) => {
                    console.log(err);
                    setErrorMessage(`Error fetching activities${err.message}`);
                }).finally(() => {
                    setLoading(false);
                });
            }
        }).catch((err) => {
            console.log(err);
            setErrorMessage(`Error deleting activities${err.message}`);
        });
    }

    const processUserFile = async (event: React.FormEvent) => {
        event.preventDefault();
        // processes user file, store in financeData state var
        postActivities(
            accessToken, 
            columnFormat.toString(), 
            fileContent!
        ).then(() => {
            setFinanceData([]);
            setLoading(true);
            getActivities(
                accessToken,
                null
            ).then(({
                data,
                nextKey,
            }) => {
                setFinanceData(data);
                setNextKey(nextKey);
            }).catch((err) => {
                console.log(err);
                setErrorMessage(`Error fetching activities${err.message}`);
            }).finally(() => {
                setLoading(false);
            });
        }).catch((err) => {
            console.log(err);
            setErrorMessage(`Error posting activities${err.message}`);
        });
    }

    const updateUserFile = (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) {
            return;
        }
        const fileName = target.value;
        const fileContent = target.files[0];
        setFileName(fileName);
        setFileContent(fileContent);
        
        fileContent.text().then(text => {
            const fileChksum = md5(text).toString();
            if(chksums.map(({
                chksum
            }) => chksum).includes(fileChksum)) {
                setWarningMessage("our server indicates this file has already been processed")
            }
        }).catch(err => {
            console.log("error when parsing file text", err);
            setErrorMessage("error when parsing file text");
        });
    }

    const openModalWithParams = (
        desc: string, 
        cat: string
    ) => {
        setDescription(desc);
        setCategory(cat);
        setShowModal(true);
    }

    function updateNewCategory(
        desc: string, 
        newCategory: string
    ): void {
        // calls post /mappings endpoint to update category mapping
        postMappings(
            accessToken, 
            {
                description: desc,
                category: newCategory
            }
        ).then((apiResponse) => {
            if (apiResponse.ok) {
                // return the updated activities, then we can update state locally?
                // Should show a pop up indicate the result
                console.log("mapping updated, updated informations should come later");
                setShowModal(false);
            }
        }).catch((err) => {
            console.log(err);
            setErrorMessage(`Error updating category mapping${err.message}`);
        });
    }

    return (
        <div className={styles.homeMain}>
            <Form>
                <Form.Group as={Row} controlId="file" className="mb-3">
                    {warningMessage !== null && (<Form.Text className={styles.warningMessage}>{warningMessage}</Form.Text>)}
                    {errorMessage !== null && (<Form.Text className={styles.errorMessage}>{errorMessage}</Form.Text>)}
                    <Form.Label column sm="2">Select File</Form.Label>
                    <Col sm="4">
                        <Form.Control type="file" value={fileName} onChange={updateUserFile} />
                    </Col>
                    <Form.Label column sm="2">Choose Format</Form.Label>
                    <Col sm="4">
                        <Form.Select aria-label="select input type" value={columnFormat} onChange={(e) => setColumnFormat(e.target.value as ColumnFormat)}>
                            {COLUMN_FORMATS.map((key) => {
                                return (
                                    <option key={key} value={key}>{COLUMN_FORMAT_NAMES[key]}</option>
                                )
                            })
                            }
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
                                        <Button variant="danger" onClick={() => deleteAndFetch(id)}>Delete</Button>
                                        
                                    </td>
                                </tr>
                            ))}
                            {nextKey !== null && nextKey !== undefined && (
                                <tr>
                                    <td colSpan={5}>
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

export default Home;