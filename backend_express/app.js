const express = require('express')
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");


const app = express()
const port = 3123
const client = new DynamoDBClient({ region: "us-east-1" })

app.get('/test_connect', (req, res) => {
  const command = new ScanCommand({
    TableName: process.env.ACTIVITIES_TABLE,
    Limit: 10
  })
  client.send(command).then((data) => {
    console.log(111, data)
    res.send(data.Items)
  }).catch((error) => {
    console.log(222, error)
    res.send(error)
  })
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}, hit / to test healthcheck, and /test_connect to test dynamodb connection!`)
})