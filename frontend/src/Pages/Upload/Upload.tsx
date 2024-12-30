import React, { useState, useEffect, ChangeEvent, useMemo, useCallback } from 'react'
import md5 from 'md5'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Toast from 'react-bootstrap/Toast'
import styles from './Upload.module.css'
import { ActivityRow, FileUpload, getUploads, previewActivities } from '../../api'
import { useAuth0TokenSilent } from '../../hooks'
import { ButtonGroup } from 'react-bootstrap'
import { UploadPreviewModal } from '../../Components/UploadPreviewModal'
import {  MultiSelectContextProviderWrapper } from '../../Contexts/MultiSelectContext'
import { ColumnFormat, guessFileFormat } from '../../helpers'


const COLUMN_FORMATS = [ColumnFormat.cap1, ColumnFormat.rbc, ColumnFormat.td]
const COLUMN_FORMAT_NAMES = Object.freeze({
  [ColumnFormat.cap1]: 'Capital One',
  [ColumnFormat.rbc]: 'RBC',
  [ColumnFormat.td]: 'TD'
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

  // file select
  const [fileContent, setFileContent] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [columnFormat, setColumnFormat] = useState<ColumnFormat>(
    ColumnFormat.cap1
  )

  // file previews
  const [previewActivityRows, setPreviewActivityRows] = useState<ActivityRow[] | null>(null)
  const [processingFile, setProcessingFile] = useState<boolean>(false)

  // success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = toastMessage || warningMessage || errorMessage

  const toastType = useMemo(() => {
    if (errorMessage) {
      return 'Error'
    }
    if (warningMessage) {
      return 'Warning'
    }
    if (toastMessage) {
      return 'Message'
    }
    return null
  }, [errorMessage, warningMessage, toastMessage])

  const token = useAuth0TokenSilent()
  const uploads = useFetchPrevUploads(token)

  const closeToast = useCallback(() => {
    setToastMessage(null)
    setWarningMessage(null)
    setErrorMessage(null)
  }, [setToastMessage, setWarningMessage, setErrorMessage])

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
        // then try to guess file format
        const columnFormat = guessFileFormat(fileName, text)
        if(columnFormat !== null) {
          setColumnFormat(columnFormat)
        }
      })
      .catch(err => {
        console.log('error when parsing file text', err)
        setErrorMessage('error when parsing file text')
      })
  }

  const previewUserFile = async (event: React.FormEvent) => {
    setProcessingFile(true)
    event.preventDefault()
    if (!token) {
      setErrorMessage('not authenticated')
      return
    }

    let activities: ActivityRow[] = []
    if (fileContent) {
      try {
        activities = await previewActivities(token, columnFormat.toString(), fileContent!)
        setProcessingFile(false)
      } catch (e) {
        setErrorMessage('error when processing file' + e.message)
      }
    }
    setPreviewActivityRows(activities)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Toast show={!!showToast} onClose={closeToast} >
        <Toast.Header>{toastType}</Toast.Header>
        <Toast.Body>{errorMessage ?? warningMessage ?? toastMessage}</Toast.Body>
      </Toast>
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
        <Form.Group controlId="file" className="mb-3 flex flex-col gap-2">
          <div className="flex flex-row justify-between">
            {COLUMN_FORMATS.map((key) => (
              <Form.Check
                type="radio"
                name="column_format"
                id={`column_format_${key}`}
                key={`column_format_${key}`}
                label={COLUMN_FORMAT_NAMES[key]}
                checked={columnFormat === key}
                onChange={(e) => {
                  if (e.target.value)
                    setColumnFormat(key)
                }}
              />
            ))}
          </div>
          <Form.Control
            role="file"
            type="file"
            value={fileName}
            onChange={updateUserFile}
          />
          <ButtonGroup>
            <Button
              onClick={previewUserFile}
              type="submit"
              role="submit"
              disabled={fileContent === null || processingFile}
            >
              Preview File
            </Button>
            <Button
              onClick={previewUserFile}
            >
              Manually Input
            </Button>
          </ButtonGroup>
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
      <MultiSelectContextProviderWrapper>
        <UploadPreviewModal
          show={!!previewActivityRows}
          closeModal={() => setPreviewActivityRows(null)}
          setToastMessage={setToastMessage}
          activities={previewActivityRows ?? []}
        />
      </MultiSelectContextProviderWrapper>
    </div>
  )
}
