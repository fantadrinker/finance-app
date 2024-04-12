import React, { useState, useEffect, ChangeEvent } from 'react'
import md5 from 'md5'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import styles from './Upload.module.css'
import { FileUpload, getUploads, postActivities } from '../../api'
import { useAuth0TokenSilent } from '../../hooks'

enum ColumnFormat {
  cap1 = 'cap1',
  rbc = 'rbc',
}

const COLUMN_FORMATS = [ColumnFormat.cap1, ColumnFormat.rbc]
const COLUMN_FORMAT_NAMES = Object.freeze({
  [ColumnFormat.cap1]: 'Capital One',
  [ColumnFormat.rbc]: 'RBC',
})

function useFetchPrevUploads(token: string | null): Array<FileUpload> {
  const [uploads, setUploads] = useState<Array<FileUpload>>([])
  useEffect(() => {
    if (!token) {
      return
    }
    if (token) {
      getUploads(token)
        .then(data => {
          setUploads(data)
        })
        .catch(err => {
          console.log(err)
        })
    }
  }, [token])
  return uploads
}

export const Upload = () => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [fileContent, setFileContent] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [columnFormat, setColumnFormat] = useState<ColumnFormat>(
    ColumnFormat.cap1
  )
  const token = useAuth0TokenSilent()
  const uploads = useFetchPrevUploads(token)

  const updateUserFile = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) {
      return
    }
    const fileName = target.value
    const fileContent = target.files[0]
    setFileName(fileName)
    setFileContent(fileContent)

    fileContent
      .text()
      .then(text => {
        const fileChksum = md5(text).toString()
        if (uploads.map(({ checksum }) => checksum).includes(fileChksum)) {
          setWarningMessage(
            'our server indicates this file has already been processed'
          )
        }
      })
      .catch(err => {
        console.log('error when parsing file text', err)
        setErrorMessage('error when parsing file text')
      })
  }

  const processUserFile = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) {
      setErrorMessage('not authenticated')
      return
    }
    try {
      // processes user file, store in financeData state var
      const response = await postActivities(
        token,
        columnFormat.toString(),
        fileContent!
      )
      if (!response.ok) {
        setErrorMessage('error when processing file')
      }
    } catch (e) {
      setErrorMessage('error when processing file' + e.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Form className={styles.uploadForm}>
        <h2>Upload a File</h2>
        {warningMessage !== null && (
          <Form.Text className={styles.warningMessage}>
            {warningMessage}
          </Form.Text>
        )}
        {errorMessage !== null && (
          <Form.Text className={styles.errorMessage}>{errorMessage}</Form.Text>
        )}
        <Form.Group controlId="file" className="mb-3">
          <Form.Label>Select File</Form.Label>
          <Form.Control
            role="file"
            type="file"
            value={fileName}
            onChange={updateUserFile}
          />
          <Form.Label>Choose Format</Form.Label>
          <Form.Select
            aria-label="select input type"
            value={columnFormat}
            onChange={e => setColumnFormat(e.target.value as ColumnFormat)}
          >
            {COLUMN_FORMATS.map(key => {
              return (
                <option key={key} value={key}>
                  {COLUMN_FORMAT_NAMES[key]}
                </option>
              )
            })}
          </Form.Select>
          <Button
            onClick={processUserFile}
            type="submit"
            role="submit"
            disabled={fileContent === null}
          >
            Process File
          </Button>
        </Form.Group>
      </Form>
      <div>
        <h2>Previous Uploads</h2>
        <ul>
          {uploads.map(({ checksum, start_date, end_date }) => {
            return (
              <li key={checksum}>
                {start_date} - {end_date}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
