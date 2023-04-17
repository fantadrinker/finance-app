import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/esm/Button";
import Table from "react-bootstrap/esm/Table";
import { Link } from "react-router-dom";
import { getCall, postCall, deleteCall } from "../../api";
import UpdateMappingModal from "../../Components/UpdateMappingModal";

export const Preferences = ({
    isAuthenticated,
    accessToken,
}) => {
    // supports display, update and delete description to category mappings
    const [mappings, setMappings] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    useEffect(() => {
        // fetch data from /preferences endpoint
        getCall("/mappings", accessToken).then(result => {
            if(!result.ok) {
                return [];
            }
            return result.json();
        }).then(resultJson => {
            if(!resultJson) {
                console.log("error fetching preferences");
            }
            setMappings(resultJson.data);
        })
    }, [accessToken]);


    if (!isAuthenticated) {
        return (
            <div>Not authenticated, please <Link to="/login">Log in </Link></div>
        )
    }

    const openModalWithParams = (desc, cat) => {
        setDescription(desc);
        setCategory(cat);
        setShowModal(true);
    }
    const deleteMapping = (sk) => {
        // calls delete /mappings endpoint
        deleteCall(`/mappings?id=${sk}`, accessToken)
        .then(result => {
            if(!result.ok) {
                return [];
            }
            getCall("/mappings", accessToken).then(result => {
                if(!result.ok) {
                    return [];
                }
                return result.json();
            }).then(resultJson => {
                if(!resultJson) {
                    console.log("error fetching preferences");
                }
                setMappings(resultJson.data);
            })
        })
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
        <div>
            <h1>Preferences</h1>
            {mappings.length === 0 ? (<div>
                No preferences found
            </div>): (<Table>
                <thead>
                    <tr>
                        <td>Category</td>
                        <td>Description</td>
                        <td>Actions</td>
                    </tr>
                </thead>
                <tbody>
                    {
                        mappings.map(({
                            sk,
                            category,
                            description,
                        }) => (
                            <tr key={category}>
                                <td>{category}</td>
                                <td>
                                    {description}
                                </td>
                                <td>
                                    <Button onClick={() => openModalWithParams(description, category)}>Update</Button>
                                    <Button onClick={() => deleteMapping(sk)}>Delete</Button>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </Table>)}
            
            <UpdateMappingModal
                show={showModal}
                closeModal={() => setShowModal(false)}
                currentCategory={category}
                currentDescription={description}
                allCategories={[]}
                submit={updateNewCategory}
            />
        </div>
    )
}
