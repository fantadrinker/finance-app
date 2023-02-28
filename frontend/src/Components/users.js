import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import { getCall, postCall } from '../api';

export function Users() {
    const [username, setUsername] = useState("");
    const [userList, setUserList] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [files, setFiles] = useState({});

    const handleSubmit = async () => {
        try {
            console.log("submitting user creation request", username);
            const result = await postCall('/activities/user', {
                user_name: username
            });
            const createUserResult = await result.json();
            if (!result.ok) {
                setErrorMessage(createUserResult);
                return
            }
            const usersResult = await getCall('/activities/user/all');
            const jsonResult = await usersResult.json()
            if (!usersResult.ok) {
                setErrorMessage(jsonResult);
                return;
            }
            setUserList(jsonResult.data);
        } catch(err) {
            console.log("error", err);
            setErrorMessage("error creating user");
        }
    }

    const updateUserFile = (userId) => {
        return event => {
            setFiles({
                ...files,
                [userId]: {
                    fileName: event.target.value,
                    fileContent: event.target.files[0]
                }
            });
        }
    }

    const submitUserFile = (userId) => {
        return async () => {
            try {
                const file = await files[userId].fileContent.text()
                const result = await postCall('/activities/' + userId + '/upload', file, 'text/html');
                const resultJson = await result.json();
                if (result.ok){
                    console.log("upload success!", resultJson);
                    setSuccessMessage(`${resultJson.processed_count} uploaded, ${resultJson.success_count} processed`)
                }
            } catch (err) {
                console.log(err);
                setErrorMessage("error uploading user file");
            }
        }
    }

    useEffect(() => {
        // get list of users
        const fetchData = async () => {
            try {
                const result = await getCall('/activities/user/all');
                const resultJson = await result.json();
                if (!result.ok){
                    setErrorMessage(resultJson);
                    return;
                }
                console.log(111, resultJson);
                setUserList(resultJson.data);
            } catch (err) {
                console.log("error", err);
            }
        }
        fetchData();
    }, [])

    return (<>
        <div>
            <h2>New User</h2>
            <div>user name</div>
            <input value={username} onChange={e => setUsername(e.target.value)} />
            <Button variant="primary" onClick={handleSubmit}>Create User</Button>
        </div>
        {errorMessage? (<div>
            {errorMessage}
        </div>): null
        }
        {successMessage? (
            <div>{successMessage}</div>
        ): null}
    
        <div>
            <h2>User List</h2>
            <Table>
                <thead>
                    <tr>
                        <td>UserName</td>
                        <td>UploadFile</td>
                        <td>Action</td>
                    </tr>
                </thead>
                <tbody>
                    {
                        userList.map(user => (
                            <tr key={user.user_name}>
                                <td>
                                    {user.user_name}
                                </td>
                                <td>
                                    <Form.Control 
                                        type="file" 
                                        value={files[user.user_name]?.fileName} 
                                        onChange={updateUserFile(user.user_name)} 
                                    />
                                </td>
                                <td>
                                    <Button onClick={submitUserFile(user.user_name)} >Submit</Button>
                                    <Link to={`/activities/${user.user_name}`} >Get Activities</Link>
                                    <Link to={`/categories/${user.user_name}`} >Get User Categories </Link>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </Table>
        </div>
    </>)
}