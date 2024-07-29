import React, { useEffect, useState } from 'react'
import { Form, Table } from 'react-bootstrap'
import { addWishlistItem, getWishlist, WishListItem } from '../../api'
import { useAuth0WithTokenSilent } from '../../hooks'

export function Wishlist() {
  // TODO: add auth support
  // TODO: add delete, update actions, hook up create with backend

  const { token, user_id } = useAuth0WithTokenSilent()
  const [items, setItems] = useState<WishListItem[]>([])
  const [newName, setNewName] = useState<string>('')
  const [newDescription, setNewDescription] = useState<string>('')
  const [newUrl, setNewUrl] = useState<string>('')
  const [newPrice, setNewPrice] = useState<number>(0)

  useEffect(() => {
    // fetch items from backend
    if (!user_id || !token) { return }
    getWishlist(user_id, token).then(res => {
      setItems(res)
    })
  }, [token])

  function addNewItem(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    if (!user_id || !token) { return }
    e.preventDefault()

    addWishlistItem(user_id, token, {
      name: newName,
      description: newDescription,
      url: newUrl,
      price: newPrice,
    }).then(res => {
      if (res.status !== 200) {
        console.log('error adding item')
        return
      }
      setNewName('')
      setNewDescription('')
      setNewUrl('')
      setNewPrice(0)
      getWishlist(user_id, token).then(res => {
        setItems(res)
      })
    })
  }

  return (
    <div className="flex flex-column">
      <h1>Wishlist</h1>

      <Form className="flex flex-row">
        <Form.Group className="mb-3">
          <Form.Label htmlFor="item-name">Name</Form.Label>
          <Form.Control
            id="item-name"
            type="text"
            placeholder="Enter name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="item-description">Description</Form.Label>
          <Form.Control
            id="item-description"
            type="text"
            placeholder="Enter description"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="item-url">URL</Form.Label>
          <Form.Control
            id="item-url"
            type="text"
            placeholder="Enter URL"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="item-price">Price</Form.Label>
          <Form.Control
            id="item-price"
            type="number"
            placeholder="Enter price"
            value={newPrice}
            onChange={e => setNewPrice(parseInt(e.target.value))}
          />
        </Form.Group>
        <button type="submit" className="btn btn-primary" onClick={addNewItem}>
          Submit
        </button>
      </Form>

      <Table className="mt-2" striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>URL</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            return (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.description}</td>
                <td>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    link
                  </a>
                </td>
                <td>{item.price}</td>
                <td>
                  <button className="btn btn-danger">Delete</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
