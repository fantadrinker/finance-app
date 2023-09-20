import React, { useState } from "react"
import { Form, Table } from "react-bootstrap"

interface WishedItem {
  name: string,
  description: string,
  url: string,
  price: number,
}


export function Wishlist() {
  const [items, setItems] = useState<WishedItem[]>([])
  const [newName, setNewName] = useState<string>("")
  const [newDescription, setNewDescription] = useState<string>("")
  const [newUrl, setNewUrl] = useState<string>("")
  const [newPrice, setNewPrice] = useState<number>(0)

  function addNewItem(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault()
    setItems([...items, {
      name: newName,
      description: newDescription,
      url: newUrl,
      price: newPrice,
    }])
    setNewName("")
    setNewDescription("")
    setNewUrl("")
    setNewPrice(0)
  }

  return (<div className="flex flex-column" >
    <h1>Wishlist</h1>

    <Form className="flex flex-row" >
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label for="item-name">Name</Form.Label>
        <Form.Control id="item-name" type="text" placeholder="Enter name" value={newName} onChange={e => setNewName(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label for="item-description" >Description</Form.Label>
        <Form.Control id="item-description" type="text" placeholder="Enter description" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label for="item-url" >URL</Form.Label>
        <Form.Control id="item-url" type="text" placeholder="Enter URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label for="item-price" >Price</Form.Label>
        <Form.Control id="item-price" type="number" placeholder="Enter price" value={newPrice} onChange={e => setNewPrice(parseInt(e.target.value))} />
      </Form.Group>
      <button type="submit" className="btn btn-primary" onClick={addNewItem}>Submit</button>
    </Form>

    <Table className="mt-2" striped bordered hover>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>URL</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          return (<tr key={index}>
            <td>{item.name}</td>
            <td>{item.description}</td>
            <td>{item.url}</td>
            <td>{item.price}</td>
          </tr>)
        })}
      </tbody>
    </Table>
  </div>)
}
