import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

import styles from './Home.module.css'
import { getActivities, getMappings, postMappings, deleteActivity } from '../../api';
import UpdateMappingModal from '../../Components/UpdateMappingModal';
import { useAuth0 } from '@auth0/auth0-react';

interface FinanceDataRow {
    id: string;
    date: string;
    category: string;
    account: string;
    amount: number;
    desc: string;
}

export function Home() {
    const {
        isAuthenticated,
        getAccessTokenSilently,
    } = useAuth0();

    const [showModal, setShowModal] = useState<boolean>(false);
    const [description, setDescription] = useState<string>("");
    const [category, setCategory] = useState<string>("");

    const [errorMessage, setErrorMessage] = useState<string|null>(null);

    const [financeData, setFinanceData] = useState<Array<FinanceDataRow>>([]);
    const [categoryMappings, setCategoryMappings] = useState<Array<any>>([]);
    const [nextKey, setNextKey] = useState<string|null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(() => {
        if(isAuthenticated) {
            setLoading(true);
            getAccessTokenSilently().then((accessToken) => {
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
            });
        }
    }, [getAccessTokenSilently, isAuthenticated]);

    // set up scroll listener
    useEffect(() => {
        window.onscroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1) {
                if (isAuthenticated && nextKey !== null && nextKey !== undefined) {
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
        if (!isAuthenticated) {
            return;
        }
        getAccessTokenSilently().then((accessToken) => 
            getActivities(accessToken, nextKey).then(({data, nextKey}) => {
                setFinanceData([...financeData, ...data]);
                setNextKey(nextKey);
            }).catch((err) => {
                console.log(err);
                setErrorMessage(`Error fetching activities${err.message}`);
            }).finally(() => {
                setLoading(false);
            })
        );
    }

    const deleteAndFetch = (id: string) => {
        if (!isAuthenticated) {
            return;
        }
        getAccessTokenSilently().then((accessToken) => {
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
        getAccessTokenSilently().then((accessToken) => 
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
            })
        );
    }

    return (
        <div className={styles.homeMain}>
            <h3> All Activities </h3>
            {(financeData.length === 0 && !loading) && <div className={styles.noData}>No data to display</div>}
            {(financeData.length === 0 && loading) && <Spinner animation="border" />}
            {errorMessage && <div className={styles.error}>{errorMessage}</div>}
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