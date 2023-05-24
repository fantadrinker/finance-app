import React, { useState, useEffect, ChangeEvent } from 'react'
import md5 from 'md5'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useAuth0 } from '@auth0/auth0-react'
import styles from './Upload.module.css'
import { getChecksums, postActivities } from '../../api'

enum ColumnFormat {
  cap1 = 'cap1',
  rbc = 'rbc',
}

const COLUMN_FORMATS = [ColumnFormat.cap1, ColumnFormat.rbc]
const COLUMN_FORMAT_NAMES = Object.freeze({
  [ColumnFormat.cap1]: 'Capital One',
  [ColumnFormat.rbc]: 'RBC',
})

function useFetchPrevCheckSums(
  getAccessToken: () => Promise<string>
): Array<any> {
  const [chksums, setChksums] = useState<Array<string>>([])
  useEffect(() => {
    if (!getAccessToken) {
      return
    }
    if (getAccessToken) {
      getAccessToken()
        .then(accessToken =>
          getChecksums(accessToken).then(data => {
            setChksums(data)
          })
        )
        .catch(err => {
          console.log(err)
        })
    }
  }, [getAccessToken])
  return chksums
}

export const Upload = () => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [fileContent, setFileContent] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [columnFormat, setColumnFormat] = useState<ColumnFormat>(
    ColumnFormat.cap1
  )
  const { getAccessTokenSilently } = useAuth0()

  const chksums = useFetchPrevCheckSums(getAccessTokenSilently)

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
        if (chksums.map(({ chksum }) => chksum).includes(fileChksum)) {
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
    try {
      // processes user file, store in financeData state var
      const token = await getAccessTokenSilently()
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
    <Form className={styles.uploadForm}>
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
        <Form.Control type="file" value={fileName} onChange={updateUserFile} />
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
          disabled={fileContent === null}
        >
          Process File
        </Button>
      </Form.Group>
    </Form>
  )
}
