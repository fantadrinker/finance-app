import Button from 'react-bootstrap/Button';
import FormGroup from 'react-bootstrap/esm/FormGroup';
import Form from 'react-bootstrap/Form';

export function Upload() {
    return (
        <div>
            <Form>
                <FormGroup controlId="file" className="mb-3">
                    <Form.Label>File</Form.Label>
                    <Form.Control type="file" />
                </FormGroup>
                <Button type="submit">Upload</Button>
            </Form>
        </div>
    )
}