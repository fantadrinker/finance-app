import { useEffect, useState } from "react"
import FormSelect from "react-bootstrap/esm/FormSelect";
import Table from "react-bootstrap/Table";
import { useParams } from 'react-router-dom';
import { getCall } from "../api";

export function Categories() {
    const [categories, setCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const { userId } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getCall(`/activities/${userId}/categories`);
                const resultJson = await result.json();
                if (result.ok){
                    console.log("fetch success!", resultJson);
                    setCategories(resultJson.data);
                    setSuccessMessage("success!");
                }
            } catch (err) {
                console.log(err);
                setErrorMessage("error uploading user file");
            }
        }
        fetchData();
    }, [userId])
    console.log(111, categories);
    return <div>
        <h2>Categories</h2>

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
                    <td>Category</td>
                    <td>Descriptions</td>
                    <td>Total</td>
                </tr>
            </thead>
            <tbody>
                {
                    categories.map(({
                        category,
                        descriptions,
                        sum
                    }) => (
                        <tr key={category}>
                            <td>{category}</td>
                            <td>
                                <FormSelect>
                                    {descriptions.map(desc => (
                                        <option key={`${category}_${desc}`}>{desc}</option>
                                    ))}
                                </FormSelect>
                            </td>
                            <td>
                                {sum}
                            </td>
                        </tr>
                    ))
                }
            </tbody>
        </Table>
    </div>
}