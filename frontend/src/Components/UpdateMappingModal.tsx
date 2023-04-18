import React, { useEffect, useState } from "react";
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

interface UpdateMappingModalProps {
    show: boolean;
    closeModal: () => void;
    currentCategory: string;
    currentDescription: string;
    allCategories: string[];
    submit: (newCategory: string, newDescription: string) => void;
}

const UpdateMappingModal = ({
    show,
    closeModal,
    currentCategory,
    currentDescription,
    allCategories,
    submit
}: UpdateMappingModalProps) => {
    const [newCategory, setNewCategory] = useState(currentCategory);
    const [selectedCategory, setSelectedCategory] = useState(allCategories.length > 0? currentCategory: "");
    const [newDescription, setNewDescription] = useState(currentDescription);
    // updates state when props change
    useEffect(() => {
        setNewCategory("");
        setSelectedCategory(currentCategory);
        setNewDescription(currentDescription);
    }, [currentCategory, currentDescription, allCategories]);
    const selectCategories = allCategories.includes(currentCategory)? allCategories: allCategories.concat([currentCategory]);
    return (
        <Modal show={show} onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Update Category Mapping</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Label>Description Text</Form.Label>
                <Form.Control type="text" placeholder={currentDescription} value={newDescription ?? ""} onChange={e => setNewDescription(e.target.value)} />
                <Form.Label>Existing Categories</Form.Label>
                <Form.Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    {selectCategories.map((cat, index) => (
                        <option value={cat} key={index} >{cat}</option>
                    ))}
                    <option value="" >new category</option>
                </Form.Select>
                {selectedCategory === "" && (
                    <>
                        <Form.Label>New Category</Form.Label>
                        <Form.Control type="text" placeholder="new category value" value={newCategory ?? ""} onChange={e => setNewCategory(e.target.value)} />
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => submit(newDescription ?? currentDescription, selectedCategory === "" ? newCategory ?? currentCategory: selectedCategory)}>Update Mapping</Button>
                <Button onClick={closeModal}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default UpdateMappingModal;