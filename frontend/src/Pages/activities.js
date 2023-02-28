import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { deleteCall, getCall, postCall } from '../api';

export function Activities() {
    const [activities, setActivities] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newCategories, setNewCategories] = useState({})
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const { userId } = useParams();

    useEffect(() => {
        // get list of users
        const fetchData = async () => {
            try {
                const result = await getCall(`/activities/${userId}`);
                const resultJson = await result.json();
                if (result.ok){
                    setActivities(resultJson.data)
                }

                const resultCats = await getCall(`/activities/${userId}/categories`);
                const resultCatsJson = await resultCats.json();
                if (result.ok){
                    setCategories(resultCatsJson.data);
                    setSuccessMessage("success!");
                }
            } catch (err) {
                console.log(err);
                setErrorMessage("error uploading user file");
            }
        }
        fetchData();
    }, [userId])

    const updateLocalSavedMapping = (index) => {
        return (event) => {
            const { value } = event.target;
            setNewCategories({
                ...newCategories,
                [index]: value
            });
        }
    }

    const updateMapping = async (desc, cat) => {
        try {
            const resultCats = await postCall(`/activities/${userId}/categories/new`, {
                description: desc,
                category: cat
            });
            const resultCatsJson = await resultCats.json();
            if (resultCats.ok){
                setCategories(resultCatsJson.data);
                setSuccessMessage("success!");
            }
        } catch (err) {
            console.log(err);
            setErrorMessage("error uploading user file");
        }
    }

    const deleteAllActivities = async () => {
        try {
            const deleteResult = await deleteCall(`/activities/${userId}/delete`);
            if (deleteResult.ok){
                const result = await getCall(`/activities/${userId}`);
                const resultJson = await result.json();
                if (result.ok){
                    setActivities(resultJson.data)
                }
            }
        } catch (err) {
            console.log(err);
            setErrorMessage("error uploading user file");
        }
    }

    return (
        <div>
            <h2>Activities</h2>
            <Button onClick={deleteAllActivities}>Delete All</Button>
            {errorMessage? (<div>
                {errorMessage}
            </div>): null
            }
            {successMessage? (
                <div>{successMessage}</div>
            ): null}
            <Table>
                <thead>
                    <tr>
                        <td>
                            Account
                        </td>
                        <td>
                            Date
                        </td>
                        <td>
                            Description
                        </td>
                        <td>
                            Amount
                        </td>
                        <td>
                            Category
                        </td>
                        <td>
                            Actions
                        </td>
                    </tr>
                </thead>
                <tbody>
                    {activities.map((activity, i) => {
                        let category = null;
                        categories.forEach((data) => {
                            if(!category && data.descriptions.includes(activity.descriptions)){
                                category = data.category;
                            }
                        });
                        return (
                            <tr key={i}>
                                <td>{activity.account_type}</td>
                                <td>{activity.date}</td>
                                <td>{activity.descriptions}</td>
                                <td>{activity.amount}</td>
                                <td>{category ?? "No Category"}</td>
                                <td>
                                    <Form.Control value={newCategories[i] ?? ""} onChange={updateLocalSavedMapping(i)}/>
                                    <Button onClick={() => updateMapping(activity.descriptions, newCategories[i])} >Submit</Button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </Table>
        </div>);
}